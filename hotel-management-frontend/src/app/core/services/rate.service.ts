import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRateRequest,
  QuoteRequest,
  RateQuoteResponse,
  RateResponse,
  UpdateRateRequest
} from '../models/rate.models';

@Injectable({
  providedIn: 'root'
})
export class RateService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/rates`;

  createRate(request: CreateRateRequest): Observable<RateResponse> {
    return this.http.post<RateResponse>(this.baseUrl, request);
  }

  getAllRates(): Observable<RateResponse[]> {
    return this.http.get<RateResponse[]>(this.baseUrl);
  }

  getRateById(id: number): Observable<RateResponse> {
    return this.http.get<RateResponse>(`${this.baseUrl}/${id}`);
  }

  getRateByCategoryId(categoryId: number): Observable<RateResponse> {
    return this.http.get<RateResponse>(`${this.baseUrl}/category/${categoryId}`);
  }

  updateRate(id: number, request: UpdateRateRequest): Observable<RateResponse> {
    return this.http.put<RateResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteRate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  calculateQuote(request: QuoteRequest): Observable<RateQuoteResponse> {
    return this.http.post<RateQuoteResponse>(`${this.baseUrl}/quote`, request);
  }
}
