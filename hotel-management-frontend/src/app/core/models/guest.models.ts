export interface GuestResponse {
  id: number;
  userId?: number;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  company?: string;
  email: string;
  gender?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGuestRequest {
  userId?: number;
  firstName: string;
  lastName: string;
  phone: string;
  company?: string;
  email: string;
  gender?: string;
  address?: string;
}

export interface UpdateGuestRequest {
  firstName: string;
  lastName: string;
  phone: string;
  company?: string;
  email: string;
  gender?: string;
  address?: string;
}
