import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateReservationRequest,
  EarlyCheckInRequest,
  LateCheckoutRequest,
  ReservationResponse,
  RoomDowngradeRequest,
  RoomTransferRequest,
  RoomUpgradeRequest,
  UpdateReservationRequest,
  WaitlistRequest,
  WaitlistResponse
} from '../models/reservation.models';
import { RateQuoteResponse } from '../models/rate.models';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Reservations
  createReservation(request: CreateReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations`, request);
  }

  getAllReservations(): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.baseUrl}/api/reservations`);
  }

  getReservationById(id: number): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}`);
  }

  getReservationByCode(code: string): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.baseUrl}/api/reservations/code/${code}`);
  }

  getReservationsByGuestId(guestId: number): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.baseUrl}/api/reservations/guest/${guestId}`);
  }

  getReservationsByRoomId(roomId: number): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.baseUrl}/api/reservations/room/${roomId}`);
  }

  updateReservation(id: number, request: UpdateReservationRequest): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}`, request);
  }

  confirmReservation(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/confirm`, {});
  }

  cancelReservation(id: number, reason?: string): Observable<ReservationResponse> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/cancel${params}`, {});
  }

  checkIn(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/check-in`, {});
  }

  checkOut(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/check-out`, {});
  }

  markNoShow(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/no-show`, {});
  }

  transferRoom(id: number, request: RoomTransferRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/room-transfer`, request);
  }

  upgradeRoom(id: number, request: RoomUpgradeRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/room-upgrade`, request);
  }

  downgradeRoom(id: number, request: RoomDowngradeRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/room-downgrade`, request);
  }

  earlyCheckIn(id: number, request: EarlyCheckInRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/early-check-in`, request);
  }

  lateCheckout(id: number, request: LateCheckoutRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/api/reservations/${id}/late-checkout`, request);
  }

  getPriceBreakdown(id: number): Observable<RateQuoteResponse> {
    return this.http.get<RateQuoteResponse>(`${this.baseUrl}/api/reservations/${id}/price-breakdown`);
  }

  previewQuote(request: CreateReservationRequest): Observable<RateQuoteResponse> {
    return this.http.post<RateQuoteResponse>(`${this.baseUrl}/api/reservations/preview-quote`, request);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/reservations/${id}`);
  }

  // Waitlist
  joinWaitlist(request: WaitlistRequest): Observable<WaitlistResponse> {
    return this.http.post<WaitlistResponse>(`${this.baseUrl}/api/waitlist`, request);
  }

  getAllActiveWaitlists(): Observable<WaitlistResponse[]> {
    return this.http.get<WaitlistResponse[]>(`${this.baseUrl}/api/waitlist`);
  }

  getWaitlistById(id: number): Observable<WaitlistResponse> {
    return this.http.get<WaitlistResponse>(`${this.baseUrl}/api/waitlist/${id}`);
  }

  getWaitlistsByGuest(guestId: number): Observable<WaitlistResponse[]> {
    return this.http.get<WaitlistResponse[]>(`${this.baseUrl}/api/waitlist/guest/${guestId}`);
  }

  cancelWaitlist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/waitlist/${id}`);
  }
}
