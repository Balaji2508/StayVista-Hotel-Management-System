import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddBillItemRequest,
  BillItemResponse,
  BillResponse,
  CreateBillRequest,
  FinalizeBillRequest,
  PrintBillResponse
} from '../models/billing.models';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/bills`;

  createBill(request: CreateBillRequest): Observable<BillResponse> {
    return this.http.post<BillResponse>(this.baseUrl, request);
  }

  getBillById(id: number): Observable<BillResponse> {
    return this.http.get<BillResponse>(`${this.baseUrl}/${id}`);
  }

  getBillByReservationId(reservationId: number): Observable<BillResponse> {
    return this.http.get<BillResponse>(`${this.baseUrl}/reservation/${reservationId}`);
  }

  recordPaymentForReservation(reservationId: number, amount: number): Observable<BillResponse> {
    return this.http.post<BillResponse>(
      `${this.baseUrl}/reservation/${reservationId}/record-payment?amount=${amount}`,
      {}
    );
  }

  addItemToBill(id: number, request: AddBillItemRequest): Observable<BillItemResponse> {
    return this.http.post<BillItemResponse>(`${this.baseUrl}/${id}/items`, request);
  }

  calculateBill(id: number): Observable<BillResponse> {
    return this.http.post<BillResponse>(`${this.baseUrl}/${id}/calculate`, {});
  }

  finalizeBill(id: number, request?: FinalizeBillRequest): Observable<BillResponse> {
    return this.http.post<BillResponse>(`${this.baseUrl}/${id}/finalize`, request || {});
  }

  getPrintBill(id: number): Observable<PrintBillResponse> {
    return this.http.get<PrintBillResponse>(`${this.baseUrl}/${id}/print`);
  }
}
