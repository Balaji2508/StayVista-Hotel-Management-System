import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApprovePurchaseOrderRequest,
  ApprovePurchaseRequest,
  CreateGoodsReceiptRequest,
  CreatePurchaseOrderRequest,
  CreatePurchaseRequest,
  CreateQuotationRequest,
  CreateSupplierRequest,
  GoodsReceiptResponse,
  OrderStatus,
  PurchaseOrderResponse,
  PurchaseRequestResponse,
  RejectPurchaseRequest,
  RequestStatus,
  SupplierQuotationResponse,
  SupplierResponse,
  SupplierStatus,
  UpdateSupplierRequest
} from '../models/purchase.models';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Suppliers
  createSupplier(request: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(`${this.baseUrl}/api/suppliers`, request);
  }

  updateSupplier(id: number, request: UpdateSupplierRequest): Observable<SupplierResponse> {
    return this.http.put<SupplierResponse>(`${this.baseUrl}/api/suppliers/${id}`, request);
  }

  getSupplierById(id: number): Observable<SupplierResponse> {
    return this.http.get<SupplierResponse>(`${this.baseUrl}/api/suppliers/${id}`);
  }

  getAllSuppliers(status?: SupplierStatus): Observable<SupplierResponse[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<SupplierResponse[]>(`${this.baseUrl}/api/suppliers${params}`);
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/suppliers/${id}`);
  }

  // Purchase Requests
  createPurchaseRequest(request: CreatePurchaseRequest): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(`${this.baseUrl}/api/purchase-requests`, request);
  }

  getPurchaseRequestById(id: number): Observable<PurchaseRequestResponse> {
    return this.http.get<PurchaseRequestResponse>(`${this.baseUrl}/api/purchase-requests/${id}`);
  }

  getAllPurchaseRequests(status?: RequestStatus): Observable<PurchaseRequestResponse[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<PurchaseRequestResponse[]>(`${this.baseUrl}/api/purchase-requests${params}`);
  }

  getMyPurchaseRequests(): Observable<PurchaseRequestResponse[]> {
    return this.http.get<PurchaseRequestResponse[]>(`${this.baseUrl}/api/purchase-requests/my`);
  }

  approvePurchaseRequest(id: number, request: ApprovePurchaseRequest): Observable<PurchaseRequestResponse> {
    return this.http.put<PurchaseRequestResponse>(`${this.baseUrl}/api/purchase-requests/${id}/approve`, request);
  }

  rejectPurchaseRequest(id: number, request: RejectPurchaseRequest): Observable<PurchaseRequestResponse> {
    return this.http.put<PurchaseRequestResponse>(`${this.baseUrl}/api/purchase-requests/${id}/reject`, request);
  }

  cancelPurchaseRequest(id: number): Observable<PurchaseRequestResponse> {
    return this.http.put<PurchaseRequestResponse>(`${this.baseUrl}/api/purchase-requests/${id}/cancel`, {});
  }

  // Quotations
  createQuotation(request: CreateQuotationRequest): Observable<SupplierQuotationResponse> {
    return this.http.post<SupplierQuotationResponse>(`${this.baseUrl}/api/quotations`, request);
  }

  getQuotationById(id: number): Observable<SupplierQuotationResponse> {
    return this.http.get<SupplierQuotationResponse>(`${this.baseUrl}/api/quotations/${id}`);
  }

  getQuotationsByPurchaseRequest(prId: number): Observable<SupplierQuotationResponse[]> {
    return this.http.get<SupplierQuotationResponse[]>(`${this.baseUrl}/api/quotations/purchase-request/${prId}`);
  }

  selectQuotation(id: number): Observable<SupplierQuotationResponse> {
    return this.http.put<SupplierQuotationResponse>(`${this.baseUrl}/api/quotations/${id}/select`, {});
  }

  // Purchase Orders
  createPurchaseOrder(request: CreatePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}/api/purchase-orders`, request);
  }

  getPurchaseOrderById(id: number): Observable<PurchaseOrderResponse> {
    return this.http.get<PurchaseOrderResponse>(`${this.baseUrl}/api/purchase-orders/${id}`);
  }

  getAllPurchaseOrders(status?: OrderStatus): Observable<PurchaseOrderResponse[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<PurchaseOrderResponse[]>(`${this.baseUrl}/api/purchase-orders${params}`);
  }

  approvePurchaseOrder(id: number, request: ApprovePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}/api/purchase-orders/${id}/approve`, request);
  }

  sendPurchaseOrder(id: number): Observable<PurchaseOrderResponse> {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}/api/purchase-orders/${id}/send`, {});
  }

  cancelPurchaseOrder(id: number, remarks?: string): Observable<PurchaseOrderResponse> {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}/api/purchase-orders/${id}/cancel`, {
      remarks: remarks || 'Cancelled'
    });
  }

  // Goods Receipts (GRN)
  recordGoodsReceipt(request: CreateGoodsReceiptRequest): Observable<GoodsReceiptResponse> {
    return this.http.post<GoodsReceiptResponse>(`${this.baseUrl}/api/goods-receipts`, request);
  }

  getGoodsReceiptById(id: number): Observable<GoodsReceiptResponse> {
    return this.http.get<GoodsReceiptResponse>(`${this.baseUrl}/api/goods-receipts/${id}`);
  }

  getGoodsReceiptsByPurchaseOrder(poId: number): Observable<GoodsReceiptResponse[]> {
    return this.http.get<GoodsReceiptResponse[]>(`${this.baseUrl}/api/goods-receipts/purchase-order/${poId}`);
  }
}
