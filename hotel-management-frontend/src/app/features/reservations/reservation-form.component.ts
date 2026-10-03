import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../core/services/reservation.service';
import { RoomService } from '../../core/services/room.service';
import { GuestService } from '../../core/services/guest.service';
import { GuestResponse } from '../../core/models/guest.models';
import { RoomCategoryResponse, RoomResponse } from '../../core/models/room.models';
import { RateQuoteResponse } from '../../core/models/rate.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    IconComponent
  ],
  template: `
    <div class="reservation-form-page">
      <app-page-header
        title="Create New Reservation"
        subtitle="Book a room for an existing or newly registered guest with live dynamic pricing quotation"
      >
        <a routerLink="/reservations" class="btn btn-outline">
          <app-icon name="arrow-left" [size]="14"></app-icon>
          <span>Back to Reservations</span>
        </a>
      </app-page-header>

      <app-loading-spinner [loading]="loadingData"></app-loading-spinner>

      <div *ngIf="!loadingData" class="form-layout">
        <!-- Main Booking Form -->
        <div class="card form-card">
          <form [formGroup]="bookingForm" (ngSubmit)="submitBooking()">
            <h3 class="card-title">Reservation Details</h3>

            <div class="form-group">
              <label>Select Guest *</label>
              <select formControlName="guestId" class="form-control">
                <option value="" disabled>-- Select Guest --</option>
                <option *ngFor="let g of guests" [value]="g.id">
                  {{ g.firstName }} {{ g.lastName }} ({{ g.email }} / {{ g.phone }})
                </option>
              </select>
              <span *ngIf="bookingForm.get('guestId')?.touched && bookingForm.get('guestId')?.invalid" class="error-text">
                Guest selection is required.
              </span>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Room Category *</label>
                <select formControlName="roomCategoryId" class="form-control" (change)="onCategoryChange()">
                  <option value="" disabled>-- Select Category --</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">
                    {{ cat.name }} (Max {{ cat.maxOccupancy }} persons - \${{ cat.basePrice }}/night)
                  </option>
                </select>
              </div>

              <div class="form-group col">
                <label>Assign Specific Room (Optional)</label>
                <select formControlName="roomId" class="form-control">
                  <option [ngValue]="null">Auto-assign upon check-in</option>
                  <option *ngFor="let rm of availableRooms" [value]="rm.id">
                    Room {{ rm.roomNumber }} (Floor {{ rm.floor }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Check-In Date & Time *</label>
                <input type="datetime-local" formControlName="checkInDateTime" class="form-control" />
              </div>

              <div class="form-group col">
                <label>Check-Out Date & Time *</label>
                <input type="datetime-local" formControlName="checkOutDateTime" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Adults *</label>
                <input type="number" formControlName="adults" class="form-control" min="1" />
              </div>

              <div class="form-group col">
                <label>Children</label>
                <input type="number" formControlName="children" class="form-control" min="0" />
              </div>
            </div>

            <div class="form-group">
              <label>Special Requests / Preferences</label>
              <textarea
                formControlName="specialRequests"
                class="form-control"
                rows="2"
                placeholder="High floor, quiet room, late check-in notice, etc."
              ></textarea>
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-outline"
                (click)="getQuotePreview()"
                [disabled]="bookingForm.invalid || quoting"
              >
                {{ quoting ? 'Calculating...' : 'Preview Backend Rate Quote' }}
              </button>

              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="bookingForm.invalid || submitting"
              >
                {{ submitting ? 'Confirming...' : 'Create Reservation' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Live Quote Preview Sidebar -->
        <div class="quote-sidebar">
          <div class="card quote-card" *ngIf="quotePreview">
            <h4 class="quote-title">Backend Rate Quotation</h4>
            <div class="quote-body">
              <div class="quote-row">
                <span>Nights:</span>
                <strong>{{ quotePreview.numberOfNights }}</strong>
              </div>
              <div class="quote-row">
                <span>Base Rate / Night:</span>
                <span>\${{ quotePreview.basePricePerNight | number:'1.2-2' }}</span>
              </div>
              <div class="quote-row">
                <span>Total Base Price:</span>
                <span>\${{ quotePreview.totalBasePrice | number:'1.2-2' }}</span>
              </div>
              <div class="quote-row">
                <span>Dynamic Adjustment:</span>
                <span [class.text-success]="quotePreview.totalDynamicAdjustment >= 0">
                  {{ quotePreview.totalDynamicAdjustment >= 0 ? '+' : '' }}\${{ quotePreview.totalDynamicAdjustment | number:'1.2-2' }}
                </span>
              </div>
              <div class="quote-row total-row">
                <span>Total Quoted Amount:</span>
                <span class="total-amount">\${{ quotePreview.totalQuotedAmount | number:'1.2-2' }}</span>
              </div>
            </div>

            <div *ngIf="quotePreview.dailyBreakdown?.length" class="breakdown-table">
              <h6>Daily Breakdown:</h6>
              <table>
                <tr *ngFor="let day of quotePreview.dailyBreakdown">
                  <td>{{ day.date }}</td>
                  <td class="text-right"><strong>\${{ day.finalDailyRate | number:'1.2-2' }}</strong></td>
                </tr>
              </table>
            </div>
          </div>

          <div class="card info-card" *ngIf="!quotePreview">
            <h4>Live Pricing Engine</h4>
            <p>Fill in the reservation dates and category, then click <strong>"Preview Backend Rate Quote"</strong> to retrieve the authoritative price calculated by the Rate Service.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .form-layout {
        grid-template-columns: 1fr;
      }
    }
    .form-card {
      padding: 1.75rem;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      color: var(--text-primary);
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .col {
      flex: 1;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }
    .quote-card {
      padding: 1.5rem;
    }
    .quote-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }
    .quote-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    .quote-row {
      display: flex;
      justify-content: space-between;
    }
    .total-row {
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
      font-size: 1rem;
    }
    .total-amount {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary);
    }
    .breakdown-table {
      margin-top: 1.25rem;
    }
    .breakdown-table h6 {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .breakdown-table table {
      width: 100%;
      font-size: 0.8rem;
    }
    .info-card {
      padding: 1.5rem;
      background: var(--bg-hover);
    }
    .info-card h4 {
      font-size: 1.05rem;
      margin-bottom: 0.5rem;
    }
    .info-card p {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .error-text {
      color: var(--danger);
      font-size: 0.75rem;
    }
  `]
})
export class ReservationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);
  private guestService = inject(GuestService);
  private roomService = inject(RoomService);
  private notify = inject(NotificationUiService);
  private router = inject(Router);

  bookingForm: FormGroup;
  guests: GuestResponse[] = [];
  categories: RoomCategoryResponse[] = [];
  availableRooms: RoomResponse[] = [];

  loadingData = false;
  submitting = false;
  quoting = false;
  quotePreview: RateQuoteResponse | null = null;

  constructor() {
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(11, 0, 0, 0);

    const formatDt = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    this.bookingForm = this.fb.group({
      guestId: ['', Validators.required],
      roomCategoryId: ['', Validators.required],
      roomId: [null],
      checkInDateTime: [formatDt(today), Validators.required],
      checkOutDateTime: [formatDt(tomorrow), Validators.required],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.min(0)]],
      specialRequests: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loadingData = true;
    this.guestService.getAllGuests().subscribe({
      next: (guests) => {
        this.guests = guests;
        this.roomService.getAllCategories().subscribe({
          next: (cats) => {
            this.categories = cats;
            if (cats.length > 0) {
              this.bookingForm.patchValue({ roomCategoryId: cats[0].id });
              this.onCategoryChange();
            }
            this.loadingData = false;
          },
          error: (err) => {
            this.loadingData = false;
            this.notify.error('Failed to load room categories: ' + (err.error?.message || err.message));
          }
        });
      },
      error: (err) => {
        this.loadingData = false;
        this.notify.error('Failed to load guests: ' + (err.error?.message || err.message));
      }
    });
  }

  onCategoryChange(): void {
    const catId = this.bookingForm.get('roomCategoryId')?.value;
    if (!catId) return;
    this.roomService.getAvailableRooms(catId).subscribe({
      next: (rooms) => {
        this.availableRooms = rooms;
      },
      error: () => {
        this.availableRooms = [];
      }
    });
  }

  getQuotePreview(): void {
    if (this.bookingForm.invalid) return;
    this.quoting = true;
    const req = this.bookingForm.value;

    this.reservationService.previewQuote(req).subscribe({
      next: (quote) => {
        this.quotePreview = quote;
        this.quoting = false;
        this.notify.success('Backend quote calculated');
      },
      error: (err) => {
        this.quoting = false;
        this.notify.error('Failed to calculate quote: ' + (err.error?.message || err.message));
      }
    });
  }

  submitBooking(): void {
    if (this.bookingForm.invalid) return;
    this.submitting = true;
    const req = this.bookingForm.value;

    this.reservationService.createReservation(req).subscribe({
      next: (res) => {
        this.submitting = false;
        this.notify.success(`Reservation ${res.reservationCode} created successfully!`);
        this.router.navigate(['/reservations', res.id]);
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to create reservation: ' + (err.error?.message || err.message));
      }
    });
  }
}
