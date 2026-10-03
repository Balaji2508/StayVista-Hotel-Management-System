export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CreateReservationRequest {
  guestId: number;
  resourceType?: string;
  roomId?: number;
  hallId?: number;
  roomCategoryId?: number;
  hallCategoryId?: number;
  adults: number;
  children?: number;
  checkInDateTime: string;
  checkOutDateTime: string;
  specialRequests?: string;
}

export interface UpdateReservationRequest {
  adults?: number;
  children?: number;
  checkInDateTime?: string;
  checkOutDateTime?: string;
  specialRequests?: string;
}

export interface ReservationResponse {
  id: number;
  reservationCode: string;
  guestId: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  resourceType: string;
  roomId?: number;
  roomNumber?: string;
  hallId?: number;
  roomCategoryId?: number;
  roomCategoryName?: string;
  adults: number;
  children?: number;
  checkInDateTime: string;
  checkOutDateTime: string;
  status: ReservationStatus;
  totalAmount: number;
  advancePaid?: number;
  specialRequests?: string;
  cancellationReason?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomTransferRequest {
  newRoomId: number;
  reason?: string;
}

export interface RoomUpgradeRequest {
  newCategoryId: number;
  newRoomId?: number;
  additionalChargeAccepted?: boolean;
}

export interface RoomDowngradeRequest {
  newCategoryId: number;
  newRoomId?: number;
}

export interface EarlyCheckInRequest {
  earlyCheckInTime: string;
  additionalFee?: number;
}

export interface LateCheckoutRequest {
  lateCheckoutTime: string;
  additionalFee?: number;
}

export interface WaitlistRequest {
  guestId: number;
  categoryId: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  notes?: string;
}

export interface WaitlistResponse {
  id: number;
  guestId: number;
  guestName?: string;
  categoryId: number;
  categoryName?: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  status: string;
  queuePosition?: number;
  createdAt?: string;
}
