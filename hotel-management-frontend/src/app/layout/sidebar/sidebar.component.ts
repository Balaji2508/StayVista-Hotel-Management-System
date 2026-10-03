import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, HasRoleDirective, IconComponent],
  template: `
    <!-- Mobile Backdrop -->
    <div
      class="sidebar-backdrop"
      *ngIf="isOpen"
      (click)="closeSidebar.emit()"
      aria-hidden="true"
    ></div>

    <aside class="app-sidebar" [class.open]="isOpen">
      <nav class="sidebar-nav">
        <!-- Main Navigation -->
        <div class="nav-section">
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="dashboard" [size]="18"></app-icon></span>
            <span class="nav-label">Dashboard</span>
          </a>
        </div>

        <!-- Front Desk Section -->
        <div class="nav-section">
          <span class="section-title">Front Desk</span>
          <a
            *hasRole="['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']"
            routerLink="/guests"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="users" [size]="18"></app-icon></span>
            <span class="nav-label">Guests</span>
          </a>
          <a
            routerLink="/reservations"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="calendar" [size]="18"></app-icon></span>
            <span class="nav-label">Reservations</span>
          </a>
          <a
            routerLink="/waitlist"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="clock" [size]="18"></app-icon></span>
            <span class="nav-label">Waitlist</span>
          </a>
        </div>

        <!-- Rooms & Pricing -->
        <div class="nav-section">
          <span class="section-title">Rooms & Pricing</span>
          <a
            routerLink="/rooms"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="bed" [size]="18"></app-icon></span>
            <span class="nav-label">Rooms Grid</span>
          </a>
          <a
            *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
            routerLink="/room-categories"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="tag" [size]="18"></app-icon></span>
            <span class="nav-label">Categories & Amenities</span>
          </a>
          <a
            *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
            routerLink="/rates"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="dollar" [size]="18"></app-icon></span>
            <span class="nav-label">Rates & Calculator</span>
          </a>
        </div>

        <!-- Financials -->
        <div class="nav-section">
          <span class="section-title">Financials</span>
          <a
            routerLink="/billing"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="receipt" [size]="18"></app-icon></span>
            <span class="nav-label">Billing & Folios</span>
          </a>
          <a
            routerLink="/payments"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="credit-card" [size]="18"></app-icon></span>
            <span class="nav-label">Payments & Receipts</span>
          </a>
        </div>

        <!-- Hotel Operations -->
        <div class="nav-section">
          <span class="section-title">Hotel Operations</span>
          <a
            *hasRole="['HOUSEKEEPER', 'MANAGER', 'ADMIN', 'OWNER']"
            routerLink="/operations/housekeeping"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="sparkles" [size]="18"></app-icon></span>
            <span class="nav-label">Housekeeping Tasks</span>
          </a>
          <a
            *hasRole="['MANAGER', 'ADMIN', 'OWNER']"
            routerLink="/operations/room-assignments"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="clipboard" [size]="18"></app-icon></span>
            <span class="nav-label">Room Assignments</span>
          </a>
          <a
            routerLink="/operations/maintenance"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="wrench" [size]="18"></app-icon></span>
            <span class="nav-label">Maintenance</span>
          </a>
          <a
            *hasRole="['HOUSEKEEPER', 'MANAGER', 'ADMIN', 'OWNER']"
            routerLink="/operations/breakage"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="alert-triangle" [size]="18"></app-icon></span>
            <span class="nav-label">Breakage & Damage</span>
          </a>
          <a
            *hasRole="['RECEPTIONIST', 'MANAGER', 'ADMIN', 'OWNER']"
            routerLink="/operations/cash-drawer"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="wallet" [size]="18"></app-icon></span>
            <span class="nav-label">Cash Drawer</span>
          </a>
          <a
            *hasRole="['RECEPTIONIST', 'MANAGER', 'ADMIN', 'OWNER']"
            routerLink="/operations/shift-handover"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="refresh-cw" [size]="18"></app-icon></span>
            <span class="nav-label">Shift Handover</span>
          </a>
          <a
            *hasRole="['MANAGER', 'ADMIN', 'OWNER']"
            routerLink="/operations/expenses"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="trending-down" [size]="18"></app-icon></span>
            <span class="nav-label">Expenses & Utilities</span>
          </a>
        </div>

        <!-- Staff & Rostering -->
        <div
          class="nav-section"
          *hasRole="['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER']"
        >
          <span class="section-title">Staff & Rostering</span>
          <a
            *hasRole="['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']"
            routerLink="/staff"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="briefcase" [size]="18"></app-icon></span>
            <span class="nav-label">Employee Directory</span>
          </a>
          <a
            routerLink="/staff/attendance"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="clock" [size]="18"></app-icon></span>
            <span class="nav-label">Attendance Clock</span>
          </a>
          <a
            *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
            routerLink="/staff/shifts"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="calendar" [size]="18"></app-icon></span>
            <span class="nav-label">Shift Schedules</span>
          </a>
          <a
            routerLink="/staff/leave"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="calendar" [size]="18"></app-icon></span>
            <span class="nav-label">Leave Management</span>
          </a>
        </div>

        <!-- Warehouse & Procurement -->
        <div class="nav-section">
          <span class="section-title">Stock & Procurement</span>
          <a
            routerLink="/inventory"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="package" [size]="18"></app-icon></span>
            <span class="nav-label">Warehouse Inventory</span>
          </a>
          <a
            *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
            routerLink="/purchase/suppliers"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="truck" [size]="18"></app-icon></span>
            <span class="nav-label">Suppliers & Vendors</span>
          </a>
          <a
            routerLink="/purchase/requests"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="file-text" [size]="18"></app-icon></span>
            <span class="nav-label">Purchase Requisitions</span>
          </a>
          <a
            *hasRole="['MANAGER', 'ADMIN', 'OWNER']"
            routerLink="/purchase/orders"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="shopping-cart" [size]="18"></app-icon></span>
            <span class="nav-label">Orders & GRN Delivery</span>
          </a>
        </div>

        <!-- Guest Experience -->
        <div class="nav-section">
          <span class="section-title">Guest Experience</span>
          <a
            routerLink="/guest-experience/requests"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="message-square" [size]="18"></app-icon></span>
            <span class="nav-label">Service & QR Requests</span>
          </a>
          <a
            routerLink="/guest-experience/complaints"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="alert-circle" [size]="18"></app-icon></span>
            <span class="nav-label">Complaints</span>
          </a>
          <a
            routerLink="/guest-experience/feedback"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="star" [size]="18"></app-icon></span>
            <span class="nav-label">Stay Feedback</span>
          </a>
          <a
            routerLink="/guest-experience/loyalty"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="award" [size]="18"></app-icon></span>
            <span class="nav-label">Loyalty Program</span>
          </a>
        </div>

        <!-- Analytics & Reports -->
        <div class="nav-section" *hasRole="['ADMIN', 'OWNER', 'MANAGER']">
          <span class="section-title">Analytics & Reports</span>
          <a
            routerLink="/reports"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="bar-chart" [size]="18"></app-icon></span>
            <span class="nav-label">Hotel Reports</span>
          </a>
        </div>

        <!-- Administration -->
        <div class="nav-section" *hasRole="['ADMIN', 'OWNER']">
          <span class="section-title">Administration</span>
          <a
            routerLink="/users"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon"><app-icon name="shield" [size]="18"></app-icon></span>
            <span class="nav-label">User Accounts</span>
          </a>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    .app-sidebar {
      width: var(--sidebar-width);
      background: #ffffff;
      border-right: 1px solid var(--slate-200);
      height: calc(100vh - var(--header-height));
      position: sticky;
      top: var(--header-height);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: transform var(--transition-normal);
      z-index: 90;
    }

    .sidebar-nav {
      padding: 1.25rem 0.875rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--slate-400);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.5rem 0.75rem 0.375rem;
      font-family: var(--font-heading);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5625rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--slate-600);
      text-decoration: none;
      transition: all var(--transition-fast);
      position: relative;
    }

    .nav-item:hover {
      background: var(--slate-50);
      color: var(--slate-900);
    }

    .nav-item.active {
      background: var(--primary-50);
      color: var(--primary-700);
      font-weight: 600;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      background: var(--primary-600);
      border-radius: 0 2px 2px 0;
    }

    .nav-icon {
      width: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--slate-400);
      transition: color var(--transition-fast);
    }

    .nav-item:hover .nav-icon {
      color: var(--slate-700);
    }

    .nav-item.active .nav-icon {
      color: var(--primary-600);
    }

    .nav-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar-backdrop {
      display: none;
    }

    @media (max-width: 840px) {
      .app-sidebar {
        position: fixed;
        left: 0;
        top: var(--header-height);
        bottom: 0;
        transform: translateX(-100%);
        box-shadow: var(--shadow-lg);
      }

      .app-sidebar.open {
        transform: translateX(0);
      }

      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        top: var(--header-height);
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(2px);
        z-index: 85;
      }
    }
  `]
})
export class SidebarComponent {
  public authService = inject(AuthService);
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  onNavClick(): void {
    if (this.isOpen) {
      this.closeSidebar.emit();
    }
  }
}
