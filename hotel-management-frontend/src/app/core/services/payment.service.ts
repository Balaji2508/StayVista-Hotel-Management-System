import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse
} from '../models/payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/payments`;

  processPayment(request: CreatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.baseUrl, request);
  }

  getPaymentById(id: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/${id}`);
  }

  getPaymentsByReservationId(reservationId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.baseUrl}/reservation/${reservationId}`);
  }

  processRefund(id: number, request: RefundRequest): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(`${this.baseUrl}/${id}/refund`, request);
  }
}
