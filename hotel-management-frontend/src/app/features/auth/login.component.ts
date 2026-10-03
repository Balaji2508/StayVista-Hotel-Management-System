import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastContainerComponent,
    IconComponent
  ],
  template: `
    <app-toast-container></app-toast-container>
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="brand-badge-icon">
            <app-icon name="building" [size]="28" color="#ffffff"></app-icon>
          </div>
          <h1 class="hotel-title">StayVista</h1>
          <p class="hotel-subtitle">Enterprise Hotel Management System</p>
        </div>

        <!-- Quick Role Switcher for Testing -->
        <div class="quick-roles">
          <div class="quick-title-row">
            <span class="quick-title">Quick Demo Login</span>
            <span class="quick-hint">Click to populate</span>
          </div>
          <div class="role-chips">
            <button type="button" class="role-chip" (click)="fillRole('admin', 'Admin@123')">
              <span class="chip-role">Admin</span>
            </button>
            <button type="button" class="role-chip" (click)="fillRole('owner', 'Owner@123')">
              <span class="chip-role">Owner</span>
            </button>
            <button type="button" class="role-chip" (click)="fillRole('manager', 'Manager@123')">
              <span class="chip-role">Manager</span>
            </button>
            <button type="button" class="role-chip" (click)="fillRole('receptionist', 'Reception@123')">
              <span class="chip-role">Receptionist</span>
            </button>
            <button type="button" class="role-chip" (click)="fillRole('housekeeper', 'Housekeeper@123')">
              <span class="chip-role">Housekeeper</span>
            </button>
            <button type="button" class="role-chip" (click)="fillRole('guest', 'Guest@123')">
              <span class="chip-role">Guest</span>
            </button>
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
              placeholder="e.g. admin or receptionist"
              autocomplete="username"
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
              autocomplete="current-password"
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
            <span *ngIf="!isLoading">Sign In to StayVista</span>
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
      background: #f8fafc;
      padding: 2rem 1.5rem;
      position: relative;
    }

    .login-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 300px;
      background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
      pointer-events: none;
    }

    .login-card {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-xl);
      padding: 2.5rem 2.25rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      position: relative;
      z-index: 1;
    }

    .login-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-badge-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.875rem;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }

    .hotel-title {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
      letter-spacing: -0.03em;
    }

    .hotel-subtitle {
      font-size: 0.875rem;
      color: var(--slate-500);
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .quick-roles {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .quick-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .quick-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: var(--font-heading);
    }

    .quick-hint {
      font-size: 0.6875rem;
      color: var(--slate-400);
    }

    .role-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .role-chip {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      padding: 0.3125rem 0.625rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-700);
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-xs);
    }

    .role-chip:hover {
      background: var(--primary-50);
      border-color: var(--primary-300);
      transform: translateY(-1px);
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
      background: var(--accent-rose-light);
      border: 1px solid #fecdd3;
      color: #be123c;
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .login-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--slate-100);
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    .login-footer a {
      color: var(--primary-600);
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
        this.errorMessage =
          err.error?.message ||
          err.error?.error ||
          'Invalid credentials or account locked. Please check your username and password.';
      }
    });
  }
}
