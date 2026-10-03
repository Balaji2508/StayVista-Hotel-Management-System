import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateGuestRequest, GuestResponse, UpdateGuestRequest } from '../models/guest.models';

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/guests`;

  createGuest(request: CreateGuestRequest): Observable<GuestResponse> {
    return this.http.post<GuestResponse>(this.baseUrl, request);
  }

  getAllGuests(): Observable<GuestResponse[]> {
    return this.http.get<GuestResponse[]>(this.baseUrl);
  }

  getGuestById(id: number): Observable<GuestResponse> {
    return this.http.get<GuestResponse>(`${this.baseUrl}/${id}`);
  }

  getGuestByUserId(userId: number): Observable<GuestResponse> {
    return this.http.get<GuestResponse>(`${this.baseUrl}/user/${userId}`);
  }

  getGuestByMemberCode(memberCode: string): Observable<GuestResponse> {
    return this.http.get<GuestResponse>(`${this.baseUrl}/member/${memberCode}`);
  }

  updateGuest(id: number, request: UpdateGuestRequest): Observable<GuestResponse> {
    return this.http.put<GuestResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteGuest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
