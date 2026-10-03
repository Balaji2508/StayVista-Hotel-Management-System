import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReportingService } from '../../core/services/reporting.service';
import { RoomService } from '../../core/services/room.service';
import { ReservationService } from '../../core/services/reservation.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OperationsService } from '../../core/services/operations.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { DailySummaryResponse } from '../../core/models/reporting.models';
import { ReservationResponse } from '../../core/models/reservation.models';
import { ItemResponse } from '../../core/models/inventory.models';
import { HousekeepingTaskResponse } from '../../core/models/operations.models';
import { RoomResponse } from '../../core/models/room.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatCardComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    HasRoleDirective
  ],
  template: `
    <div class="content-wrapper">
      <!-- Welcome Header -->
      <div class="dashboard-banner">
        <div class="banner-text">
          <h1>Welcome back, {{ authService.currentUserSig()?.username }}!</h1>
          <p>
            Logged in as
            <strong>{{ authService.currentUserSig()?.role }}</strong>.
            Here is your hotel operational overview.
          </p>
        </div>
        <div class="quick-actions">
          <a routerLink="/reservations/new" class="btn btn-primary btn-sm">➕ New Reservation</a>
          <a *hasRole="['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']"
             routerLink="/guests" class="btn btn-secondary btn-sm">👥 Register Guest</a>
          <a *hasRole="['HOUSEKEEPER', 'MANAGER']"
             routerLink="/operations/housekeeping" class="btn btn-secondary btn-sm">🧹 Clean Tasks</a>
          <a *hasRole="['GUEST']"
             routerLink="/guest-experience/requests" class="btn btn-primary btn-sm">🛎️ Request Room Service</a>
        </div>
      </div>

      <app-loading-spinner *ngIf="isLoading" message="Fetching live hotel metrics..."></app-loading-spinner>

      <div *ngIf="!isLoading">
        <!-- KPI Metrics Grid -->
        <div class="grid-4" style="margin-bottom: 1.5rem;">
          <app-stat-card
            title="Occupancy Rate"
            [value]="(summary?.occupancyRate || 0) + '%'"
            subtext="Calculated by reporting service"
            icon="🏨"
            themeClass="theme-blue"
          ></app-stat-card>

          <app-stat-card
            title="Available Rooms"
            [value]="summary?.availableRooms ?? availableRoomsCount"
            subtext="Ready for guest check-in"
            icon="🛏️"
            themeClass="theme-green"
          ></app-stat-card>

          <app-stat-card
            title="Today's Arrivals"
            [value]="summary?.arrivalsToday ?? 0"
            subtext="Expected check-ins"
            icon="🧳"
            themeClass="theme-amber"
          ></app-stat-card>

          <app-stat-card
            title="Today's Revenue"
            [value]="'$' + (summary?.totalDailyRevenue || 0 | number:'1.2-2')"
            subtext="Settled invoices & folios"
            icon="💰"
            themeClass="theme-purple"
          ></app-stat-card>
        </div>

        <!-- Low Stock Alert Banner (If Any) -->
        <div class="alert-banner warning" *ngIf="lowStockItems.length > 0">
          <div class="alert-content">
            <span class="alert-icon">⚠️</span>
            <div>
              <strong>Low Warehouse Stock Warning:</strong>
              <span>
                {{ lowStockItems.length }} item(s) are below reorder threshold (e.g., {{ lowStockItems[0].name }}).
              </span>
            </div>
          </div>
          <a routerLink="/purchase/requests" class="btn btn-sm btn-primary">Create Purchase Request</a>
        </div>

        <div class="grid-2">
          <!-- Recent Reservations -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Recent Reservations</h2>
              <a routerLink="/reservations" class="btn btn-sm btn-secondary">View All</a>
            </div>

            <div class="table-responsive" *ngIf="recentReservations.length > 0; else noReservations">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Guest</th>
                    <th>Stay Dates</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let res of recentReservations">
                    <td>
                      <a [routerLink]="['/reservations', res.id]" style="font-weight: 700; color: #2563eb; text-decoration: none;">
                        {{ res.reservationCode }}
                      </a>
                    </td>
                    <td>{{ res.guestName || ('Guest #' + res.guestId) }}</td>
                    <td>{{ res.checkInDateTime | date:'MMM d' }} - {{ res.checkOutDateTime | date:'MMM d' }}</td>
                    <td><app-status-badge [status]="res.status"></app-status-badge></td>
                    <td><strong>{{ res.totalAmount | currency }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noReservations>
              <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p class="empty-state-text">No active reservations found.</p>
              </div>
            </ng-template>
          </div>

          <!-- Operational Task Board & Quick Status -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                {{ authService.hasRole('HOUSEKEEPER') ? 'My Cleaning Tasks' : 'Hotel Operational Status' }}
              </h2>
              <a *hasRole="['HOUSEKEEPER', 'MANAGER', 'ADMIN', 'OWNER']"
                 routerLink="/operations/housekeeping" class="btn btn-sm btn-secondary">
                View Housekeeping
              </a>
            </div>

            <div *ngIf="housekeepingTasks.length > 0; else noTasks" class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let task of housekeepingTasks">
                    <td>#{{ task.id }}</td>
                    <td><strong>Room {{ task.roomNumber || task.roomId }}</strong></td>
                    <td>{{ task.taskType }}</td>
                    <td><app-status-badge [status]="task.status"></app-status-badge></td>
                    <td>
                      <span class="badge" [ngClass]="task.priority === 'HIGH' ? 'badge-danger' : 'badge-neutral'">
                        {{ task.priority }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noTasks>
              <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <p class="empty-state-text">All housekeeping tasks are clear or verified!</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-banner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.5rem 1.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .banner-text h1 {
      font-size: 1.5rem;
      margin: 0 0 0.25rem;
      color: #0f172a;
    }

    .banner-text p {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .quick-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .alert-banner {
      padding: 1rem 1.25rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .alert-banner.warning {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #92400e;
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .alert-icon {
      font-size: 1.25rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private reportingService = inject(ReportingService);
  private roomService = inject(RoomService);
  private reservationService = inject(ReservationService);
  private inventoryService = inject(InventoryService);
  private operationsService = inject(OperationsService);

  isLoading = true;
  summary: DailySummaryResponse | null = null;
  recentReservations: ReservationResponse[] = [];
  lowStockItems: ItemResponse[] = [];
  housekeepingTasks: HousekeepingTaskResponse[] = [];
  availableRoomsCount = 0;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Load available rooms
    this.roomService.getAvailableRooms().subscribe({
      next: (rooms) => {
        this.availableRoomsCount = rooms.length;
      },
      error: () => {}
    });

    // Load reporting summary
    this.reportingService.getDailySummary().subscribe({
      next: (data) => {
        this.summary = data;
      },
      error: () => {}
    });

    // Load recent reservations
    this.reservationService.getAllReservations().subscribe({
      next: (list) => {
        this.recentReservations = list.slice(0, 5);
      },
      error: () => {}
    });

    // Load low stock items
    this.inventoryService.getLowStockItems().subscribe({
      next: (items) => {
        this.lowStockItems = items;
      },
      error: () => {}
    });

    // Load housekeeping tasks
    this.operationsService.getAllTasks().subscribe({
      next: (tasks) => {
        this.housekeepingTasks = tasks.slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
