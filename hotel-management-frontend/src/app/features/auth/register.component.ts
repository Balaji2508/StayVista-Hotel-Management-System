import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-register',
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
    <div class="register-page">
      <div class="register-card">
        <div class="register-header">
          <div class="brand-badge-icon">
            <app-icon name="building" [size]="28" color="#ffffff"></app-icon>
          </div>
          <h1 class="hotel-title">Create Guest Account</h1>
          <p class="hotel-subtitle">Register to book rooms and access StayVista guest services</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              class="form-control"
              formControlName="username"
              placeholder="e.g. johndoe"
              autocomplete="username"
            />
            <span
              *ngIf="registerForm.get('username')?.touched && registerForm.get('username')?.hasError('required')"
              class="form-error"
            >
              Username is required.
            </span>
            <span
              *ngIf="registerForm.get('username')?.touched && registerForm.get('username')?.hasError('minlength')"
              class="form-error"
            >
              Username must be at least 3 characters.
            </span>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="e.g. guest@example.com"
              autocomplete="email"
            />
            <span
              *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.hasError('required')"
              class="form-error"
            >
              Email address is required.
            </span>
            <span
              *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.hasError('email')"
              class="form-error"
            >
              Please enter a valid email address.
            </span>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="Minimum 6 characters"
              autocomplete="new-password"
            />
            <span
              *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.hasError('required')"
              class="form-error"
            >
              Password is required.
            </span>
            <span
              *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.hasError('minlength')"
              class="form-error"
            >
              Password must be at least 6 characters.
            </span>
          </div>

          <div class="form-error-banner" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="registerForm.invalid || isLoading"
          >
            <span *ngIf="!isLoading">Register Account</span>
            <span *ngIf="isLoading">Creating account...</span>
          </button>
        </form>

        <div class="register-footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 2rem 1.5rem;
      position: relative;
    }

    .register-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 300px;
      background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
      pointer-events: none;
    }

    .register-card {
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

    .register-header {
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

    .register-form {
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

    .register-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--slate-100);
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    .register-footer a {
      color: var(--primary-600);
      font-weight: 600;
      text-decoration: none;
    }

    .register-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationUiService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { username, email, password } = this.registerForm.value;

    this.authService
      .register({
        username: username!,
        email: email!,
        password: password!
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.notificationService.success('Registration successful! Please log in with your credentials.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err.error?.message ||
            err.error?.error ||
            'Registration failed. The username or email might already be in use.';
        }
      });
  }
}
