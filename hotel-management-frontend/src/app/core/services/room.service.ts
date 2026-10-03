import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AmenityResponse,
  CreateAmenityRequest,
  CreateRoomCategoryRequest,
  CreateRoomRequest,
  RoomCategoryResponse,
  RoomResponse,
  RoomStatus,
  RoomStatusUpdateRequest,
  UpdateRoomRequest
} from '../models/room.models';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Rooms
  createRoom(request: CreateRoomRequest): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(`${this.baseUrl}/api/rooms`, request);
  }

  getAllRooms(includeInactive: boolean = false): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.baseUrl}/api/rooms?includeInactive=${includeInactive}`);
  }

  getRoomById(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.baseUrl}/api/rooms/${id}`);
  }

  getRoomByNumber(roomNumber: string): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.baseUrl}/api/rooms/number/${roomNumber}`);
  }

  getAvailableRooms(categoryId?: number, minCapacity?: number): Observable<RoomResponse[]> {
    let params: string[] = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (minCapacity) params.push(`minCapacity=${minCapacity}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<RoomResponse[]>(`${this.baseUrl}/api/rooms/available${query}`);
  }

  getRoomsByStatus(status: RoomStatus, includeInactive: boolean = false): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(
      `${this.baseUrl}/api/rooms/status/${status}?includeInactive=${includeInactive}`
    );
  }

  updateRoom(id: number, request: UpdateRoomRequest): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.baseUrl}/api/rooms/${id}`, request);
  }

  activateRoom(id: number): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.baseUrl}/api/rooms/${id}/activate`, {});
  }

  deactivateRoom(id: number): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.baseUrl}/api/rooms/${id}/deactivate`, {});
  }

  updateRoomStatus(id: number, request: RoomStatusUpdateRequest): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.baseUrl}/api/rooms/${id}/status`, request);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/rooms/${id}`);
  }

  // Room Categories
  getAllCategories(): Observable<RoomCategoryResponse[]> {
    return this.http.get<RoomCategoryResponse[]>(`${this.baseUrl}/api/room-categories`);
  }

  getCategoryById(id: number): Observable<RoomCategoryResponse> {
    return this.http.get<RoomCategoryResponse>(`${this.baseUrl}/api/room-categories/${id}`);
  }

  createCategory(request: CreateRoomCategoryRequest): Observable<RoomCategoryResponse> {
    return this.http.post<RoomCategoryResponse>(`${this.baseUrl}/api/room-categories`, request);
  }

  updateCategory(id: number, request: CreateRoomCategoryRequest): Observable<RoomCategoryResponse> {
    return this.http.put<RoomCategoryResponse>(`${this.baseUrl}/api/room-categories/${id}`, request);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/room-categories/${id}`);
  }

  // Amenities
  getAllAmenities(): Observable<AmenityResponse[]> {
    return this.http.get<AmenityResponse[]>(`${this.baseUrl}/api/amenities`);
  }

  getAmenityById(id: number): Observable<AmenityResponse> {
    return this.http.get<AmenityResponse>(`${this.baseUrl}/api/amenities/${id}`);
  }

  createAmenity(request: CreateAmenityRequest): Observable<AmenityResponse> {
    return this.http.post<AmenityResponse>(`${this.baseUrl}/api/amenities`, request);
  }

  updateAmenity(id: number, request: CreateAmenityRequest): Observable<AmenityResponse> {
    return this.http.put<AmenityResponse>(`${this.baseUrl}/api/amenities/${id}`, request);
  }

  deleteAmenity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/amenities/${id}`);
  }
}
