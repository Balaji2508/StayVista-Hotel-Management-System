export type BillStatus = 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED';

export interface BillItemResponse {
  id: number;
  billId?: number;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt?: string;
}

export interface BillResponse {
  id: number;
  reservationId: number;
  guestName?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  items: BillItemResponse[];
  finalizedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBillRequest {
  reservationId: number;
  items?: {
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface AddBillItemRequest {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

export interface FinalizeBillRequest {
  discountPercentage?: number;
  notes?: string;
}

export interface PrintBillResponse {
  billNumber: string;
  reservationCode: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  items: BillItemResponse[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  printedAt: string;
}
