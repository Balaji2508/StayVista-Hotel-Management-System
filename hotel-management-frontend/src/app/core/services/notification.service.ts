import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationResponse, Page } from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/notifications`;

  getNotifications(page: number = 0, size: number = 20): Observable<Page<NotificationResponse>> {
    return this.http.get<Page<NotificationResponse>>(`${this.baseUrl}?page=${page}&size=${size}`);
  }

  getNotificationById(id: number): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/${id}`);
  }

  markAsRead(id: number): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(`${this.baseUrl}/${id}/read`, {});
  }
}
