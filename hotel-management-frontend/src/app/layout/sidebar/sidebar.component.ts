import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, HasRoleDirective],
  template: `
    <aside class="app-sidebar">
      <nav class="sidebar-nav">
        <!-- Main Navigation -->
        <div class="nav-section">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span class="nav-label">Dashboard</span>
          </a>
        </div>

        <!-- Front Desk Section -->
        <div class="nav-section">
          <span class="section-title">Front Desk</span>
          <a *hasRole="['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']"
             routerLink="/guests" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            <span class="nav-label">Guests</span>
          </a>
          <a routerLink="/reservations" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📅</span>
            <span class="nav-label">Reservations</span>
          </a>
          <a routerLink="/waitlist" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⏳</span>
            <span class="nav-label">Waitlist</span>
          </a>
        </div>

        <!-- Rooms & Rates -->
        <div class="nav-section">
          <span class="section-title">Rooms & Pricing</span>
          <a routerLink="/rooms" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon">🛏️</span>
            <span class="nav-label">Rooms Grid</span>
          </a>
          <a *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
             routerLink="/rooms/categories" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏷️</span>
            <span class="nav-label">Categories & Amenities</span>
          </a>
          <a *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
             routerLink="/rates" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💲</span>
            <span class="nav-label">Rates & Calculator</span>
          </a>
        </div>

        <!-- Financials -->
        <div class="nav-section">
          <span class="section-title">Financials</span>
          <a routerLink="/billing" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🧾</span>
            <span class="nav-label">Billing & Folios</span>
          </a>
          <a routerLink="/payments" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span>
            <span class="nav-label">Payments & Receipts</span>
          </a>
        </div>

        <!-- Operations -->
        <div class="nav-section">
          <span class="section-title">Hotel Operations</span>
          <a *hasRole="['HOUSEKEEPER', 'MANAGER', 'ADMIN', 'OWNER']"
             routerLink="/operations/housekeeping" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🧹</span>
            <span class="nav-label">Housekeeping Tasks</span>
          </a>
          <a *hasRole="['MANAGER', 'ADMIN', 'OWNER']"
             routerLink="/operations/room-assignments" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span>
            <span class="nav-label">Room Assignments</span>
          </a>
          <a routerLink="/operations/maintenance" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔧</span>
            <span class="nav-label">Maintenance</span>
          </a>
          <a *hasRole="['HOUSEKEEPER', 'MANAGER', 'ADMIN', 'OWNER']"
             routerLink="/operations/breakage" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚠️</span>
            <span class="nav-label">Breakage & Damage</span>
          </a>
          <a *hasRole="['RECEPTIONIST', 'MANAGER', 'ADMIN', 'OWNER']"
             routerLink="/operations/cash-drawer" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💵</span>
            <span class="nav-label">Cash Drawer</span>
          </a>
          <a *hasRole="['RECEPTIONIST', 'MANAGER', 'ADMIN', 'OWNER']"
             routerLink="/operations/shift-handover" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔄</span>
            <span class="nav-label">Shift Handover</span>
          </a>
          <a *hasRole="['MANAGER', 'ADMIN', 'OWNER']"
             routerLink="/operations/expenses" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📉</span>
            <span class="nav-label">Expenses & Utilities</span>
          </a>
        </div>

        <!-- Staff & HR -->
        <div class="nav-section" *hasRole="['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER']">
          <span class="section-title">Staff & Rostering</span>
          <a *hasRole="['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']"
             routerLink="/staff" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon">👔</span>
            <span class="nav-label">Employee Directory</span>
          </a>
          <a routerLink="/staff/attendance" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⏱️</span>
            <span class="nav-label">Attendance Clock</span>
          </a>
          <a *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
             routerLink="/staff/shifts" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📅</span>
            <span class="nav-label">Shift Schedules</span>
          </a>
          <a routerLink="/staff/leave" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏖️</span>
            <span class="nav-label">Leave Management</span>
          </a>
        </div>

        <!-- Warehouse & Procurement -->
        <div class="nav-section">
          <span class="section-title">Stock & Procurement</span>
          <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span>
            <span class="nav-label">Warehouse Inventory</span>
          </a>
          <a *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
             routerLink="/purchase/suppliers" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏭</span>
            <span class="nav-label">Suppliers & Vendors</span>
          </a>
          <a routerLink="/purchase/requests" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📝</span>
            <span class="nav-label">Purchase Requisitions</span>
          </a>
          <a *hasRole="['MANAGER', 'ADMIN', 'OWNER']"
             routerLink="/purchase/orders" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🚚</span>
            <span class="nav-label">Orders & GRN Delivery</span>
          </a>
        </div>

        <!-- Guest Experience -->
        <div class="nav-section">
          <span class="section-title">Guest Experience</span>
          <a routerLink="/guest-experience/requests" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🛎️</span>
            <span class="nav-label">Service & QR Requests</span>
          </a>
          <a routerLink="/guest-experience/complaints" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📢</span>
            <span class="nav-label">Complaints</span>
          </a>
          <a routerLink="/guest-experience/feedback" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⭐</span>
            <span class="nav-label">Stay Feedback</span>
          </a>
          <a routerLink="/guest-experience/loyalty" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💎</span>
            <span class="nav-label">Loyalty Program</span>
          </a>
        </div>

        <!-- Analytics & Reports -->
        <div class="nav-section" *hasRole="['ADMIN', 'OWNER', 'MANAGER']">
          <span class="section-title">Analytics & Reports</span>
          <a routerLink="/reports" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📈</span>
            <span class="nav-label">Hotel Reports</span>
          </a>
        </div>

        <!-- Administration -->
        <div class="nav-section" *hasRole="['ADMIN', 'OWNER']">
          <span class="section-title">Administration</span>
          <a routerLink="/users" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🛡️</span>
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
      border-right: 1px solid #e2e8f0;
      height: calc(100vh - var(--header-height));
      position: sticky;
      top: var(--header-height);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-nav {
      padding: 1.25rem 0.875rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.5rem 0.75rem 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      text-decoration: none;
      transition: all 0.15s ease-in-out;
    }

    .nav-item:hover {
      background: #f8fafc;
      color: #1e293b;
    }

    .nav-item.active {
      background: #eff6ff;
      color: #2563eb;
    }

    .nav-icon {
      font-size: 1.125rem;
      width: 22px;
      display: flex;
      justify-content: center;
    }

    .nav-label {
      flex: 1;
    }

    @media (max-width: 768px) {
      .app-sidebar {
        width: 100%;
        height: auto;
        position: static;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
      }
    }
  `]
})
export class SidebarComponent {
  public authService = inject(AuthService);
}
