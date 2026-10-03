import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateItemRequest,
  InventoryCategory,
  ItemResponse,
  ReorderRuleRequest,
  ReorderRuleResponse,
  StockMovementRequest,
  StockMovementResponse,
  UpdateItemRequest
} from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/inventory`;

  createItem(request: CreateItemRequest): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(this.baseUrl, request);
  }

  getAllItems(category?: InventoryCategory): Observable<ItemResponse[]> {
    const params = category ? `?category=${category}` : '';
    return this.http.get<ItemResponse[]>(`${this.baseUrl}${params}`);
  }

  getLowStockItems(): Observable<ItemResponse[]> {
    return this.http.get<ItemResponse[]>(`${this.baseUrl}/low-stock`);
  }

  getItemById(id: number): Observable<ItemResponse> {
    return this.http.get<ItemResponse>(`${this.baseUrl}/${id}`);
  }

  getItemByCode(itemCode: string): Observable<ItemResponse> {
    return this.http.get<ItemResponse>(`${this.baseUrl}/code/${itemCode}`);
  }

  updateItem(id: number, request: UpdateItemRequest): Observable<ItemResponse> {
    return this.http.put<ItemResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  stockIn(id: number, request: StockMovementRequest): Observable<StockMovementResponse> {
    return this.http.post<StockMovementResponse>(`${this.baseUrl}/${id}/stock-in`, request);
  }

  stockOut(id: number, request: StockMovementRequest): Observable<StockMovementResponse> {
    return this.http.post<StockMovementResponse>(`${this.baseUrl}/${id}/stock-out`, request);
  }

  adjustStock(id: number, request: StockMovementRequest): Observable<StockMovementResponse> {
    return this.http.post<StockMovementResponse>(`${this.baseUrl}/${id}/adjust`, request);
  }

  getMovementsByItem(id: number): Observable<StockMovementResponse[]> {
    return this.http.get<StockMovementResponse[]>(`${this.baseUrl}/${id}/movements`);
  }

  setReorderRule(request: ReorderRuleRequest): Observable<ReorderRuleResponse> {
    return this.http.post<ReorderRuleResponse>(`${this.baseUrl}/reorder-rules`, request);
  }

  getReorderRuleByItem(id: number): Observable<ReorderRuleResponse> {
    return this.http.get<ReorderRuleResponse>(`${this.baseUrl}/${id}/reorder-rules`);
  }
}
