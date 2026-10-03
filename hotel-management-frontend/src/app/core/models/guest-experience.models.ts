export type RequestType =
  | 'CLEANING'
  | 'TOWELS'
  | 'FOOD_SERVICE'
  | 'AMENITIES'
  | 'MAINTENANCE'
  | 'OTHER';

export type ServiceRequestStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'FULFILLED'
  | 'CANCELLED';

export interface CreateServiceRequest {
  reservationId: number;
  guestId: number;
  requestType: RequestType;
  description: string;
  roomNumber?: string;
}

export interface ServiceRequestResponse {
  id: number;
  reservationId: number;
  guestId: number;
  requestType: RequestType;
  description: string;
  roomNumber?: string;
  status: ServiceRequestStatus;
  assignedStaffId?: number;
  createdAt?: string;
  fulfilledAt?: string;
}

export interface ServiceRequestHistoryResponse {
  id: number;
  requestId: number;
  oldStatus: string;
  newStatus: string;
  changedByUserId?: number;
  remarks?: string;
  timestamp: string;
}

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplaintStatus = 'OPEN' | 'ASSIGNED' | 'IN_INVESTIGATION' | 'RESOLVED' | 'CLOSED';

export interface CreateComplaintRequest {
  guestId: number;
  reservationId?: number;
  subject: string;
  description: string;
  priority?: ComplaintPriority;
}

export interface AssignComplaintRequest {
  assignedStaffId: number;
  notes?: string;
}

export interface UpdateComplaintStatusRequest {
  status: ComplaintStatus;
  resolutionRemarks?: string;
}

export interface ComplaintResponse {
  id: number;
  guestId: number;
  guestName?: string;
  reservationId?: number;
  subject: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedStaffId?: number;
  resolutionRemarks?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export interface FeedbackResponse {
  id: number;
  guestId: number;
  reservationId?: number;
  overallRating: number;
  cleanlinessRating?: number;
  staffRating?: number;
  serviceRating?: number;
  comments?: string;
  createdAt?: string;
}

export interface CreateFeedbackRequest {
  guestId: number;
  reservationId?: number;
  overallRating: number;
  cleanlinessRating?: number;
  staffRating?: number;
  serviceRating?: number;
  comments?: string;
}

export type LoyaltyTier = 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyAccountResponse {
  id: number;
  guestId: number;
  totalPoints: number;
  currentTier: LoyaltyTier;
  pointsToNextTier: number;
  createdAt?: string;
}

export interface EarnLoyaltyRequest {
  guestId: number;
  points: number;
  source: string;
  reservationId?: number;
}

export interface RedeemLoyaltyRequest {
  guestId: number;
  points: number;
  description: string;
}

export interface LoyaltyTransactionResponse {
  id: number;
  accountId: number;
  transactionType: 'EARN' | 'REDEEM';
  points: number;
  balanceAfter: number;
  description?: string;
  timestamp: string;
}
