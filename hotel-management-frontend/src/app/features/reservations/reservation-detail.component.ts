import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { RoomService } from '../../core/services/room.service';
import { ReservationResponse } from '../../core/models/reservation.models';
import { RoomCategoryResponse, RoomResponse } from '../../core/models/room.models';
import { RateQuoteResponse } from '../../core/models/rate.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    ConfirmModalComponent,
    IconComponent
  ],
  template: `
    <div class="reservation-detail-page" *ngIf="reservation">
      <app-page-header
        [title]="'Reservation: ' + reservation.reservationCode"
        [subtitle]="'Guest: ' + (reservation.guestName || 'Guest #' + reservation.guestId)"
      >
        <div class="header-actions">
          <a routerLink="/reservations" class="btn btn-outline">
            <app-icon name="arrow-left" [size]="14"></app-icon>
            <span>All Reservations</span>
          </a>
          <a [routerLink]="['/billing']" [queryParams]="{ reservationId: reservation.id }" class="btn btn-primary">
            View Bill & Invoices
          </a>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div class="detail-grid">
        <!-- Overview Card -->
        <div class="card overview-card">
          <div class="overview-header">
            <h3>Booking Status</h3>
            <app-status-badge [status]="reservation.status"></app-status-badge>
          </div>

          <div class="data-group">
            <div class="data-row">
              <span class="label">Guest:</span>
              <span class="value">
                <a [routerLink]="['/guests']">{{ reservation.guestName || 'ID #' + reservation.guestId }}</a>
              </span>
            </div>
            <div class="data-row" *ngIf="reservation.guestEmail">
              <span class="label">Email:</span>
              <span class="value">{{ reservation.guestEmail }}</span>
            </div>
            <div class="data-row" *ngIf="reservation.guestPhone">
              <span class="label">Phone:</span>
              <span class="value">{{ reservation.guestPhone }}</span>
            </div>
            <div class="data-row">
              <span class="label">Category:</span>
              <span class="value font-bold">{{ reservation.roomCategoryName || 'Cat #' + reservation.roomCategoryId }}</span>
            </div>
            <div class="data-row">
              <span class="label">Assigned Room:</span>
              <span class="value">
                <strong *ngIf="reservation.roomNumber">Room {{ reservation.roomNumber }}</strong>
                <span *ngIf="!reservation.roomNumber" class="text-muted">Not yet assigned</span>
              </span>
            </div>
            <div class="data-row">
              <span class="label">Check-in Window:</span>
              <span class="value">{{ reservation.checkInDateTime | date:'medium' }}</span>
            </div>
            <div class="data-row">
              <span class="label">Check-out Window:</span>
              <span class="value">{{ reservation.checkOutDateTime | date:'medium' }}</span>
            </div>
            <div class="data-row" *ngIf="reservation.checkedInAt">
              <span class="label">Actual Check-in:</span>
              <span class="value text-success">{{ reservation.checkedInAt | date:'medium' }}</span>
            </div>
            <div class="data-row" *ngIf="reservation.checkedOutAt">
              <span class="label">Actual Check-out:</span>
              <span class="value text-info">{{ reservation.checkedOutAt | date:'medium' }}</span>
            </div>
            <div class="data-row">
              <span class="label">Occupants:</span>
              <span class="value">{{ reservation.adults }} Adult(s), {{ reservation.children || 0 }} Child(ren)</span>
            </div>
            <div class="data-row" *ngIf="reservation.specialRequests">
              <span class="label">Special Requests:</span>
              <span class="value italic">{{ reservation.specialRequests }}</span>
            </div>
            <div class="data-row" *ngIf="reservation.cancellationReason">
              <span class="label">Cancellation Reason:</span>
              <span class="value text-danger">{{ reservation.cancellationReason }}</span>
            </div>
          </div>

          <!-- Quick Action Bar -->
          <div class="action-bar">
            <button
              *ngIf="reservation.status === 'PENDING'"
              class="btn btn-primary"
              (click)="confirmBooking()"
            >
              Confirm Booking
            </button>

            <button
              *ngIf="reservation.status === 'CONFIRMED'"
              class="btn btn-success"
              (click)="checkIn()"
            >
              Check-In Guest
            </button>

            <button
              *ngIf="reservation.status === 'CHECKED_IN'"
              class="btn btn-warning"
              (click)="checkOut()"
            >
              Complete Check-Out
            </button>

            <button
              *ngIf="reservation.status === 'CHECKED_IN'"
              class="btn btn-outline"
              (click)="openTransferModal()"
            >
              Transfer Room
            </button>

            <button
              *ngIf="reservation.status === 'CHECKED_IN' || reservation.status === 'CONFIRMED'"
              class="btn btn-outline"
              (click)="openUpgradeModal()"
            >
              Upgrade Category
            </button>

            <button
              *ngIf="reservation.status === 'CONFIRMED'"
              class="btn btn-outline"
              (click)="openEarlyCheckInModal()"
            >
              Early Check-In
            </button>

            <button
              *ngIf="reservation.status === 'CHECKED_IN'"
              class="btn btn-outline"
              (click)="openLateCheckoutModal()"
            >
              Late Check-Out
            </button>

            <button
              *ngIf="reservation.status === 'CONFIRMED'"
              class="btn btn-outline"
              (click)="markNoShow()"
            >
              Mark No-Show
            </button>

            <button
              *ngIf="reservation.status === 'PENDING' || reservation.status === 'CONFIRMED'"
              class="btn btn-danger"
              (click)="showCancelModal = true"
            >
              Cancel Reservation
            </button>
          </div>
        </div>

        <!-- Price Breakdown & Folio Summary -->
        <div class="card financial-card">
          <div class="financial-header">
            <h3>Authoritative Price Breakdown</h3>
            <span class="total-badge">\${{ reservation.totalAmount | number:'1.2-2' }}</span>
          </div>

          <div *ngIf="priceBreakdown" class="breakdown-details">
            <div class="quote-row">
              <span>Nights:</span>
              <strong>{{ priceBreakdown.numberOfNights }}</strong>
            </div>
            <div class="quote-row">
              <span>Base Price / Night:</span>
              <span>\${{ priceBreakdown.basePricePerNight | number:'1.2-2' }}</span>
            </div>
            <div class="quote-row">
              <span>Total Base Cost:</span>
              <span>\${{ priceBreakdown.totalBasePrice | number:'1.2-2' }}</span>
            </div>
            <div class="quote-row">
              <span>Dynamic Adjustments:</span>
              <span>\${{ priceBreakdown.totalDynamicAdjustment | number:'1.2-2' }}</span>
            </div>

            <div class="daily-table" *ngIf="priceBreakdown.dailyBreakdown?.length">
              <h4>Daily Calculation</h4>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Base</th>
                    <th>Wknd</th>
                    <th>Seas</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let day of priceBreakdown.dailyBreakdown">
                    <td>{{ day.date }}</td>
                    <td>\${{ day.basePrice }}</td>
                    <td>{{ day.weekendMultiplier }}x</td>
                    <td>{{ day.seasonalMultiplier }}x</td>
                    <td><strong>\${{ day.finalDailyRate | number:'1.2-2' }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card-footer-action">
            <a [routerLink]="['/payments']" [queryParams]="{ reservationId: reservation.id }" class="btn btn-success btn-block">
              + Process Payment
            </a>
          </div>
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
            <div class="form-group">
              <label>Reason for Cancellation</label>
              <textarea [(ngModel)]="cancelReason" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCancelModal = false">Close</button>
            <button class="btn btn-danger" (click)="executeCancel()">Confirm Cancel</button>
          </div>
        </div>
      </div>

      <!-- Room Transfer Modal -->
      <div *ngIf="showTransferModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Transfer Room</h3>
            <button class="close-btn" (click)="showTransferModal = false">&times;</button>
          </div>
          <form [formGroup]="transferForm" (ngSubmit)="executeTransfer()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select New Room *</label>
                <select formControlName="newRoomId" class="form-control">
                  <option value="" disabled>Select Room</option>
                  <option *ngFor="let rm of availableRooms" [value]="rm.id">
                    Room {{ rm.roomNumber }} (Floor {{ rm.floor }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Reason for Transfer</label>
                <input type="text" formControlName="reason" class="form-control" placeholder="e.g. AC noise, guest preference" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showTransferModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="transferForm.invalid">Execute Transfer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Room Upgrade Modal -->
      <div *ngIf="showUpgradeModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Upgrade Room Category</h3>
            <button class="close-btn" (click)="showUpgradeModal = false">&times;</button>
          </div>
          <form [formGroup]="upgradeForm" (ngSubmit)="executeUpgrade()">
            <div class="modal-body">
              <div class="form-group">
                <label>Target Category *</label>
                <select formControlName="newCategoryId" class="form-control">
                  <option value="" disabled>Select Target Category</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">
                    {{ cat.name }} (\${{ cat.basePrice }}/night)
                  </option>
                </select>
              </div>
              <div class="form-check">
                <input type="checkbox" formControlName="additionalChargeAccepted" id="addCharge" />
                <label for="addCharge">Guest accepts additional difference in charges</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showUpgradeModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="upgradeForm.invalid">Process Upgrade</button>
            </div>
          </form>
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
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
    .overview-card, .financial-card {
      padding: 1.5rem;
    }
    .overview-header, .financial-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    .data-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .data-row .label {
      color: var(--text-muted);
    }
    .data-row .value {
      font-weight: 500;
    }
    .action-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }
    .total-badge {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }
    .quote-row {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0;
      font-size: 0.875rem;
    }
    .daily-table {
      margin-top: 1.25rem;
    }
    .daily-table h4 {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .daily-table table {
      width: 100%;
      font-size: 0.75rem;
      border-collapse: collapse;
    }
    .daily-table th, .daily-table td {
      padding: 0.35rem 0.5rem;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .card-footer-action {
      margin-top: 1.5rem;
    }
    .btn-block {
      width: 100%;
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
export class ReservationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reservationService = inject(ReservationService);
  private roomService = inject(RoomService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  reservation: ReservationResponse | null = null;
  priceBreakdown: RateQuoteResponse | null = null;
  availableRooms: RoomResponse[] = [];
  categories: RoomCategoryResponse[] = [];
  loading = false;

  // Actions
  showCancelModal = false;
  cancelReason = '';

  showTransferModal = false;
  transferForm: FormGroup;

  showUpgradeModal = false;
  upgradeForm: FormGroup;

  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor() {
    this.transferForm = this.fb.group({
      newRoomId: ['', Validators.required],
      reason: ['']
    });

    this.upgradeForm = this.fb.group({
      newCategoryId: ['', Validators.required],
      additionalChargeAccepted: [true]
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadReservation(id);
    }
  }

  loadReservation(id: number): void {
    this.loading = true;
    this.reservationService.getReservationById(id).subscribe({
      next: (res) => {
        this.reservation = res;
        this.loading = false;
        this.loadPriceBreakdown(id);
        this.loadCategories();
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load reservation details: ' + (err.error?.message || err.message));
      }
    });
  }

  loadPriceBreakdown(id: number): void {
    this.reservationService.getPriceBreakdown(id).subscribe({
      next: (breakdown) => {
        this.priceBreakdown = breakdown;
      },
      error: () => {
        // Price breakdown might not be available for all statuses
      }
    });
  }

  loadCategories(): void {
    this.roomService.getAllCategories().subscribe({
      next: (cats) => (this.categories = cats)
    });
  }

  confirmBooking(): void {
    if (!this.reservation) return;
    this.confirmTitle = 'Confirm Booking';
    this.confirmMessage = `Confirm reservation ${this.reservation.reservationCode}?`;
    this.confirmAction = () => {
      this.reservationService.confirmReservation(this.reservation!.id).subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.showConfirmModal = false;
          this.notify.success('Reservation confirmed!');
        },
        error: (err) => {
          this.showConfirmModal = false;
          this.notify.error('Confirmation failed: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showConfirmModal = true;
  }

  checkIn(): void {
    if (!this.reservation) return;
    this.confirmTitle = 'Check-In';
    this.confirmMessage = `Check-in guest for reservation ${this.reservation.reservationCode}?`;
    this.confirmAction = () => {
      this.reservationService.checkIn(this.reservation!.id).subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.showConfirmModal = false;
          this.notify.success('Guest checked in successfully!');
        },
        error: (err) => {
          this.showConfirmModal = false;
          this.notify.error('Check-in failed: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showConfirmModal = true;
  }

  checkOut(): void {
    if (!this.reservation) return;
    this.confirmTitle = 'Check-Out';
    this.confirmMessage = `Check-out guest and dispatch housekeeping cleaning task?`;
    this.confirmAction = () => {
      this.reservationService.checkOut(this.reservation!.id).subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.showConfirmModal = false;
          this.notify.success('Guest checked out. Housekeeping task dispatched.');
        },
        error: (err) => {
          this.showConfirmModal = false;
          this.notify.error('Check-out failed: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showConfirmModal = true;
  }

  markNoShow(): void {
    if (!this.reservation) return;
    this.confirmTitle = 'Mark No-Show';
    this.confirmMessage = `Mark this booking as No-Show?`;
    this.confirmAction = () => {
      this.reservationService.markNoShow(this.reservation!.id).subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.showConfirmModal = false;
          this.notify.warning('Reservation marked as NO_SHOW');
        },
        error: (err) => {
          this.showConfirmModal = false;
          this.notify.error('Operation failed: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showConfirmModal = true;
  }

  executeCancel(): void {
    if (!this.reservation) return;
    this.reservationService.cancelReservation(this.reservation.id, this.cancelReason).subscribe({
      next: (updated) => {
        this.reservation = updated;
        this.showCancelModal = false;
        this.notify.success('Reservation cancelled');
      },
      error: (err) => {
        this.notify.error('Cancellation failed: ' + (err.error?.message || err.message));
      }
    });
  }

  openTransferModal(): void {
    if (!this.reservation) return;
    this.roomService.getAvailableRooms(this.reservation.roomCategoryId).subscribe({
      next: (rooms) => {
        this.availableRooms = rooms;
        this.showTransferModal = true;
      }
    });
  }

  executeTransfer(): void {
    if (this.transferForm.invalid || !this.reservation) return;
    this.reservationService.transferRoom(this.reservation.id, this.transferForm.value).subscribe({
      next: (updated) => {
        this.reservation = updated;
        this.showTransferModal = false;
        this.notify.success('Room transferred successfully!');
      },
      error: (err) => {
        this.notify.error('Transfer failed: ' + (err.error?.message || err.message));
      }
    });
  }

  openUpgradeModal(): void {
    this.showUpgradeModal = true;
  }

  executeUpgrade(): void {
    if (this.upgradeForm.invalid || !this.reservation) return;
    this.reservationService.upgradeRoom(this.reservation.id, this.upgradeForm.value).subscribe({
      next: (updated) => {
        this.reservation = updated;
        this.showUpgradeModal = false;
        this.notify.success('Room category upgraded!');
        this.loadPriceBreakdown(this.reservation.id);
      },
      error: (err) => {
        this.notify.error('Upgrade failed: ' + (err.error?.message || err.message));
      }
    });
  }

  openEarlyCheckInModal(): void {
    // Call early check-in
    const time = new Date().toISOString();
    this.reservationService.earlyCheckIn(this.reservation!.id, { earlyCheckInTime: time }).subscribe({
      next: (res) => {
        this.reservation = res;
        this.notify.success('Early check-in processed');
      },
      error: (err) => this.notify.error('Early check-in error: ' + (err.error?.message || err.message))
    });
  }

  openLateCheckoutModal(): void {
    // Call late check-out
    const time = new Date().toISOString();
    this.reservationService.lateCheckout(this.reservation!.id, { lateCheckoutTime: time }).subscribe({
      next: (res) => {
        this.reservation = res;
        this.notify.success('Late check-out request logged');
      },
      error: (err) => this.notify.error('Late check-out error: ' + (err.error?.message || err.message))
    });
  }

  executeConfirmAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }
}
