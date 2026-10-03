export type HousekeepingStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'REJECTED';

export interface HousekeepingTaskResponse {
  id: number;
  roomId: number;
  roomNumber?: string;
  assignedStaffId?: number;
  staffName?: string;
  taskType: string;
  status: HousekeepingStatus;
  priority: string;
  notes?: string;
  remarks?: string;
  createdAt?: string;
  completedAt?: string;
  verifiedAt?: string;
}

export interface CreateHousekeepingTaskRequest {
  roomId: number;
  assignedStaffId?: number;
  taskType: string;
  priority?: string;
  notes?: string;
}

export interface TaskHistoryResponse {
  id: number;
  taskId: number;
  oldStatus: string;
  newStatus: string;
  changedByUserId?: number;
  remarks?: string;
  timestamp: string;
}

export interface RoomAssignmentResponse {
  id: number;
  staffId: number;
  staffName?: string;
  startRoomNumber: number;
  endRoomNumber: number;
  active: boolean;
  createdAt?: string;
}

export interface CreateRoomAssignmentRequest {
  staffId: number;
  startRoomNumber: number;
  endRoomNumber: number;
}

export type MaintenanceStatus =
  | 'REPORTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'REJECTED';

export interface MaintenanceResponse {
  id: number;
  roomId: number;
  roomNumber?: string;
  category: string;
  description: string;
  priority: string;
  status: MaintenanceStatus;
  assignedStaffId?: number;
  staffName?: string;
  repairCost?: number;
  remarks?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export interface CreateMaintenanceRequest {
  roomId: number;
  category: string;
  description: string;
  priority?: string;
}

export interface AssignMaintenanceRequest {
  staffId: number;
  notes?: string;
}

export interface ResolveMaintenanceRequest {
  repairCost?: number;
  remarks?: string;
}

export interface UpdateMaintenanceStatusRequest {
  status: MaintenanceStatus;
  remarks?: string;
}

export type BreakageStatus = 'REPORTED' | 'APPROVED' | 'REJECTED' | 'CHARGED';

export interface BreakageResponse {
  id: number;
  roomId: number;
  roomNumber?: string;
  reservationId?: number;
  itemName: string;
  estimatedCost: number;
  status: BreakageStatus;
  remarks?: string;
  reportedByStaffId?: number;
  reviewedByManagerId?: number;
  createdAt?: string;
}

export interface ReportBreakageRequest {
  roomId: number;
  reservationId?: number;
  itemName: string;
  estimatedCost: number;
  remarks?: string;
}

export interface ReviewBreakageRequest {
  status: BreakageStatus;
  remarks?: string;
  managerId?: number;
}

export interface ExpenseResponse {
  id: number;
  category: string;
  amount: number;
  description: string;
  receiptNumber?: string;
  recordedByStaffId?: number;
  expenseDate: string;
  createdAt?: string;
}

export interface CreateExpenseRequest {
  category: string;
  amount: number;
  description: string;
  receiptNumber?: string;
  expenseDate: string;
}

export interface CashDrawerResponse {
  id: number;
  staffId: number;
  openingBalance: number;
  cashReceived: number;
  cashPaidOut: number;
  systemCalculatedClosing: number;
  actualClosingCash?: number;
  discrepancy?: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  remarks?: string;
}

export interface OpenCashDrawerRequest {
  openingBalance: number;
  remarks?: string;
}

export interface CloseCashDrawerRequest {
  actualClosingCash: number;
  remarks?: string;
}

export interface ShiftHandoverResponse {
  id: number;
  outgoingStaffId: number;
  incomingStaffId?: number;
  shiftDate: string;
  pendingTasksNotes?: string;
  arrivalsNotes?: string;
  departuresNotes?: string;
  cashNotes?: string;
  complaintsNotes?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt?: string;
}

export interface CreateShiftHandoverRequest {
  shiftDate: string;
  pendingTasksNotes?: string;
  arrivalsNotes?: string;
  departuresNotes?: string;
  cashNotes?: string;
  complaintsNotes?: string;
}

export interface AcknowledgeHandoverRequest {
  incomingStaffId?: number;
  notes?: string;
}

export interface UtilityResponse {
  id: number;
  utilityType: string;
  year: number;
  month: number;
  unitsConsumed: number;
  totalCost: number;
  billReference?: string;
  recordedAt?: string;
}

export interface CreateUtilityRequest {
  utilityType: string;
  year: number;
  month: number;
  unitsConsumed: number;
  totalCost: number;
  billReference?: string;
}
