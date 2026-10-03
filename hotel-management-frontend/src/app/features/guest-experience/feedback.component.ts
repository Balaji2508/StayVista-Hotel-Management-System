import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { GuestExperienceService } from '../../core/services/guest-experience.service';
import { ReservationService } from '../../core/services/reservation.service';
import { FeedbackResponse } from '../../core/models/guest-experience.models';
import { ReservationResponse } from '../../core/models/reservation.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="feedback-page">
      <app-page-header
        title="Guest Reviews & Experience Ratings"
        subtitle="Collect post-stay guest evaluations across cleanliness, staff hospitality, and overall satisfaction"
      >
        <div class="header-actions">
          <a routerLink="/guest-experience/requests" class="btn btn-outline">Service Requests</a>
          <a routerLink="/guest-experience/loyalty" class="btn btn-outline">Loyalty Program</a>
          <button class="btn btn-primary" (click)="showNewModal = true">+ Submit Review</button>
        </div>
      </app-page-header>

      <!-- Reservation Selection Bar -->
      <div class="card selector-card">
        <div class="selector-row">
          <div class="form-group flex-1">
            <label>Filter Reviews by Reservation</label>
            <select [(ngModel)]="selectedReservationId" (change)="loadFeedback()" class="form-control">
              <option [ngValue]="null">-- Select a Reservation to View Feedback --</option>
              <option *ngFor="let r of reservations" [ngValue]="r.id">
                {{ r.reservationCode }} - {{ r.guestName }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Feedback Cards -->
      <div *ngIf="!loading" class="feedback-grid">
        <div *ngFor="let fb of reviews" class="card review-card">
          <div class="card-header">
            <div class="rating-badge">
              <span class="star-rating">★ {{ fb.overallRating }}</span> / 5.0
            </div>
            <span class="review-date">{{ fb.createdAt | date:'mediumDate' }}</span>
          </div>

          <div class="rating-bars">
            <div class="bar-row" *ngIf="fb.cleanlinessRating">
              <span>Cleanliness:</span>
              <span class="bar-val">★ {{ fb.cleanlinessRating }}</span>
            </div>
            <div class="bar-row" *ngIf="fb.staffRating">
              <span>Staff Hospitality:</span>
              <span class="bar-val">★ {{ fb.staffRating }}</span>
            </div>
            <div class="bar-row" *ngIf="fb.serviceRating">
              <span>Amenities / Service:</span>
              <span class="bar-val">★ {{ fb.serviceRating }}</span>
            </div>
          </div>

          <p class="comments" *ngIf="fb.comments">"{{ fb.comments }}"</p>
        </div>

        <div *ngIf="reviews.length === 0" class="col-span-all text-center py-4 card">
          <p>{{ selectedReservationId ? 'No reviews submitted for this reservation yet.' : 'Select a reservation to view feedback or submit a review.' }}</p>
        </div>
      </div>

      <!-- New Feedback Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Submit Guest Stay Review</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="feedbackForm" (ngSubmit)="submitReview()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Reservation *</label>
                <select formControlName="reservationId" class="form-control">
                  <option value="" disabled>-- Select Completed Reservation --</option>
                  <option *ngFor="let r of reservations" [value]="r.id">
                    {{ r.reservationCode }} - {{ r.guestName }}
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Overall Rating (1 - 5) *</label>
                  <input type="number" formControlName="overallRating" class="form-control" min="1" max="5" />
                </div>
                <div class="form-group col">
                  <label>Cleanliness (1 - 5)</label>
                  <input type="number" formControlName="cleanlinessRating" class="form-control" min="1" max="5" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Staff Rating (1 - 5)</label>
                  <input type="number" formControlName="staffRating" class="form-control" min="1" max="5" />
                </div>
                <div class="form-group col">
                  <label>Service Rating (1 - 5)</label>
                  <input type="number" formControlName="serviceRating" class="form-control" min="1" max="5" />
                </div>
              </div>

              <div class="form-group">
                <label>Comments / Review Text</label>
                <textarea formControlName="comments" class="form-control" rows="3" placeholder="Share your experience during your stay..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="feedbackForm.invalid || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Evaluation' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .selector-card {
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .selector-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 {
      flex: 1;
    }
    .feedback-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .review-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .star-rating {
      color: #f59e0b;
      font-weight: 700;
      font-size: 1.1rem;
    }
    .review-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .rating-bars {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.8rem;
    }
    .bar-row {
      display: flex;
      justify-content: space-between;
    }
    .bar-val {
      color: #d97706;
      font-weight: 600;
    }
    .comments {
      font-style: italic;
      font-size: 0.875rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-color);
      padding-top: 0.5rem;
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
      max-width: 480px;
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
    .form-row {
      display: flex;
      gap: 0.75rem;
    }
    .col {
      flex: 1;
    }
  `]
})
export class FeedbackComponent implements OnInit {
  private guestExpService = inject(GuestExperienceService);
  private reservationService = inject(ReservationService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  selectedReservationId: number | null = null;
  reservations: ReservationResponse[] = [];
  reviews: FeedbackResponse[] = [];
  loading = false;
  submitting = false;

  showNewModal = false;
  feedbackForm: FormGroup;

  constructor() {
    this.feedbackForm = this.fb.group({
      reservationId: ['', Validators.required],
      overallRating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      cleanlinessRating: [5, [Validators.min(1), Validators.max(5)]],
      staffRating: [5, [Validators.min(1), Validators.max(5)]],
      serviceRating: [5, [Validators.min(1), Validators.max(5)]],
      comments: ['']
    });
  }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
      next: (list) => {
        this.reservations = list;
        if (list.length > 0 && !this.selectedReservationId) {
          this.selectedReservationId = list[0].id;
          this.loadFeedback();
        }
      }
    });
  }

  loadFeedback(): void {
    if (!this.selectedReservationId) return;
    this.loading = true;
    this.guestExpService.getFeedbackByReservationId(this.selectedReservationId).subscribe({
      next: (data) => {
        this.reviews = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  submitReview(): void {
    if (this.feedbackForm.invalid) return;
    this.submitting = true;
    const rId = Number(this.feedbackForm.get('reservationId')?.value);
    const r = this.reservations.find(res => res.id === rId);

    const payload = {
      ...this.feedbackForm.value,
      guestId: r?.guestId || 1
    };

    this.guestExpService.submitFeedback(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Review submitted successfully');
        this.showNewModal = false;
        this.selectedReservationId = rId;
        this.loadFeedback();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Review submission failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
