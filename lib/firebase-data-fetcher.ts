import {
  fetchAttendanceData,
  fetchClientsData,
  fetchDeliverablesData,
  fetchEnquiryData,
  fetchEventsData,
  fetchPackagesData,
  fetchProjectsData,
  fetchSalaryData,
  fetchShootsData,
  fetchTasksData,
  fetchTransactionsData,
  fetchUsersData,
} from "./firebase-service"

export interface DashboardData {
  attendance: Array<{ date: string; present: number; absent: number; total: number }>
  clients: Array<{ month: string; count: number }>
  deliverables: Array<{ name: string; count: number }>
  enquiry: Array<{ date: string; count: number }>
  events: Array<{ name: string; count: number }>
  packages: Array<{ name: string; price: number; count: number }>
  projects: Array<{ status: string; count: number }>
  salary: Array<{ month: string; amount: number }>
  shoots: Array<{ type: string; count: number }>
  tasks: Array<{ status: string; count: number }>
  transactions: Array<{ date: string; credit: number; debit: number }>
}

export const fetchDashboardData = async (filter: string): Promise<DashboardData> => {
  try {
    console.log("[v0] Fetching dashboard data with filter:", filter)

    // Fetch all data in parallel
    const [
      attendanceData,
      clientsData,
      deliverablesData,
      enquiryData,
      eventsData,
      packagesData,
      projectsData,
      salaryData,
      shootsData,
      tasksData,
      transactionsData,
     
    ] = await Promise.all([
      fetchAttendanceData(filter),
      fetchClientsData(filter),
      fetchDeliverablesData(filter),
      fetchEnquiryData(filter),
      fetchEventsData(filter),
      fetchPackagesData(filter),
      fetchProjectsData(filter),
      fetchSalaryData(filter),
      fetchShootsData(filter),
      fetchTasksData(filter),
      fetchTransactionsData(filter),
      fetchUsersData(filter),
    ])

    console.log("[v0] Raw data fetched, transforming for dashboard...")

    // Transform attendance data
    const attendance = attendanceData.map((record) => {
      const employees = Object.values(record.employees || {})
      const present = employees.filter((emp) => emp.status === "present").length
      const absent = employees.filter((emp) => emp.status === "absent").length
      return {
        date: record.date,
        present,
        absent,
        total: present + absent,
      }
    })

    // Transform clients data by month
    const clientsByMonth = clientsData.reduce(
      (acc, client) => {
        const date = new Date(client.createdAt || Date.now())
        const monthKey = date.toLocaleDateString("en-US", { month: "short" })
        acc[monthKey] = (acc[monthKey] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const clients = Object.entries(clientsByMonth).map(([month, count]) => ({
      month,
      count,
    }))

    // Transform deliverables data
    const deliverablesByName = deliverablesData.reduce(
      (acc, deliverable) => {
        acc[deliverable.name] = (acc[deliverable.name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const deliverables = Object.entries(deliverablesByName).map(([name, count]) => ({
      name,
      count,
    }))

    // Transform enquiry data by date
    const enquiryByDate = enquiryData.reduce(
      (acc, enquiry) => {
        const date = new Date(enquiry.createdAt || Date.now()).toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const enquiry = Object.entries(enquiryByDate).map(([date, count]) => ({
      date,
      count,
    }))

    // Transform events data
    const eventsByName = eventsData.reduce(
      (acc, event) => {
        acc[event.name] = (acc[event.name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const events = Object.entries(eventsByName).map(([name, count]) => ({
      name,
      count,
    }))

    // Transform packages data
    const packagesByName = packagesData.reduce(
      (acc, pkg) => {
        if (!acc[pkg.name]) {
          acc[pkg.name] = { price: pkg.price, count: 0 }
        }
        acc[pkg.name].count += 1
        return acc
      },
      {} as Record<string, { price: number; count: number }>,
    )

    const packages = Object.entries(packagesByName).map(([name, data]) => ({
      name,
      price: data.price,
      count: data.count,
    }))

    // Transform projects data
    const projectsByStatus = projectsData.reduce(
      (acc, project) => {
        const status = project.status || "Active"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const projects = Object.entries(projectsByStatus).map(([status, count]) => ({
      status,
      count,
    }))

    // Transform salary data by month
    const salaryByMonth = salaryData.reduce(
      (acc, salary) => {
        const date = new Date(salary.createdAt || Date.now())
        const monthKey = date.toLocaleDateString("en-US", { month: "short" })
        const employees = Object.values(salary.employees || {})
        const totalAmount = employees.reduce((sum, emp) => sum + emp.amount, 0)
        acc[monthKey] = (acc[monthKey] || 0) + totalAmount
        return acc
      },
      {} as Record<string, number>,
    )

    const salary = Object.entries(salaryByMonth).map(([month, amount]) => ({
      month,
      amount,
    }))

    // Transform shoots data
    const shootsByType = shootsData.reduce(
      (acc, shoot) => {
        // Determine shoot type based on the highest count
        const types = [
          {
            name: "Traditional",
            count: Number.parseInt(shoot.traditionalPhotographer) + Number.parseInt(shoot.traditionalVideographer),
          },
          { name: "Candid", count: Number.parseInt(shoot.candid) },
          { name: "Drone", count: Number.parseInt(shoot.drone) },
        ]
        const primaryType = types.reduce((max, type) => (type.count > max.count ? type : max), types[0])
        acc[primaryType.name] = (acc[primaryType.name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const shoots = Object.entries(shootsByType).map(([type, count]) => ({
      type,
      count,
    }))

    // Transform tasks data
    const tasksByStatus = tasksData.reduce(
      (acc, task) => {
        const status = task.status || "Pending"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const tasks = Object.entries(tasksByStatus).map(([status, count]) => ({
      status,
      count,
    }))

    // Transform transactions data
    const transactionsByDate = transactionsData.reduce(
      (acc, transaction) => {
        const date = transaction.date
        if (!acc[date]) {
          acc[date] = { credit: 0, debit: 0 }
        }

        transaction.items.forEach((item) => {
          if (item.type === "credit") {
            acc[date].credit += item.amount
          } else if (item.type === "debit") {
            acc[date].debit += item.amount
          }
        })

        return acc
      },
      {} as Record<string, { credit: number; debit: number }>,
    )

    const transactions = Object.entries(transactionsByDate).map(([date, data]) => ({
      date,
      credit: data.credit,
      debit: data.debit,
    }))

    console.log("[v0] Dashboard data transformation complete")

    return {
      attendance,
      clients,
      deliverables,
      enquiry,
      events,
      packages,
      projects,
      salary,
      shoots,
      tasks,
      transactions,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard data:", error)
    // Return empty data structure on error
    return {
      attendance: [],
      clients: [],
      deliverables: [],
      enquiry: [],
      events: [],
      packages: [],
      projects: [],
      salary: [],
      shoots: [],
      tasks: [],
      transactions: [],
    }
  }
}
