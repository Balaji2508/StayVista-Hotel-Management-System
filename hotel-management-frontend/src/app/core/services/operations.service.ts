import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AcknowledgeHandoverRequest,
  AssignMaintenanceRequest,
  BreakageResponse,
  CashDrawerResponse,
  CloseCashDrawerRequest,
  CreateExpenseRequest,
  CreateHousekeepingTaskRequest,
  CreateMaintenanceRequest,
  CreateRoomAssignmentRequest,
  CreateShiftHandoverRequest,
  CreateUtilityRequest,
  ExpenseResponse,
  HousekeepingTaskResponse,
  MaintenanceResponse,
  OpenCashDrawerRequest,
  ReportBreakageRequest,
  ResolveMaintenanceRequest,
  ReviewBreakageRequest,
  RoomAssignmentResponse,
  ShiftHandoverResponse,
  TaskHistoryResponse,
  UpdateMaintenanceStatusRequest,
  UtilityResponse
} from '../models/operations.models';

@Injectable({
  providedIn: 'root'
})
export class OperationsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Housekeeping
  createTask(request: CreateHousekeepingTaskRequest): Observable<HousekeepingTaskResponse> {
    return this.http.post<HousekeepingTaskResponse>(`${this.baseUrl}/api/housekeeping/tasks`, request);
  }

  getAllTasks(): Observable<HousekeepingTaskResponse[]> {
    return this.http.get<HousekeepingTaskResponse[]>(`${this.baseUrl}/api/housekeeping/tasks`);
  }

  getMyTasks(staffId?: number | null): Observable<HousekeepingTaskResponse[]> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.get<HousekeepingTaskResponse[]>(`${this.baseUrl}/api/housekeeping/tasks/my${params}`);
  }

  getTaskById(id: number): Observable<HousekeepingTaskResponse> {
    return this.http.get<HousekeepingTaskResponse>(`${this.baseUrl}/api/housekeeping/tasks/${id}`);
  }

  acceptTask(id: number, staffId?: number): Observable<HousekeepingTaskResponse> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.post<HousekeepingTaskResponse>(`${this.baseUrl}/api/housekeeping/tasks/${id}/accept${params}`, {});
  }

  startTask(id: number, staffId?: number): Observable<HousekeepingTaskResponse> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.post<HousekeepingTaskResponse>(`${this.baseUrl}/api/housekeeping/tasks/${id}/start${params}`, {});
  }

  completeTask(id: number, staffId?: number): Observable<HousekeepingTaskResponse> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.post<HousekeepingTaskResponse>(`${this.baseUrl}/api/housekeeping/tasks/${id}/complete${params}`, {});
  }

  rejectTask(id: number, staffId?: number, remarks?: string): Observable<HousekeepingTaskResponse> {
    let params: string[] = [];
    if (staffId) params.push(`staffId=${staffId}`);
    if (remarks) params.push(`remarks=${encodeURIComponent(remarks)}`);
    const q = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.post<HousekeepingTaskResponse>(`${this.baseUrl}/api/housekeeping/tasks/${id}/reject${q}`, {});
  }

  verifyTask(id: number, managerId?: number): Observable<HousekeepingTaskResponse> {
    const params = managerId ? `?managerId=${managerId}` : '';
    return this.http.post<HousekeepingTaskResponse>(`${this.baseUrl}/api/housekeeping/tasks/${id}/verify${params}`, {});
  }

  getTaskHistory(id: number): Observable<TaskHistoryResponse[]> {
    return this.http.get<TaskHistoryResponse[]>(`${this.baseUrl}/api/housekeeping/tasks/${id}/history`);
  }

  // Room Assignments
  createRoomAssignment(request: CreateRoomAssignmentRequest): Observable<RoomAssignmentResponse> {
    return this.http.post<RoomAssignmentResponse>(`${this.baseUrl}/api/room-assignments`, request);
  }

  getAllRoomAssignments(): Observable<RoomAssignmentResponse[]> {
    return this.http.get<RoomAssignmentResponse[]>(`${this.baseUrl}/api/room-assignments`);
  }

  getRoomAssignmentById(id: number): Observable<RoomAssignmentResponse> {
    return this.http.get<RoomAssignmentResponse>(`${this.baseUrl}/api/room-assignments/${id}`);
  }

  deleteRoomAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/room-assignments/${id}`);
  }

  // Maintenance
  createMaintenanceIssue(request: CreateMaintenanceRequest): Observable<MaintenanceResponse> {
    return this.http.post<MaintenanceResponse>(`${this.baseUrl}/api/maintenance`, request);
  }

  getAllMaintenanceIssues(): Observable<MaintenanceResponse[]> {
    return this.http.get<MaintenanceResponse[]>(`${this.baseUrl}/api/maintenance`);
  }

  getMaintenanceIssueById(id: number): Observable<MaintenanceResponse> {
    return this.http.get<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}`);
  }

  assignMaintenance(id: number, request: AssignMaintenanceRequest): Observable<MaintenanceResponse> {
    return this.http.put<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}/assign`, request);
  }

  acceptMaintenance(id: number, staffId?: number): Observable<MaintenanceResponse> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.post<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}/accept${params}`, {});
  }

  startMaintenance(id: number, staffId?: number): Observable<MaintenanceResponse> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.post<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}/start${params}`, {});
  }

  rejectMaintenance(id: number, staffId?: number, remarks?: string): Observable<MaintenanceResponse> {
    let params: string[] = [];
    if (staffId) params.push(`staffId=${staffId}`);
    if (remarks) params.push(`remarks=${encodeURIComponent(remarks)}`);
    const q = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.post<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}/reject${q}`, {});
  }

  resolveMaintenance(id: number, staffId?: number, request?: ResolveMaintenanceRequest): Observable<MaintenanceResponse> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.post<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}/resolve${params}`, request || {});
  }

  verifyMaintenance(id: number, managerId?: number): Observable<MaintenanceResponse> {
    const params = managerId ? `?managerId=${managerId}` : '';
    return this.http.post<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}/verify${params}`, {});
  }

  updateMaintenanceStatus(id: number, request: UpdateMaintenanceStatusRequest): Observable<MaintenanceResponse> {
    return this.http.put<MaintenanceResponse>(`${this.baseUrl}/api/maintenance/${id}/status`, request);
  }

  // Breakage
  reportBreakage(request: ReportBreakageRequest): Observable<BreakageResponse> {
    return this.http.post<BreakageResponse>(`${this.baseUrl}/api/breakage`, request);
  }

  getAllBreakageReports(): Observable<BreakageResponse[]> {
    return this.http.get<BreakageResponse[]>(`${this.baseUrl}/api/breakage`);
  }

  reviewBreakage(id: number, request: ReviewBreakageRequest): Observable<BreakageResponse> {
    return this.http.put<BreakageResponse>(`${this.baseUrl}/api/breakage/${id}/review`, request);
  }

  // Expenses
  createExpense(request: CreateExpenseRequest): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(`${this.baseUrl}/api/expenses`, request);
  }

  getAllExpenses(): Observable<ExpenseResponse[]> {
    return this.http.get<ExpenseResponse[]>(`${this.baseUrl}/api/expenses`);
  }

  // Cash Drawer
  openCashDrawer(request: OpenCashDrawerRequest): Observable<CashDrawerResponse> {
    return this.http.post<CashDrawerResponse>(`${this.baseUrl}/api/cash-drawer/open`, request);
  }

  closeCashDrawer(id: number, request: CloseCashDrawerRequest): Observable<CashDrawerResponse> {
    return this.http.post<CashDrawerResponse>(`${this.baseUrl}/api/cash-drawer/${id}/close`, request);
  }

  getCurrentCashDrawer(): Observable<CashDrawerResponse> {
    return this.http.get<CashDrawerResponse>(`${this.baseUrl}/api/cash-drawer/current`);
  }

  // Shift Handover
  createShiftHandover(request: CreateShiftHandoverRequest): Observable<ShiftHandoverResponse> {
    return this.http.post<ShiftHandoverResponse>(`${this.baseUrl}/api/shift-handover`, request);
  }

  acknowledgeShiftHandover(id: number, request: AcknowledgeHandoverRequest): Observable<ShiftHandoverResponse> {
    return this.http.post<ShiftHandoverResponse>(`${this.baseUrl}/api/shift-handover/${id}/acknowledge`, request);
  }

  getShiftHandovers(staffId?: number): Observable<ShiftHandoverResponse[]> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.http.get<ShiftHandoverResponse[]>(`${this.baseUrl}/api/shift-handover${params}`);
  }

  // Utilities
  createUtilityRecord(request: CreateUtilityRequest): Observable<UtilityResponse> {
    return this.http.post<UtilityResponse>(`${this.baseUrl}/api/utilities`, request);
  }

  getUtilityRecords(year?: number, month?: number): Observable<UtilityResponse[]> {
    let params: string[] = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    const q = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<UtilityResponse[]>(`${this.baseUrl}/api/utilities${q}`);
  }
}
