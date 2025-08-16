import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, type DocumentData, Timestamp } from "firebase/firestore"

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export interface FilterPeriod {
  value: string
  label: string
}

export const filterPeriods: FilterPeriod[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "current-year", label: "Current Year" },
  { value: "previous-year", label: "Previous Year" },
  { value: "all-time", label: "All Time" },
]

export const getDateRange = (filter: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filter) {
    case "today":
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    case "yesterday":
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      return {
        start: yesterday,
        end: today,
      }
    case "this-week":
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return {
        start: weekStart,
        end: now,
      }
    case "this-month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      }
    case "current-year":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: now,
      }
    case "previous-year":
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear(), 0, 1),
      }
    default: // all-time
      return {
        start: new Date(2020, 0, 1),
        end: now,
      }
  }
}



// Define a type for anything with a toDate method
type WithToDate = { toDate: () => Date }
const parseFirebaseDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null

  // Firestore Timestamp
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate()
  }

  // Objects with .toDate() (covers generic Firestore-like objects)
  if (
    typeof dateValue === "object" &&
    dateValue !== null &&
    "toDate" in dateValue &&
    (dateValue as WithToDate).toDate instanceof Function
  ) {
    return (dateValue as WithToDate).toDate()
  }

  // ISO string
  if (typeof dateValue === "string") {
    const parsed = new Date(dateValue)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  // Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue
  }

  return null
}


const filterDocumentsByDate = (docs: DocumentData[], filter: string): DocumentData[] => {
  if (filter === "all-time") return docs

  const { start, end } = getDateRange(filter)

  return docs.filter((doc) => {
    const createdAt = parseFirebaseDate(doc.createdAt)
    if (!createdAt) return filter === "all-time" // Show documents without createdAt only in all-time

    return createdAt >= start && createdAt <= end
  })
}

// Firebase collection interfaces
export interface AttendanceEmployee {
  employeeId: string
  employeeName: string
  status: "present" | "absent"
  timestamp: Date
}

export interface AttendanceData {
  date: string
  employees: Record<string, AttendanceEmployee>
  createdAt?: Date
}

export interface ClientData {
  name: string
  address: string
  phoneNo: string
  createdAt?: string
  originalEnquiryId?: string
  source?: string
}

export interface DeliverableData {
  name: string
  createdAt?: Date
}

export interface EnquiryData {
  name: string
  address: string
  phoneNo: string
  createdAt?: string
}

export interface EventData {
  name: string
  createdAt?: Date
}

export interface PackageDeliverable {
  deliverableId: string
  quantity: string
}

export interface PackageData {
  name: string
  price: number
  eventId: string
  eventName: string
  deliverables: PackageDeliverable[]
  shoots: string[]
  createdAt?: Date
}

export interface ProjectData {
  name?: string
  status?: string
  clientId?: string
  createdAt?: Date
}

export interface SalaryEmployee {
  employeeId: string
  employeeName: string
  amount: number
  timestamp: Date
}

export interface SalaryData {
  date: string
  employees?: Record<string, SalaryEmployee>
  createdAt?: Date
}

export interface ShootData {
  name: string
  assistant: string
  camId: string
  candid: string
  cinemetographer: string
  drone: string
  traditionalPhotographer: string
  traditionalVideographer: string
  other: string
  createdAt?: Date
}

export interface TaskData {
  title?: string
  description?: string
  status?: string
  assignedTo?: string
  createdAt?: Date
}

export interface TransactionEmployee {
  amount: number
  employeeId: string
  employeeName: string
  timestamp: Date
}

export interface TransactionItem {
  amount: number
  date: string
  type: "credit" | "debit"
  status: string
  purpose: string
  timestamp: Date
  debitType?: string
  mode?: string
  utr?: string
  employees?: TransactionEmployee[]
}

export interface TransactionData {
  date: string
  items: TransactionItem[]
  createdAt?: Date
  updatedAt?: Date
}

export interface CompanyInfo {
  address: string
  contactPersons: string
  email: string
  name: string
  phone: string
  salary: number
  status: string
}

export interface SalaryHistoryEntry {
  paidSalary: number
  salaryStatus: string
}

export interface UserData {
  name: string
  email: string
  empId: string
  phone: string
  address: string
  salary: string
  userType: string
  profileStatus: string
  createdAt?: string
  accessLevelMap: Record<string, boolean>
  assignedCompany: Record<string, CompanyInfo>
  salaryHistory: Record<string, SalaryHistoryEntry>
}

