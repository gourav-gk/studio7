export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  status: 'present' | 'absent' | 'half-day';
  timestamp: Date;
}
export interface AuthUser {
  permissions?: string[]; // ✅ explicitly a string array
  // other fields...
}


export interface DailyAttendance {
  date: string; // Format: YYYY-MM-DD
  day: string; // Monday, Tuesday, etc.
  employees: Record<string, AttendanceRecord>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyAttendance {
  month: string; // Format: YYYY-MM
  year: number;
  dailyRecords: Record<string, DailyAttendance>;
}

export interface EmployeeAttendanceSummary {
  employeeId: string;
  employeeName: string;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  totalDays: number;
}

export interface AttendanceFormData {
  date: string;
  day: string;
  employeeAttendance: Record<string, {
    employeeId: string;
    employeeName: string;
    status: 'present' | 'absent' | 'half-day';
  }>;
}
