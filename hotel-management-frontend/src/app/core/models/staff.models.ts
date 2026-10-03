export type StaffRole =
  | 'ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'HOUSEKEEPER'
  | 'STAFF'
  | 'MAINTENANCE_STAFF';

export interface StaffResponse {
  id: number;
  userId?: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department?: string;
  salary?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStaffRequest {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department?: string;
  salary?: number;
}

export interface UpdateStaffRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  salary?: number;
  role?: StaffRole;
  active?: boolean;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';

export interface AttendanceResponse {
  id: number;
  staffId: number;
  staffName?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workHours?: number;
  status: AttendanceStatus;
  shiftId?: number;
  remarks?: string;
}

export interface AttendanceRequest {
  staffId: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface ShiftResponse {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
  assignedStaff?: StaffResponse[];
}

export interface ShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveResponse {
  id: number;
  staffId: number;
  staffName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
  status: LeaveStatus;
  remarks?: string;
  createdAt?: string;
}

export interface LeaveRequest {
  staffId?: number;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
}

export interface LeaveApprovalRequest {
  status: 'APPROVED' | 'REJECTED';
  remarks?: string;
}