export const fetchAttendanceData = async (filter: string): Promise<AttendanceData[]> => {
  try {
    const attendanceRef = collection(db, "attendence") // Note: keeping original spelling
    const snapshot = await getDocs(attendanceRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as AttendanceData[]
  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return []
  }
}

export const fetchClientsData = async (filter: string): Promise<ClientData[]> => {
  try {
    const clientsRef = collection(db, "clients")
    const snapshot = await getDocs(clientsRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as ClientData[]
  } catch (error) {
    console.error("Error fetching clients data:", error)
    return []
  }
}

export const fetchDeliverablesData = async (filter: string): Promise<DeliverableData[]> => {
  try {
    const deliverablesRef = collection(db, "deliverables")
    const snapshot = await getDocs(deliverablesRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as DeliverableData[]
  } catch (error) {
    console.error("Error fetching deliverables data:", error)
    return []
  }
}

export const fetchEnquiryData = async (filter: string): Promise<EnquiryData[]> => {
  try {
    const enquiryRef = collection(db, "enquiry")
    const snapshot = await getDocs(enquiryRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as EnquiryData[]
  } catch (error) {
    console.error("Error fetching enquiry data:", error)
    return []
  }
}

export const fetchEventsData = async (filter: string): Promise<EventData[]> => {
  try {
    const eventsRef = collection(db, "events")
    const snapshot = await getDocs(eventsRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as EventData[]
  } catch (error) {
    console.error("Error fetching events data:", error)
    return []
  }
}

export const fetchPackagesData = async (filter: string): Promise<PackageData[]> => {
  try {
    const packagesRef = collection(db, "packages")
    const snapshot = await getDocs(packagesRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as PackageData[]
  } catch (error) {
    console.error("Error fetching packages data:", error)
    return []
  }
}

export const fetchProjectsData = async (filter: string): Promise<ProjectData[]> => {
  try {
    const projectsRef = collection(db, "projects")
    const snapshot = await getDocs(projectsRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as ProjectData[]
  } catch (error) {
    console.error("Error fetching projects data:", error)
    return []
  }
}

export const fetchSalaryData = async (filter: string): Promise<SalaryData[]> => {
  try {
    const salaryRef = collection(db, "salary")
    const snapshot = await getDocs(salaryRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      date: doc.id, // Document ID is the date
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as SalaryData[]
  } catch (error) {
    console.error("Error fetching salary data:", error)
    return []
  }
}

export const fetchShootsData = async (filter: string): Promise<ShootData[]> => {
  try {
    const shootsRef = collection(db, "shoots")
    const snapshot = await getDocs(shootsRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as ShootData[]
  } catch (error) {
    console.error("Error fetching shoots data:", error)
    return []
  }
}

export const fetchTasksData = async (filter: string): Promise<TaskData[]> => {
  try {
    const tasksRef = collection(db, "task")
    const snapshot = await getDocs(tasksRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as TaskData[]
  } catch (error) {
    console.error("Error fetching tasks data:", error)
    return []
  }
}

export const fetchTransactionsData = async (filter: string): Promise<TransactionData[]> => {
  try {
    const transactionsRef = collection(db, "transactions")
    const snapshot = await getDocs(transactionsRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      date: doc.id, // Document ID is the date
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as TransactionData[]
  } catch (error) {
    console.error("Error fetching transactions data:", error)
    return []
  }
}

export const fetchUsersData = async (filter: string): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(usersRef)

    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return filterDocumentsByDate(docs, filter) as UserData[]
  } catch (error) {
    console.error("Error fetching users data:", error)
    return []
  }
}

export const calculateTotalRevenue = (transactions: TransactionData[]): number => {
  return transactions.reduce((total, transaction) => {
    const creditItems = transaction.items.filter((item) => item.type === "credit")
    const transactionTotal = creditItems.reduce((sum, item) => sum + item.amount, 0)
    return total + transactionTotal
  }, 0)
}

export const calculateTotalExpenses = (transactions: TransactionData[]): number => {
  return transactions.reduce((total, transaction) => {
    const debitItems = transaction.items.filter((item) => item.type === "debit")
    const transactionTotal = debitItems.reduce((sum, item) => sum + item.amount, 0)
    return total + transactionTotal
  }, 0)
}

export const getActiveProjects = (projects: ProjectData[]): number => {
  return projects.filter((project) => project.status === "Active" || !project.status).length
}

export const getPresentEmployees = (attendance: AttendanceData[]): number => {
  return attendance.reduce((total, record) => {
    const presentCount = Object.values(record.employees).filter((emp) => emp.status === "present").length
    return total + presentCount
  }, 0)
}
