export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'WALLET';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface CreatePaymentRequest {
  reservationId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  providerReference?: string;
  idempotencyKey: string;
}

export interface RefundRequest {
  amount: number;
  reason: string;
  idempotencyKey: string;
}

export interface PaymentResponse {
  id: number;
  reservationId: number;
  amount: number;
  refundedAmount?: number;
  remainingRefundableAmount?: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  providerReference?: string;
  idempotencyKey: string;
  paymentTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RefundResponse {
  id: number;
  paymentId: number;
  refundAmount: number;
  status: string;
  reason: string;
  idempotencyKey: string;
  refundedAt: string;
}
