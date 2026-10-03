import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <header class="app-header">
      <div class="brand">
        <a routerLink="/dashboard" class="brand-link">
          <span class="brand-logo">🏨</span>
          <div class="brand-text">
            <span class="brand-name">Grand Horizon</span>
            <span class="brand-sub">HMS Enterprise</span>
          </div>
        </a>
      </div>

      <div class="header-right">
        <!-- User Profile & Role -->
        <div class="user-profile" *ngIf="authService.currentUser$ | async as user">
          <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <app-status-badge [status]="user.role"></app-status-badge>
          </div>
        </div>

        <!-- Quick Notifications Icon -->
        <a routerLink="/notifications" class="icon-btn" title="Notifications">
          <span>🔔</span>
        </a>

        <!-- Logout Action -->
        <button class="logout-btn" (click)="onLogout()" title="Log Out">
          <span>🚪</span>
          <span class="logout-text">Logout</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 68px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }

    .brand-logo {
      font-size: 1.75rem;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .brand-sub {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding-right: 1.25rem;
      border-right: 1px solid #e2e8f0;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9375rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .username {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      text-decoration: none;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      transition: background 0.15s;
    }
    .icon-btn:hover {
      background: #f1f5f9;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #ef4444;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .logout-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    @media (max-width: 640px) {
      .logout-text { display: none; }
      .brand-sub { display: none; }
    }
  `]
})
export class HeaderComponent {
  public authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
