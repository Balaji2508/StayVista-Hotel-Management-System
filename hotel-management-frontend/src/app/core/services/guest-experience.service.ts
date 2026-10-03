import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ComplaintResponse,
  CreateComplaintRequest,
  CreateFeedbackRequest,
  CreateServiceRequest,
  EarnLoyaltyRequest,
  FeedbackResponse,
  LoyaltyAccountResponse,
  LoyaltyTransactionResponse,
  RedeemLoyaltyRequest,
  ServiceRequestHistoryResponse,
  ServiceRequestResponse,
  UpdateComplaintStatusRequest
} from '../models/guest-experience.models';

@Injectable({
  providedIn: 'root'
})
export class GuestExperienceService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Service Requests
  createServiceRequest(request: CreateServiceRequest): Observable<ServiceRequestResponse> {
    return this.http.post<ServiceRequestResponse>(`${this.baseUrl}/api/service-requests`, request);
  }

  getServiceRequestById(id: number): Observable<ServiceRequestResponse> {
    return this.http.get<ServiceRequestResponse>(`${this.baseUrl}/api/service-requests/${id}`);
  }

  getServiceRequestsByReservationId(reservationId: number): Observable<ServiceRequestResponse[]> {
    return this.http.get<ServiceRequestResponse[]>(`${this.baseUrl}/api/service-requests/reservation/${reservationId}`);
  }

  getServiceRequestsByGuestId(guestId: number): Observable<ServiceRequestResponse[]> {
    return this.http.get<ServiceRequestResponse[]>(`${this.baseUrl}/api/service-requests/guest/${guestId}`);
  }

  cancelServiceRequest(id: number): Observable<ServiceRequestResponse> {
    return this.http.post<ServiceRequestResponse>(`${this.baseUrl}/api/service-requests/${id}/cancel`, {});
  }

  getServiceRequestHistory(id: number): Observable<ServiceRequestHistoryResponse[]> {
    return this.http.get<ServiceRequestHistoryResponse[]>(`${this.baseUrl}/api/service-requests/${id}/history`);
  }

  // Complaints
  createComplaint(request: CreateComplaintRequest): Observable<ComplaintResponse> {
    return this.http.post<ComplaintResponse>(`${this.baseUrl}/api/complaints`, request);
  }

  getAllComplaints(): Observable<ComplaintResponse[]> {
    return this.http.get<ComplaintResponse[]>(`${this.baseUrl}/api/complaints`);
  }

  getComplaintById(id: number): Observable<ComplaintResponse> {
    return this.http.get<ComplaintResponse>(`${this.baseUrl}/api/complaints/${id}`);
  }

  getComplaintsByGuestId(guestId: number): Observable<ComplaintResponse[]> {
    return this.http.get<ComplaintResponse[]>(`${this.baseUrl}/api/complaints/guest/${guestId}`);
  }

  updateComplaintStatus(id: number, request: UpdateComplaintStatusRequest): Observable<ComplaintResponse> {
    return this.http.put<ComplaintResponse>(`${this.baseUrl}/api/complaints/${id}/status`, request);
  }

  // Feedback
  submitFeedback(request: CreateFeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.baseUrl}/api/feedback`, request);
  }

  getFeedbackByGuestId(guestId: number): Observable<FeedbackResponse[]> {
    return this.http.get<FeedbackResponse[]>(`${this.baseUrl}/api/feedback/guest/${guestId}`);
  }

  getFeedbackByReservationId(reservationId: number): Observable<FeedbackResponse[]> {
    return this.http.get<FeedbackResponse[]>(`${this.baseUrl}/api/feedback/reservation/${reservationId}`);
  }

  // Loyalty
  getLoyaltyAccountByGuestId(guestId: number): Observable<LoyaltyAccountResponse> {
    return this.http.get<LoyaltyAccountResponse>(`${this.baseUrl}/api/loyalty/guest/${guestId}`);
  }

  earnPoints(request: EarnLoyaltyRequest): Observable<LoyaltyAccountResponse> {
    return this.http.post<LoyaltyAccountResponse>(`${this.baseUrl}/api/loyalty/earn`, request);
  }

  redeemPoints(request: RedeemLoyaltyRequest): Observable<LoyaltyAccountResponse> {
    return this.http.post<LoyaltyAccountResponse>(`${this.baseUrl}/api/loyalty/redeem`, request);
  }

  getLoyaltyTransactions(accountId: number): Observable<LoyaltyTransactionResponse[]> {
    return this.http.get<LoyaltyTransactionResponse[]>(`${this.baseUrl}/api/loyalty/${accountId}/transactions`);
  }
}
