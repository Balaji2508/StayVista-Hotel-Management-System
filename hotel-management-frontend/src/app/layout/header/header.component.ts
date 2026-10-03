import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, IconComponent],
  template: `
    <header class="app-header">
      <div class="header-left">
        <!-- Mobile Sidebar Toggle -->
        <button
          type="button"
          class="mobile-toggle-btn"
          (click)="toggleSidebar.emit()"
          aria-label="Toggle navigation menu"
        >
          <app-icon name="menu" [size]="20"></app-icon>
        </button>

        <!-- StayVista Brand -->
        <a routerLink="/dashboard" class="brand-link" title="StayVista Hotel Management System">
          <div class="brand-icon-wrapper">
            <app-icon name="building" [size]="20" color="#ffffff"></app-icon>
          </div>
          <div class="brand-text">
            <div class="brand-name-row">
              <span class="brand-name">StayVista</span>
              <span class="brand-badge">HMS</span>
            </div>
            <span class="brand-sub">Hospitality Management</span>
          </div>
        </a>
      </div>

      <div class="header-right">
        <!-- User Profile & Role -->
        <a
          routerLink="/profile"
          class="user-profile"
          *ngIf="authService.currentUser$ | async as user"
          title="View profile and account settings"
        >
          <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <app-status-badge [status]="user.role"></app-status-badge>
          </div>
        </a>

        <!-- Quick Notifications Icon -->
        <a routerLink="/notifications" class="icon-btn" title="System Notifications">
          <app-icon name="bell" [size]="18" color="#475569"></app-icon>
        </a>

        <!-- Logout Action -->
        <button class="logout-btn" (click)="onLogout()" title="Sign Out of StayVista">
          <app-icon name="log-out" [size]="16" color="#e11d48"></app-icon>
          <span class="logout-text">Logout</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: var(--header-height);
      background: #ffffff;
      border-bottom: 1px solid var(--slate-200);
      padding: 0 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-toggle-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: #ffffff;
      border: 1px solid var(--slate-200);
      color: var(--slate-700);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .mobile-toggle-btn:hover {
      background: var(--slate-50);
      border-color: var(--slate-300);
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      outline: none;
    }

    .brand-icon-wrapper {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-size: 1.1875rem;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.03em;
    }

    .brand-badge {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 1px 5px;
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-200);
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .brand-sub {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--slate-500);
      letter-spacing: 0.02em;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding-right: 1.125rem;
      border-right: 1px solid var(--slate-200);
      text-decoration: none;
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }

    .user-profile:hover {
      opacity: 0.85;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      color: #ffffff;
      font-weight: 700;
      font-family: var(--font-heading);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      box-shadow: 0 1px 3px rgba(29, 78, 216, 0.2);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .username {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
      line-height: 1.2;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--slate-600);
      text-decoration: none;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      transition: all var(--transition-fast);
    }

    .icon-btn:hover {
      background: var(--slate-50);
      border-color: var(--slate-300);
      color: var(--primary-600);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0 0.875rem;
      height: 36px;
      border-radius: var(--radius-md);
      background: #ffffff;
      border: 1px solid #fecdd3;
      color: var(--accent-rose);
      font-weight: 600;
      font-size: 0.8125rem;
      font-family: var(--font-heading);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .logout-btn:hover {
      background: var(--accent-rose-light);
      border-color: #fda4af;
      color: #be123c;
    }

    @media (max-width: 840px) {
      .mobile-toggle-btn {
        display: inline-flex;
      }
      .brand-sub {
        display: none;
      }
      .user-info {
        display: none;
      }
      .user-profile {
        padding-right: 0;
        border-right: none;
      }
    }

    @media (max-width: 640px) {
      .app-header {
        padding: 0 1rem;
      }
      .logout-text {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  public authService = inject(AuthService);
  @Output() toggleSidebar = new EventEmitter<void>();

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
