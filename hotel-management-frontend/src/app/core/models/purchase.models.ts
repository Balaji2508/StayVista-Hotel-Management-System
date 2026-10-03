export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';

export interface SupplierResponse {
  id: number;
  supplierCode: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  rating?: number;
  status: SupplierStatus;
  createdAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  rating?: number;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  rating?: number;
  status?: SupplierStatus;
}

export type RequestStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ORDERED';

export interface PurchaseRequestItemResponse {
  id: number;
  itemId: number;
  itemName?: string;
  requestedQuantity: number;
  estimatedUnitCost?: number;
  estimatedTotalCost?: number;
}

export interface PurchaseRequestResponse {
  id: number;
  prNumber: string;
  requesterId: number;
  requesterRole: string;
  priority: string;
  status: RequestStatus;
  justification: string;
  approvedByManagerId?: number;
  items: PurchaseRequestItemResponse[];
  totalEstimatedCost?: number;
  createdAt?: string;
}

export interface CreatePurchaseRequest {
  priority: string;
  justification: string;
  items: {
    itemId: number;
    requestedQuantity: number;
    estimatedUnitCost?: number;
  }[];
}

export interface ApprovePurchaseRequest {
  managerId?: number;
  remarks?: string;
}

export interface RejectPurchaseRequest {
  managerId?: number;
  rejectionReason: string;
}

export interface SupplierQuotationResponse {
  id: number;
  quotationNumber: string;
  purchaseRequestId: number;
  supplierId: number;
  supplierName?: string;
  unitPrice: number;
  totalPrice: number;
  deliveryLeadDays: number;
  validityDate: string;
  selected: boolean;
  createdAt?: string;
}

export interface CreateQuotationRequest {
  purchaseRequestId: number;
  supplierId: number;
  unitPrice: number;
  deliveryLeadDays: number;
  validityDate: string;
  remarks?: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SENT_TO_SUPPLIER'
  | 'PARTIALLY_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PurchaseOrderResponse {
  id: number;
  poNumber: string;
  purchaseRequestId?: number;
  supplierId: number;
  supplierName?: string;
  totalAmount: number;
  status: OrderStatus;
  approvedByManagerId?: number;
  deliveryDueDate?: string;
  createdAt?: string;
}

export interface CreatePurchaseOrderRequest {
  purchaseRequestId?: number;
  supplierId: number;
  quotationId?: number;
  deliveryDueDate?: string;
  items?: {
    itemId: number;
    quantity: number;
    unitPrice: number;
  }[];
  remarks?: string;
}

export interface ApprovePurchaseOrderRequest {
  managerId?: number;
  remarks?: string;
}

export interface GoodsReceiptResponse {
  id: number;
  grnNumber: string;
  purchaseOrderId: number;
  receivedByStaffId: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  inspectionRemarks?: string;
  deliveryNoteNumber?: string;
  receivedAt: string;
}

export interface CreateGoodsReceiptRequest {
  purchaseOrderId: number;
  receivedByStaffId?: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  inspectionRemarks?: string;
  deliveryNoteNumber?: string;
}
