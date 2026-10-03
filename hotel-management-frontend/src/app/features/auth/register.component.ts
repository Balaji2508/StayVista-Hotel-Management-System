import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastContainerComponent
  ],
  template: `
    <app-toast-container></app-toast-container>
    <div class="register-page">
      <div class="register-card">
        <div class="register-header">
          <span class="hotel-icon">🏨</span>
          <h1 class="hotel-title">Create Guest Account</h1>
          <p class="hotel-subtitle">Register to book rooms and access hotel services</p>
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
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 1.5rem;
    }

    .register-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .register-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .hotel-icon {
      font-size: 2.5rem;
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
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .register-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #64748b;
    }

    .register-footer a {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
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

    this.authService.register({
      username: username!,
      email: email!,
      password: password!
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.success('Registration successful! Please log in with your credentials.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.error?.error || 'Registration failed. The username or email might already be in use.';
      }
    });
  }
}
