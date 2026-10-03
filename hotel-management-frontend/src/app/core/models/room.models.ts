export type ResourceType = 'ROOM' | 'HALL';

export type RoomStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'DIRTY'
  | 'CLEANING'
  | 'CLEAN'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export interface AmenityResponse {
  id: number;
  name: string;
  description?: string;
  cost?: number;
  active: boolean;
}

export interface CreateAmenityRequest {
  name: string;
  description?: string;
  cost?: number;
}

export interface RoomCategoryResponse {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  active: boolean;
}

export interface CreateRoomCategoryRequest {
  name: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
}

export interface RoomResponse {
  id: number;
  roomNumber: string;
  category: RoomCategoryResponse;
  resourceType: ResourceType;
  floor: number;
  capacity: number;
  pricePerNight: number;
  status: RoomStatus;
  active: boolean;
  amenities: AmenityResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoomRequest {
  roomNumber: string;
  categoryId: number;
  resourceType?: ResourceType;
  floor: number;
  capacity: number;
  pricePerNight: number;
  amenityIds?: number[];
}

export interface UpdateRoomRequest {
  roomNumber?: string;
  categoryId?: number;
  floor?: number;
  capacity?: number;
  pricePerNight?: number;
  amenityIds?: number[];
}

export interface RoomStatusUpdateRequest {
  status: RoomStatus;
  remarks?: string;
}
