import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DailySummaryResponse,
  ExpenseReportResponse,
  OccupancyReportResponse,
  RevenueReportResponse,
  StaffPerformanceReportResponse
} from '../models/reporting.models';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/reports`;

  getOccupancyReport(startDate: string, endDate: string): Observable<OccupancyReportResponse> {
    return this.http.get<OccupancyReportResponse>(
      `${this.baseUrl}/occupancy?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getRevenueReport(startDate: string, endDate: string): Observable<RevenueReportResponse> {
    return this.http.get<RevenueReportResponse>(
      `${this.baseUrl}/revenue?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getExpenseReport(startDate: string, endDate: string): Observable<ExpenseReportResponse> {
    return this.http.get<ExpenseReportResponse>(
      `${this.baseUrl}/expenses?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getStaffPerformanceReport(startDate: string, endDate: string): Observable<StaffPerformanceReportResponse> {
    return this.http.get<StaffPerformanceReportResponse>(
      `${this.baseUrl}/staff-performance?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getDailySummary(date?: string): Observable<DailySummaryResponse> {
    const params = date ? `?date=${date}` : '';
    return this.http.get<DailySummaryResponse>(`${this.baseUrl}/daily-summary${params}`);
  }

  generateDailySummary(date?: string): Observable<DailySummaryResponse> {
    const params = date ? `?date=${date}` : '';
    return this.http.post<DailySummaryResponse>(`${this.baseUrl}/daily-summary/generate${params}`, {});
  }
}
