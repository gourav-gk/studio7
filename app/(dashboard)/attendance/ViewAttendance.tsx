"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { collection, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";
import { DailyAttendance, EmployeeAttendanceSummary } from "./types";
import { Edit, Save, X } from "lucide-react";
import { getCurrentMonth, getDaysInMonth, getDayName, getMonthName, getPreviousMonth, getNextMonth } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";
import { ClientOnly } from "@/components/ClientOnly";

interface User {
  uId: string;
  name: string;
  email: string;
  accessLevelMap: Record<string, boolean>;
  userType: string;
}

interface ViewAttendanceProps {
  selectedMonth?: string;
}

export default function ViewAttendance({ selectedMonth }: ViewAttendanceProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, DailyAttendance>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{ employeeId: string; date: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Get current month and year
  const defaultMonth = getCurrentMonth();
  const daysInMonth = getDaysInMonth(currentMonth || defaultMonth);

  useEffect(() => {
    setCurrentMonth(selectedMonth || defaultMonth);
    loadEmployees();
  }, [selectedMonth]);

  useEffect(() => {
    if (currentMonth) {
      loadAttendanceRecords();
    }
  }, [currentMonth]);

  const loadEmployees = async () => {
    try {
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const usersData = usersSnapshot.docs.map((doc) => ({
        uId: doc.id,
        ...doc.data(),
      })) as User[];
      
      // Filter users based on permissions - only show users that current user can manage
      if (user) {
        const currentUserDoc = usersData.find(u => u.uId === user.uid);
        if (currentUserDoc?.accessLevelMap?.attendence) {
          // If user has attendance permission, show all users
          setEmployees(usersData);
        } else if (currentUserDoc?.accessLevelMap?.employee) {
          // If user has employee permission, show all users
          setEmployees(usersData);
        } else {
          // If no permissions, show only current user
          setEmployees(usersData.filter(u => u.uId === user.uid));
        }
      } else {
        setEmployees(usersData);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const loadAttendanceRecords = () => {
    const unsubscribe = onSnapshot(collection(firestore, "attendance"), (snapshot) => {
      const records: Record<string, DailyAttendance> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as DailyAttendance;
        if (data.date.startsWith(currentMonth)) {
          records[data.date] = data;
        }
      });
      setAttendanceRecords(records);
      setIsLoading(false);
    });

    return unsubscribe;
  };



  const getAttendanceStatus = (employeeId: string, date: string) => {
    const record = attendanceRecords[date];
    if (!record || !record.employees[employeeId]) return 'absent';
    return record.employees[employeeId].status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 text-white';
      case 'absent':
        return 'bg-red-500 text-white';
      case 'half-day':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'P';
      case 'absent':
        return 'A';
      case 'half-day':
        return 'H';
      default:
        return 'A';
    }
  };

  const handleEditCell = (employeeId: string, date: string) => {
    // Check if user has permission to edit this attendance
    if (user) {
      const currentUserDoc = employees.find(u => u.uId === user.uid);
      const canEdit = currentUserDoc?.accessLevelMap?.attendence || 
                     currentUserDoc?.accessLevelMap?.employee ||
                     currentUserDoc?.userType === 'admin';
      
      if (!canEdit && employeeId !== user.uid) {
        toast.error("You don't have permission to edit this attendance");
        return;
      }
    }
    
    const currentStatus = getAttendanceStatus(employeeId, date);
    setEditingCell({ employeeId, date });
    setEditValue(currentStatus);
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;

    try {
      const { employeeId, date } = editingCell;
      const record = attendanceRecords[date];
      
      if (record && record.employees[employeeId]) {
        // Update the existing record
        const updatedRecord = {
          ...record,
          employees: {
            ...record.employees,
            [employeeId]: {
              ...record.employees[employeeId],
              status: editValue as 'present' | 'absent' | 'half-day',
              timestamp: new Date(),
            },
          },
          updatedAt: new Date(),
        };

        await updateDoc(doc(firestore, "attendance", date), updatedRecord);
        toast.success("Attendance updated successfully!");
      } else {
        // Create new record if it doesn't exist
        const newRecord: DailyAttendance = {
          date,
          day: getDayName(date),
          employees: {
            [employeeId]: {
              employeeId,
              employeeName: employees.find(emp => emp.uId === employeeId)?.name || '',
              status: editValue as 'present' | 'absent' | 'half-day',
              timestamp: new Date(),
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await updateDoc(doc(firestore, "attendance", date), newRecord);
        toast.success("Attendance created successfully!");
      }

      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const calculateEmployeeSummary = (employeeId: string): EmployeeAttendanceSummary => {
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;

    Object.values(attendanceRecords).forEach((record) => {
      const employeeRecord = record.employees[employeeId];
      if (employeeRecord) {
        switch (employeeRecord.status) {
          case 'present':
            presentDays++;
            break;
          case 'half-day':
            halfDays++;
            break;
          default:
            absentDays++;
        }
      } else {
        absentDays++;
      }
    });

    return {
      employeeId,
      employeeName: employees.find(emp => emp.uId === employeeId)?.name || '',
      presentDays,
      absentDays,
      halfDays,
      totalDays: daysInMonth,
    };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading attendance records...</div>;
  }

  return (
    <ClientOnly>
      <div className="space-y-6">
        {/* Month Selector */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="month">Month:</Label>
          <Select value={currentMonth} onValueChange={setCurrentMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={getPreviousMonth(currentMonth)}>{getMonthName(getPreviousMonth(currentMonth))}</SelectItem>
              <SelectItem value={currentMonth}>{getMonthName(currentMonth)}</SelectItem>
              <SelectItem value={getNextMonth(currentMonth)}>{getMonthName(getNextMonth(currentMonth))}</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map((employee) => {
          const summary = calculateEmployeeSummary(employee.uId);
          return (
            <div key={employee.uId} className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">{employee.name}</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-semibold">{summary.presentDays}</div>
                  <div className="text-xs text-muted-foreground">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 font-semibold">{summary.absentDays}</div>
                  <div className="text-xs text-muted-foreground">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600 font-semibold">{summary.halfDays}</div>
                  <div className="text-xs text-muted-foreground">Half Day</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left font-medium min-w-32">Employee</th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                const dayName = getDayName(dateStr);
                return (
                  <th key={day} className="p-2 text-center font-medium min-w-20">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{dayName}</span>
                      <span>{day}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.uId} className="border-b">
                <td className="p-2 font-medium">{employee.name}</td>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                  const isEditing = editingCell?.employeeId === employee.uId && editingCell?.date === dateStr;
                  const currentStatus = getAttendanceStatus(employee.uId, dateStr);
                  
                  return (
                    <td key={day} className="p-2 text-center">
                      {isEditing ? (
                        <div className="flex items-center space-x-1">
                          <Select value={editValue} onValueChange={setEditValue}>
                            <SelectTrigger className="w-16 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">P</SelectItem>
                              <SelectItem value="absent">A</SelectItem>
                              <SelectItem value="half-day">H</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={handleSaveCell} className="h-8 w-8 p-0">
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getStatusColor(currentStatus)}`}
                          >
                            {getStatusText(currentStatus)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCell(employee.uId, dateStr)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
  );
}
