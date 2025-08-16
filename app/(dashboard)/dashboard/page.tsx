"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  Calendar,
  Users,
  Briefcase,
  Camera,
  ClipboardList,
  FolderKanban,
  CheckSquare,
  IndianRupee,
  Bot,
  BookOpen,
} from "lucide-react"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { fetchDashboardData, type DashboardData } from "@/lib/firebase-data-fetcher"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff", "#00ffff", "#ff0000"]

const defaultData: DashboardData = {
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

export default function DashboardPage() {
  const [filter, setFilter] = useState("all-time")
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultData)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const filterOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this-week", label: "This Week" },
    { value: "this-month", label: "This Month" },
    { value: "current-year", label: "Current Year" },
    { value: "previous-year", label: "Previous Year" },
    { value: "all-time", label: "All Time" },
  ]

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const data = await fetchDashboardData(filter)
        setDashboardData(data)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
        setDashboardData(defaultData)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [filter])

  const dashboardSections = [
    {
      title: "Attendance",
      icon: CheckSquare,
      route: "/attendance",
      color: "bg-blue-500",
      count: dashboardData.attendance.reduce((acc, item) => acc + item.total, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dashboardData.attendance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#22c55e" name="Present" />
            <Bar dataKey="absent" fill="#ef4444" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Clients",
      icon: Users,
      route: "/clients",
      color: "bg-green-500",
      count: dashboardData.clients.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dashboardData.clients}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Deliverables",
      icon: ClipboardList,
      route: "/deliverables",
      color: "bg-purple-500",
      count: dashboardData.deliverables.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={dashboardData.deliverables}
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#8884d8"
              dataKey="count"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {dashboardData.deliverables.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Enquiry",
      icon: Bot,
      route: "/enquiry",
      color: "bg-orange-500",
      count: dashboardData.enquiry.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dashboardData.enquiry}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#f97316" fill="#fed7aa" />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Events",
      icon: Calendar,
      route: "/events",
      color: "bg-pink-500",
      count: dashboardData.events.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dashboardData.events} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="count" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Packages",
      icon: Briefcase,
      route: "/packages",
      color: "bg-indigo-500",
      count: dashboardData.packages.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dashboardData.packages}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="price" fill="#6366f1" name="Price" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Projects",
      icon: BookOpen,
      route: "/projects",
      color: "bg-teal-500",
      count: dashboardData.projects.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={dashboardData.projects}
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#14b8a6"
              dataKey="count"
              label={({ status, count }) => `${status}: ${count}`}
            >
              {dashboardData.projects.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Salary",
      icon: IndianRupee,
      route: "/employee/salary",
      color: "bg-yellow-500",
      count: dashboardData.salary.reduce((acc, item) => acc + item.amount, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dashboardData.salary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
            <Line type="monotone" dataKey="amount" stroke="#eab308" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Shoots",
      icon: Camera,
      route: "/shoots",
      color: "bg-red-500",
      count: dashboardData.shoots.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dashboardData.shoots}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Tasks",
      icon: FolderKanban,
      route: "/task",
      color: "bg-cyan-500",
      count: dashboardData.tasks.reduce((acc, item) => acc + item.count, 0),
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={dashboardData.tasks}
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#06b6d4"
              dataKey="count"
              label={({ status, count }) => `${status}: ${count}`}
            >
              {dashboardData.tasks.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Transactions",
      icon: IndianRupee,
      route: "/accounts/transaction",
      color: "bg-emerald-500",
      count: dashboardData.transactions.length,
      chart: (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dashboardData.transactions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, ""]} />
            <Bar dataKey="credit" fill="#22c55e" name="Credit" />
            <Bar dataKey="debit" fill="#ef4444" name="Debit" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
  ]

  const handleSectionClick = (route: string) => {
    router.push(route)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading dashboard data...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header with Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your business analytics and metrics</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.clients.reduce((acc, item) => acc + item.count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Based on selected filter</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.projects.find((p) => p.status === "Active")?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{dashboardData.transactions.reduce((acc, item) => acc + item.credit, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total credit transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.tasks.find((t) => t.status === "Pending")?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardSections.map((section) => {
            const IconComponent = section.icon
            return (
              <Card
                key={section.title}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => handleSectionClick(section.route)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${section.color}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                  </div>
                  <div className="text-lg font-bold">
                    {typeof section.count === "number" && section.title === "Salary"
                      ? `₹${section.count.toLocaleString()}`
                      : section.count}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">{section.chart}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Analytics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Financial Trends</CardTitle>
              <CardDescription>Revenue vs Expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.transactions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, ""]} />
                  <Line type="monotone" dataKey="credit" stroke="#22c55e" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="debit" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Attendance and productivity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.attendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stackId="1" stroke="#22c55e" fill="#22c55e" />
                  <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef4444" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
