import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttendanceRequest,
  AttendanceResponse,
  CreateStaffRequest,
  LeaveApprovalRequest,
  LeaveRequest,
  LeaveResponse,
  ShiftRequest,
  ShiftResponse,
  StaffResponse,
  StaffRole,
  UpdateStaffRequest
} from '../models/staff.models';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Staff
  createStaff(request: CreateStaffRequest): Observable<StaffResponse> {
    return this.http.post<StaffResponse>(`${this.baseUrl}/api/staff`, request);
  }

  getAllStaff(role?: StaffRole): Observable<StaffResponse[]> {
    const params = role ? `?role=${role}` : '';
    return this.http.get<StaffResponse[]>(`${this.baseUrl}/api/staff${params}`);
  }

  getStaffById(id: number): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.baseUrl}/api/staff/${id}`);
  }

  getStaffByEmployeeCode(code: string): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.baseUrl}/api/staff/code/${code}`);
  }

  getStaffByUserId(userId: number): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.baseUrl}/api/staff/user/${userId}`);
  }

  updateStaff(id: number, request: UpdateStaffRequest): Observable<StaffResponse> {
    return this.http.put<StaffResponse>(`${this.baseUrl}/api/staff/${id}`, request);
  }

  deleteStaff(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/staff/${id}`);
  }

  // Attendance
  recordAttendance(request: AttendanceRequest): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(`${this.baseUrl}/api/attendance`, request);
  }

  checkIn(staffId: number, shiftId?: number): Observable<AttendanceResponse> {
    const params = shiftId ? `?shiftId=${shiftId}` : '';
    return this.http.post<AttendanceResponse>(`${this.baseUrl}/api/attendance/check-in/${staffId}${params}`, {});
  }

  checkOut(staffId: number): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(`${this.baseUrl}/api/attendance/check-out/${staffId}`, {});
  }

  getAttendanceByStaff(staffId: number): Observable<AttendanceResponse[]> {
    return this.http.get<AttendanceResponse[]>(`${this.baseUrl}/api/attendance/staff/${staffId}`);
  }

  getAttendanceByDate(date?: string): Observable<AttendanceResponse[]> {
    const params = date ? `?date=${date}` : '';
    return this.http.get<AttendanceResponse[]>(`${this.baseUrl}/api/attendance${params}`);
  }

  // Shifts
  createShift(request: ShiftRequest): Observable<ShiftResponse> {
    return this.http.post<ShiftResponse>(`${this.baseUrl}/api/shifts`, request);
  }

  getAllShifts(): Observable<ShiftResponse[]> {
    return this.http.get<ShiftResponse[]>(`${this.baseUrl}/api/shifts`);
  }

  getShiftById(id: number): Observable<ShiftResponse> {
    return this.http.get<ShiftResponse>(`${this.baseUrl}/api/shifts/${id}`);
  }

  getShiftsByStaffId(staffId: number): Observable<ShiftResponse[]> {
    return this.http.get<ShiftResponse[]>(`${this.baseUrl}/api/shifts/staff/${staffId}`);
  }

  updateShift(id: number, request: ShiftRequest): Observable<ShiftResponse> {
    return this.http.put<ShiftResponse>(`${this.baseUrl}/api/shifts/${id}`, request);
  }

  assignStaffToShift(shiftId: number, staffId: number): Observable<ShiftResponse> {
    return this.http.post<ShiftResponse>(`${this.baseUrl}/api/shifts/${shiftId}/assign/${staffId}`, {});
  }

  removeStaffFromShift(shiftId: number, staffId: number): Observable<ShiftResponse> {
    return this.http.delete<ShiftResponse>(`${this.baseUrl}/api/shifts/${shiftId}/assign/${staffId}`);
  }

  // Leave
  requestLeave(request: LeaveRequest): Observable<LeaveResponse> {
    return this.http.post<LeaveResponse>(`${this.baseUrl}/api/leave`, request);
  }

  approveOrRejectLeave(id: number, request: LeaveApprovalRequest): Observable<LeaveResponse> {
    return this.http.put<LeaveResponse>(`${this.baseUrl}/api/leave/${id}/approval`, request);
  }

  getLeaveById(id: number): Observable<LeaveResponse> {
    return this.http.get<LeaveResponse>(`${this.baseUrl}/api/leave/${id}`);
  }

  getLeavesByStaff(staffId: number): Observable<LeaveResponse[]> {
    return this.http.get<LeaveResponse[]>(`${this.baseUrl}/api/leave/staff/${staffId}`);
  }

  getAllLeaves(): Observable<LeaveResponse[]> {
    return this.http.get<LeaveResponse[]>(`${this.baseUrl}/api/leave`);
  }
}
