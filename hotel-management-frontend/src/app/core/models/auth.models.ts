export type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPER' | 'GUEST';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  token?: string;
  type: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  role: Role;
  expiresIn: number;
}

export interface TokenRefreshResponse {
  accessToken: string;
  token?: string;
  refreshToken: string;
  type: string;
  expiresIn: number;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  locked: boolean;
  failedLoginAttempts: number;
  lockTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  email?: string;
  role?: Role;
  active?: boolean;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
}

export interface ErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}
