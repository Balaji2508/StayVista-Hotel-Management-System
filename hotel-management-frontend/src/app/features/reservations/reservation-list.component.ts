import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationResponse, ReservationStatus } from '../../core/models/reservation.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="reservations-page">
      <app-page-header
        title="Reservations Management"
        subtitle="Manage hotel bookings, check-in guests, handle check-outs, and monitor occupancy flow"
      >
        <div class="header-actions">
          <a routerLink="/waitlist" class="btn btn-outline">Waitlist Queue</a>
          <a routerLink="/reservations/new" class="btn btn-primary">+ New Reservation</a>
        </div>
      </app-page-header>

      <!-- Filter Bar -->
      <div class="card filter-bar">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by code, guest name, or room..."
            class="form-control"
          />
        </div>
        <div class="status-filters">
          <button
            *ngFor="let s of statuses"
            class="filter-pill"
            [class.active]="selectedStatus === s"
            (click)="selectedStatus = s"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Reservations Table -->
      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Guest</th>
                <th>Category / Room</th>
                <th>Dates (Check-in → Out)</th>
                <th>Guests</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let res of filteredReservations">
                <td>
                  <a [routerLink]="['/reservations', res.id]" class="code-link">
                    <strong>{{ res.reservationCode }}</strong>
                  </a>
                </td>
                <td>
                  <div><strong>{{ res.guestName || 'Guest #' + res.guestId }}</strong></div>
                  <div class="sub-text">{{ res.guestEmail || res.guestPhone || '' }}</div>
                </td>
                <td>
                  <div>{{ res.roomCategoryName || 'Category #' + res.roomCategoryId }}</div>
                  <div class="sub-text" *ngIf="res.roomNumber">Room: <strong>{{ res.roomNumber }}</strong></div>
                  <div class="sub-text text-muted" *ngIf="!res.roomNumber">Unassigned</div>
                </td>
                <td>
                  <div>{{ res.checkInDateTime | date:'mediumDate' }}</div>
                  <div class="sub-text">→ {{ res.checkOutDateTime | date:'mediumDate' }}</div>
                </td>
                <td>{{ res.adults }} Adult<span *ngIf="res.adults > 1">s</span><span *ngIf="res.children">, {{ res.children }} Ch</span></td>
                <td>
                  <strong>\${{ res.totalAmount | number:'1.2-2' }}</strong>
                  <div class="sub-text" *ngIf="res.advancePaid">Paid: \${{ res.advancePaid }}</div>
                </td>
                <td>
                  <app-status-badge [status]="res.status"></app-status-badge>
                </td>
                <td>
                  <div class="action-dropdown">
                    <a [routerLink]="['/reservations', res.id]" class="btn btn-sm btn-outline">Details</a>
                    
                    <button
                      *ngIf="res.status === 'PENDING'"
                      class="btn btn-sm btn-primary"
                      (click)="confirmBooking(res)"
                      title="Confirm Booking"
                    >
                      Confirm
                    </button>

                    <button
                      *ngIf="res.status === 'CONFIRMED'"
                      class="btn btn-sm btn-success"
                      (click)="handleCheckIn(res)"
                      title="Check In Guest"
                    >
                      Check-In
                    </button>

                    <button
                      *ngIf="res.status === 'CHECKED_IN'"
                      class="btn btn-sm btn-warning"
                      (click)="handleCheckOut(res)"
                      title="Check Out Guest"
                    >
                      Check-Out
                    </button>

                    <button
                      *ngIf="res.status === 'PENDING' || res.status === 'CONFIRMED'"
                      class="btn btn-sm btn-danger"
                      (click)="promptCancel(res)"
                      title="Cancel Booking"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredReservations.length === 0">
                <td colspan="8" class="text-center py-4">No reservations matching filter criteria.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cancel Modal -->
      <div *ngIf="showCancelModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Cancel Reservation</h3>
            <button class="close-btn" (click)="showCancelModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to cancel reservation <strong>{{ cancelingRes?.reservationCode }}</strong>?</p>
            <div class="form-group">
              <label>Reason for Cancellation</label>
              <textarea
                [(ngModel)]="cancelReason"
                class="form-control"
                rows="3"
                placeholder="Optional explanation..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCancelModal = false">Close</button>
            <button class="btn btn-danger" (click)="executeCancel()">Confirm Cancellation</button>
          </div>
        </div>
      </div>

      <!-- General Confirm Modal -->
      <app-confirm-modal
        [isOpen]="showConfirmModal"
        [title]="confirmTitle"
        [message]="confirmMessage"
        (confirm)="executeConfirmAction()"
        (cancel)="showConfirmModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .filter-bar {
      margin-bottom: 1.25rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .search-box {
      max-width: 400px;
    }
    .status-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .filter-pill {
      border: 1px solid var(--border-color);
      background: var(--surface);
      color: var(--text-secondary);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-pill:hover, .filter-pill.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .code-link {
      color: var(--primary);
      text-decoration: underline;
    }
    .action-dropdown {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-dialog {
      background: var(--surface);
      border-radius: var(--radius);
      width: 100%;
      max-width: 460px;
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .modal-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class ReservationListComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private notify = inject(NotificationUiService);

  reservations: ReservationResponse[] = [];
  loading = false;
  searchQuery = '';
  selectedStatus = 'ALL';

  statuses = ['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'];

  // Modals
  showCancelModal = false;
  cancelingRes: ReservationResponse | null = null;
  cancelReason = '';

  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.reservationService.getAllReservations().subscribe({
      next: (res) => {
        this.reservations = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load reservations: ' + (err.error?.message || err.message));
      }
    });
  }

  get filteredReservations(): ReservationResponse[] {
    return this.reservations.filter((r) => {
      const matchesStatus = this.selectedStatus === 'ALL' || r.status === this.selectedStatus;
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.reservationCode.toLowerCase().includes(q) ||
        (r.guestName && r.guestName.toLowerCase().includes(q)) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }

  confirmBooking(res: ReservationResponse): void {
    this.confirmTitle = 'Confirm Reservation';
    this.confirmMessage = `Are you sure you want to confirm reservation ${res.reservationCode}?`;
    this.confirmAction = () => {
      this.reservationService.confirmReservation(res.id).subscribe({
        next: () => {
          this.notify.success(`Reservation ${res.reservationCode} confirmed`);
          this.showConfirmModal = false;
          this.loadReservations();
        },
        error: (err) => {
          this.showConfirmModal = false;
          this.notify.error('Failed to confirm: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showConfirmModal = true;
  }

  handleCheckIn(res: ReservationResponse): void {
    this.confirmTitle = 'Check-In Guest';
    this.confirmMessage = `Check-in guest for reservation ${res.reservationCode}? Room: ${res.roomNumber || 'Will be auto/pre-assigned'}`;
    this.confirmAction = () => {
      this.reservationService.checkIn(res.id).subscribe({
        next: () => {
          this.notify.success(`Guest checked-in successfully!`);
          this.showConfirmModal = false;
          this.loadReservations();
        },
        error: (err) => {
          this.showConfirmModal = false;
          this.notify.error('Failed to check-in: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showConfirmModal = true;
  }

  handleCheckOut(res: ReservationResponse): void {
    this.confirmTitle = 'Check-Out Guest';
    this.confirmMessage = `Complete checkout for reservation ${res.reservationCode}? This will mark room as DIRTY for Housekeeping.`;
    this.confirmAction = () => {
      this.reservationService.checkOut(res.id).subscribe({
        next: () => {
          this.notify.success(`Checkout completed! Housekeeping task dispatched.`);
          this.showConfirmModal = false;
          this.loadReservations();
        },
        error: (err) => {
          this.showConfirmModal = false;
          this.notify.error('Failed to check-out: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showConfirmModal = true;
  }

  promptCancel(res: ReservationResponse): void {
    this.cancelingRes = res;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  executeCancel(): void {
    if (!this.cancelingRes) return;
    this.reservationService.cancelReservation(this.cancelingRes.id, this.cancelReason).subscribe({
      next: () => {
        this.notify.success(`Reservation ${this.cancelingRes?.reservationCode} cancelled.`);
        this.showCancelModal = false;
        this.cancelingRes = null;
        this.loadReservations();
      },
      error: (err) => {
        this.notify.error('Failed to cancel: ' + (err.error?.message || err.message));
      }
    });
  }

  executeConfirmAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }
}
