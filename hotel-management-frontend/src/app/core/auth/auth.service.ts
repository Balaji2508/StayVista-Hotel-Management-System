import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CreateUserRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  Role,
  TokenRefreshResponse,
  UpdateUserRequest,
  UserResponse
} from '../models/auth.models';

const TOKEN_KEY = 'hms_access_token';
const REFRESH_TOKEN_KEY = 'hms_refresh_token';
const USER_KEY = 'hms_current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<UserResponse | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUserSig = signal<UserResponse | null>(this.getStoredUser());

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, credentials).pipe(
      tap(res => {
        const token = res.accessToken || res.token || '';
        this.saveTokens(token, res.refreshToken);

        const user: UserResponse = {
          id: res.userId,
          username: res.username,
          email: res.email,
          role: res.role,
          active: true,
          locked: false,
          failedLoginAttempts: 0
        };
        this.saveUser(user);
      })
    );
  }

  register(data: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/api/auth/register`, data);
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearStorage();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<TokenRefreshResponse>(`${this.baseUrl}/api/auth/refresh`, { refreshToken }).pipe(
      tap(res => {
        const token = res.accessToken || res.token || '';
        this.saveTokens(token, res.refreshToken || refreshToken);
      }),
      catchError(err => {
        this.clearStorage();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  logout(): Observable<MessageResponse | void> {
    const refreshToken = this.getRefreshToken();
    const logoutReq = refreshToken
      ? this.http.post<MessageResponse>(`${this.baseUrl}/api/auth/logout`, { refreshToken })
      : of({ message: 'Logged out successfully', success: true });

    return logoutReq.pipe(
      tap(() => this.handleLogout()),
      catchError(() => {
        this.handleLogout();
        return of({ message: 'Logged out locally', success: true });
      })
    );
  }

  private handleLogout(): void {
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): Role | null {
    return this.currentUserSubject.value?.role || null;
  }

  hasRole(role: Role): boolean {
    const current = this.getCurrentUser();
    return current?.role === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    const current = this.getCurrentUser();
    if (!current?.role) return false;
    return roles.includes(current.role);
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private saveUser(user: UserResponse): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSig.set(user);
  }

  private getStoredUser(): UserResponse | null {
    const item = localStorage.getItem(USER_KEY);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.currentUserSig.set(null);
  }

  // User Management APIs (/api/users/**)
  getAllUsers(role?: Role): Observable<UserResponse[]> {
    const params = role ? `?role=${role}` : '';
    return this.http.get<UserResponse[]>(`${this.baseUrl}/api/users${params}`);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/api/users/${id}`);
  }

  createUser(req: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/api/users`, req);
  }

  updateUser(id: number, req: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/api/users/${id}`, req);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/users/${id}`);
  }

  unlockUser(id: number): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/api/users/${id}/unlock`, {});
  }

  setUserActiveStatus(id: number, active: boolean): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/api/users/${id}/status?active=${active}`, {});
  }
}
