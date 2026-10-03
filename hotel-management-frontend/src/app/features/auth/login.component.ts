import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastContainerComponent
  ],
  template: `
    <app-toast-container></app-toast-container>
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <span class="hotel-icon">🏨</span>
          <h1 class="hotel-title">Grand Horizon HMS</h1>
          <p class="hotel-subtitle">Enterprise Hotel Management Platform</p>
        </div>

        <!-- Quick Role Switcher for Testing -->
        <div class="quick-roles">
          <span class="quick-title">Quick Role Login:</span>
          <div class="role-chips">
            <button type="button" class="role-chip" (click)="fillRole('admin', 'Admin@123')">Admin</button>
            <button type="button" class="role-chip" (click)="fillRole('owner', 'Owner@123')">Owner</button>
            <button type="button" class="role-chip" (click)="fillRole('manager', 'Manager@123')">Manager</button>
            <button type="button" class="role-chip" (click)="fillRole('receptionist', 'Reception@123')">Receptionist</button>
            <button type="button" class="role-chip" (click)="fillRole('housekeeper', 'Housekeeper@123')">Housekeeper</button>
            <button type="button" class="role-chip" (click)="fillRole('johndoe', 'Password@123')">Guest</button>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="usernameOrEmail">Username or Email</label>
            <input
              id="usernameOrEmail"
              type="text"
              class="form-control"
              formControlName="usernameOrEmail"
              placeholder="e.g. admin or admin@hms.com"
            />
            <span
              *ngIf="loginForm.get('usernameOrEmail')?.touched && loginForm.get('usernameOrEmail')?.hasError('required')"
              class="form-error"
            >
              Username or email is required.
            </span>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="••••••••"
            />
            <span
              *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.hasError('required')"
              class="form-error"
            >
              Password is required.
            </span>
          </div>

          <div class="form-error-banner" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="loginForm.invalid || isLoading"
          >
            <span *ngIf="!isLoading">Sign In</span>
            <span *ngIf="isLoading">Authenticating...</span>
          </button>
        </form>

        <div class="login-footer">
          <p>Need a guest account? <a routerLink="/register">Register here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 1.5rem;
    }

    .login-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .login-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .hotel-icon {
      font-size: 2.75rem;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .hotel-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .hotel-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .quick-roles {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .quick-title {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.5rem;
    }

    .role-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .role-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #2563eb;
      cursor: pointer;
      transition: all 0.15s;
    }
    .role-chip:hover {
      background: #eff6ff;
      border-color: #93c5fd;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .btn-block {
      width: 100%;
      height: 44px;
      font-size: 0.9375rem;
      margin-top: 0.5rem;
    }

    .form-error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .login-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #64748b;
    }

    .login-footer a {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }
    .login-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationUiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = false;
  errorMessage = '';

  loginForm = this.fb.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  fillRole(user: string, pass: string): void {
    this.loginForm.patchValue({
      usernameOrEmail: user,
      password: pass
    });
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { usernameOrEmail, password } = this.loginForm.value;

    this.authService.login({ usernameOrEmail: usernameOrEmail!, password: password! }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.notificationService.success(`Welcome back, ${res.username}! Role: ${res.role}`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.error?.error || 'Invalid credentials or account locked. Please check your username and password.';
      }
    });
  }
}
