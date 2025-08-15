"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Edit3, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, doc, getDocs, setDoc, getDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { toast } from "sonner"
import { getCurrentMonth, getDaysInMonth, getDayName, getMonthName, getPreviousMonth, getNextMonth } from "@/lib/utils"
import { useAuth } from "@/context/AuthProvider"
import { ClientOnly } from "@/components/ClientOnly"

interface User {
  uId: string
  name: string
  email: string
  accessLevelMap: Record<string, boolean>
  userType: string
}

export default function AddAttendancePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, string>>>({})

  // Get current month and year
  const currentMonth = getCurrentMonth()
  // const daysInMonth = getDaysInMonth(currentMonth)

  useEffect(() => {
    setSelectedMonth(currentMonth)
    loadEmployees()
  }, [])

  useEffect(() => {
    if (selectedMonth && employees.length > 0) {
      loadExistingAttendance()
    }
  }, [selectedMonth, employees])

  const loadEmployees = async () => {
    try {
      const usersSnapshot = await getDocs(collection(firestore, "users"))
      const usersData = usersSnapshot.docs.map((doc) => ({
        uId: doc.id,
        ...doc.data(),
      })) as User[]

      // Filter users based on permissions - only show users that current user can manage
      if (user) {
        const currentUserDoc = usersData.find((u) => u.uId === user.uid)
        if (currentUserDoc?.accessLevelMap?.attendence) {
          // If user has attendance permission, show all users
          setEmployees(usersData)
        } else if (currentUserDoc?.accessLevelMap?.employee) {
          // If user has employee permission, show all users
          setEmployees(usersData)
        } else {
          // If no permissions, show only current user
          setEmployees(usersData.filter((u) => u.uId === user.uid))
        }
      } else {
        setEmployees(usersData)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
    }
  }

  const loadExistingAttendance = async () => {
    if (!selectedMonth || employees.length === 0) return

    setIsLoading(true)
    try {
      const existingData: Record<string, Record<string, string>> = {}
      const daysInSelectedMonth = getDaysInMonth(selectedMonth)

      // Initialize with default 'absent' status
      employees.forEach((employee) => {
        existingData[employee.uId] = {}
        for (let day = 1; day <= daysInSelectedMonth; day++) {
          const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
          existingData[employee.uId][dateStr] = "absent"
        }
      })

      // Load existing attendance records from Firebase
      for (let day = 1; day <= daysInSelectedMonth; day++) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
        const docRef = doc(firestore, "attendance", dateStr)

        try {
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const attendanceRecord = docSnap.data()
            if (attendanceRecord.employees) {
              // Update existing data with saved attendance
              employees.forEach((employee) => {
                if (attendanceRecord.employees[employee.uId]) {
                  existingData[employee.uId][dateStr] = attendanceRecord.employees[employee.uId].status
                }
              })
            }
          }
        } catch (error) {
          console.error(`Error loading attendance for ${dateStr}:`, error)
        }
      }

      setAttendanceData(existingData)
    } catch (error) {
      console.error("Error loading existing attendance:", error)
      toast.error("Failed to load existing attendance")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendanceChange = (employeeId: string, date: string, status: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [date]: status,
      },
    }))
  }

  const handleSubmit = async () => {
    // Check if user has permission to add attendance
    if (user) {
      const currentUserDoc = employees.find((u) => u.uId === user.uid)
      const canAdd =
        currentUserDoc?.accessLevelMap?.attendence ||
        currentUserDoc?.accessLevelMap?.employee ||
        currentUserDoc?.userType === "admin"

      if (!canAdd) {
        toast.error("You don't have permission to add attendance")
        return
      }
    }

    setIsLoading(true)
    try {
      // Save attendance for each day
      for (let day = 1; day <= getDaysInMonth(selectedMonth); day++) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
        const dayName = getDayName(dateStr)

        const docRef = doc(firestore, "attendance", dateStr)
        const existingDoc = await getDoc(docRef)

        let dailyAttendance

        if (existingDoc.exists()) {
          // Document exists, merge with existing data
          const existingData = existingDoc.data()
          dailyAttendance = {
            ...existingData,
            updatedAt: new Date(),
            employees: {
              ...existingData.employees, // Keep existing employee data
            },
          }
        } else {
          // Document doesn't exist, create new one
          dailyAttendance = {
            date: dateStr,
            day: dayName,
            employees: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }

        // Add/update employee attendance for this day
        employees.forEach((employee) => {
          const status = attendanceData[employee.uId]?.[dateStr] || "absent"
          dailyAttendance.employees[employee.uId] = {
            employeeId: employee.uId,
            employeeName: employee.name,
            status: status as "present" | "absent" | "half-day",
            timestamp: new Date(),
          }
        })

        // Save with merge option to preserve other data
        await setDoc(docRef, dailyAttendance, { merge: true })
      }

      toast.success("Attendance saved successfully!")
      setIsEditing(false)
      router.push("/attendance")
    } catch (error) {
      console.error("Error saving attendance:", error)
      toast.error("Failed to save attendance")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Attendance</h1>
            <p className="text-muted-foreground">View and edit attendance for all employees for the selected month</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ClientOnly>
        <div className="space-y-4">
          {/* Month Selector + Actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Label htmlFor="month">Month:</Label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={getPreviousMonth(currentMonth)}>
                    {getMonthName(getPreviousMonth(currentMonth))}
                  </SelectItem>
                  <SelectItem value={currentMonth}>{getMonthName(currentMonth)}</SelectItem>
                  <SelectItem value={getNextMonth(currentMonth)}>{getMonthName(getNextMonth(currentMonth))}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2" disabled={isLoading}>
                  <Edit3 className="h-4 w-4" />
                  <span>{isLoading ? "Loading..." : "Edit Attendance"}</span>
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex items-center space-x-2">
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>{isLoading ? "Saving..." : "Save Attendance"}</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="border rounded-lg overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading attendance data...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium min-w-32">Employee</th>
                    {Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => {
                      const day = i + 1
                      const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
                      const dayName = getDayName(dateStr)
                      return (
                        <th key={day} className="p-2 text-center font-medium min-w-20">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">{dayName}</span>
                            <span>{day}</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.uId} className="border-b group">
                      <td className="p-2 font-medium">{employee.name}</td>
                      {Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => {
                        const day = i + 1
                        const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
                        const currentStatus = attendanceData[employee.uId]?.[dateStr] || "absent"

                        return (
                          <td key={day} className="p-2 text-center">
                            {isEditing ? (
                              <Select
                                value={currentStatus}
                                onValueChange={(value) => handleAttendanceChange(employee.uId, dateStr, value)}
                              >
                                <SelectTrigger className="w-16 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">P</SelectItem>
                                  <SelectItem value="absent">A</SelectItem>
                                  <SelectItem value="half-day">H</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center justify-center">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getStatusColor(currentStatus)}`}
                                >
                                  {getStatusText(currentStatus)}
                                </span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Legend:</span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>P - Present</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>A - Absent</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span>H - Half Day</span>
            </span>
          </div>
        </div>
      </ClientOnly>
    </div>
  )
}

// Helper functions for status display
function getStatusColor(status: string) {
  switch (status) {
    case "present":
      return "bg-green-500 text-white"
    case "absent":
      return "bg-red-500 text-white"
    case "half-day":
      return "bg-yellow-500 text-white"
    default:
      return "bg-gray-200 text-gray-700"
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "present":
      return "P"
    case "absent":
      return "A"
    case "half-day":
      return "H"
    default:
      return "A"
  }
}
