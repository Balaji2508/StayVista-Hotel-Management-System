import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { GuestExperienceService } from '../../core/services/guest-experience.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ServiceRequestResponse, RequestType } from '../../core/models/guest-experience.models';
import { ReservationResponse } from '../../core/models/reservation.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="service-requests-page">
      <app-page-header
        title="In-Room Service Requests"
        subtitle="Manage guest concierge requests, towel replenishment, housekeeping calls, and maintenance orders"
      >
        <div class="header-actions">
          <a routerLink="/guest-experience/complaints" class="btn btn-outline">Complaints</a>
          <a routerLink="/guest-experience/feedback" class="btn btn-outline">Feedback</a>
          <a routerLink="/guest-experience/loyalty" class="btn btn-outline">Loyalty Club</a>
          <button class="btn btn-primary" (click)="showNewModal = true">+ Place Request</button>
        </div>
      </app-page-header>

      <!-- Reservation Selection Bar -->
      <div class="card selector-card">
        <div class="selector-row">
          <div class="form-group flex-1">
            <label>Filter by Active Reservation</label>
            <select [(ngModel)]="selectedReservationId" (change)="loadRequests()" class="form-control">
              <option [ngValue]="null">-- Select a Reservation to View Requests --</option>
              <option *ngFor="let r of reservations" [ngValue]="r.id">
                {{ r.reservationCode }} - {{ r.guestName }} (Room: {{ r.roomNumber || 'N/A' }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Requests Grid -->
      <div *ngIf="!loading" class="requests-grid">
        <div *ngFor="let req of requests" class="card request-card">
          <div class="card-header">
            <div>
              <span class="type-tag">{{ req.requestType }}</span>
              <h4>Room {{ req.roomNumber || 'General' }}</h4>
            </div>
            <app-status-badge [status]="req.status"></app-status-badge>
          </div>

          <p class="description">{{ req.description }}</p>

          <div class="card-footer">
            <span class="time">{{ req.createdAt | date:'short' }}</span>
            <button
              *ngIf="req.status === 'PENDING' || req.status === 'ASSIGNED'"
              class="btn btn-sm btn-outline-danger"
              (click)="cancelRequest(req)"
            >
              Cancel Request
            </button>
          </div>
        </div>

        <div *ngIf="requests.length === 0" class="col-span-all text-center py-4 card">
          <p>{{ selectedReservationId ? 'No service requests found for this reservation.' : 'Select a reservation above or place a new request.' }}</p>
        </div>
      </div>

      <!-- New Request Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Place In-Room Service Request</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="requestForm" (ngSubmit)="submitRequest()">
            <div class="modal-body">
              <div class="form-group">
                <label>Active Reservation *</label>
                <select formControlName="reservationId" class="form-control" (change)="onModalReservationChange()">
                  <option value="" disabled>-- Select Guest Reservation --</option>
                  <option *ngFor="let r of reservations" [value]="r.id">
                    {{ r.reservationCode }} - {{ r.guestName }} (Room: {{ r.roomNumber || 'Unassigned' }})
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Request Type *</label>
                  <select formControlName="requestType" class="form-control">
                    <option *ngFor="let t of requestTypes" [value]="t">{{ t }}</option>
                  </select>
                </div>
                <div class="form-group col">
                  <label>Room Number</label>
                  <input type="text" formControlName="roomNumber" class="form-control" placeholder="e.g. 204" />
                </div>
              </div>

              <div class="form-group">
                <label>Instructions / Description *</label>
                <textarea formControlName="description" class="form-control" rows="3" placeholder="Please bring extra bath towels, extra pillow, ice bucket..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="requestForm.invalid || submitting">
                {{ submitting ? 'Submitting...' : 'Send Request' }}
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
    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .request-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .type-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
    }
    .card-header h4 {
      font-size: 1.1rem;
      margin-top: 0.2rem;
    }
    .description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      flex: 1;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .btn-outline-danger {
      border: 1px solid var(--danger);
      color: var(--danger);
      background: transparent;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-outline-danger:hover {
      background: var(--danger);
      color: white;
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
export class ServiceRequestsComponent implements OnInit {
  private guestExpService = inject(GuestExperienceService);
  private reservationService = inject(ReservationService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  selectedReservationId: number | null = null;
  reservations: ReservationResponse[] = [];
  requests: ServiceRequestResponse[] = [];
  loading = false;
  submitting = false;

  requestTypes: RequestType[] = ['CLEANING', 'TOWELS', 'FOOD_SERVICE', 'AMENITIES', 'MAINTENANCE', 'OTHER'];

  showNewModal = false;
  requestForm: FormGroup;

  constructor() {
    this.requestForm = this.fb.group({
      reservationId: ['', Validators.required],
      requestType: ['TOWELS', Validators.required],
      roomNumber: [''],
      description: ['', Validators.required]
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
          this.loadRequests();
        }
      }
    });
  }

  loadRequests(): void {
    if (!this.selectedReservationId) return;
    this.loading = true;
    this.guestExpService.getServiceRequestsByReservationId(this.selectedReservationId).subscribe({
      next: (reqs) => {
        this.requests = reqs;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  onModalReservationChange(): void {
    const rId = Number(this.requestForm.get('reservationId')?.value);
    const r = this.reservations.find(res => res.id === rId);
    if (r?.roomNumber) {
      this.requestForm.patchValue({ roomNumber: r.roomNumber });
    }
  }

  submitRequest(): void {
    if (this.requestForm.invalid) return;
    this.submitting = true;
    const rId = Number(this.requestForm.get('reservationId')?.value);
    const r = this.reservations.find(res => res.id === rId);

    const payload = {
      ...this.requestForm.value,
      guestId: r?.guestId || 1
    };

    this.guestExpService.createServiceRequest(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Service request placed successfully');
        this.showNewModal = false;
        this.selectedReservationId = rId;
        this.loadRequests();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to submit request: ' + (err.error?.message || err.message));
      }
    });
  }

  cancelRequest(req: ServiceRequestResponse): void {
    this.guestExpService.cancelServiceRequest(req.id).subscribe({
      next: () => {
        this.notify.success('Request cancelled');
        this.loadRequests();
      },
      error: (err) => this.notify.error('Cancel failed: ' + (err.error?.message || err.message))
    });
  }
}
