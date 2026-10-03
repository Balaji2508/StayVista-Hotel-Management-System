import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { RoomService } from '../../core/services/room.service';
import { GuestService } from '../../core/services/guest.service';
import { WaitlistResponse } from '../../core/models/reservation.models';
import { GuestResponse } from '../../core/models/guest.models';
import { RoomCategoryResponse } from '../../core/models/room.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-waitlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent,
    IconComponent
  ],
  template: `
    <div class="waitlist-page">
      <app-page-header
        title="Reservation Waitlist Queue"
        subtitle="Manage overflow booking demand and priority queue for sold-out room categories"
      >
        <div class="header-actions">
          <a routerLink="/reservations" class="btn btn-outline">
            <app-icon name="arrow-left" [size]="14"></app-icon>
            <span>Back to Reservations</span>
          </a>
          <button class="btn btn-primary" (click)="showJoinModal = true">
            <app-icon name="plus" [size]="15"></app-icon>
            <span>Add Guest to Waitlist</span>
          </button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Queue #</th>
                <th>Guest</th>
                <th>Category Requested</th>
                <th>Desired Dates</th>
                <th>Party Size</th>
                <th>Status</th>
                <th>Joined At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of waitlists">
                <td>
                  <span class="queue-badge">{{ item.queuePosition || item.id }}</span>
                </td>
                <td>
                  <strong>{{ item.guestName || 'Guest #' + item.guestId }}</strong>
                </td>
                <td>{{ item.categoryName || 'Cat #' + item.categoryId }}</td>
                <td>
                  {{ item.checkInDate }} → {{ item.checkOutDate }}
                </td>
                <td>{{ item.adults }} Adults<span *ngIf="item.children">, {{ item.children }} Ch</span></td>
                <td>
                  <span class="badge badge-info">{{ item.status }}</span>
                </td>
                <td>{{ item.createdAt | date:'short' }}</td>
                <td>
                  <button class="btn btn-sm btn-danger" (click)="confirmCancel(item)">Remove</button>
                </td>
              </tr>
              <tr *ngIf="waitlists.length === 0">
                <td colspan="8" class="text-center py-4">No guests currently waiting in queue.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Join Modal -->
      <div *ngIf="showJoinModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Add Guest to Waitlist</h3>
            <button class="close-btn" (click)="showJoinModal = false">&times;</button>
          </div>
          <form [formGroup]="joinForm" (ngSubmit)="submitWaitlist()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Guest *</label>
                <select formControlName="guestId" class="form-control">
                  <option value="" disabled>-- Select Guest --</option>
                  <option *ngFor="let g of guests" [value]="g.id">
                    {{ g.firstName }} {{ g.lastName }} ({{ g.email }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Room Category *</label>
                <select formControlName="categoryId" class="form-control">
                  <option value="" disabled>-- Select Category --</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">
                    {{ cat.name }} (\${{ cat.basePrice }}/night)
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Check-In Date *</label>
                  <input type="date" formControlName="checkInDate" class="form-control" />
                </div>
                <div class="form-group col">
                  <label>Check-Out Date *</label>
                  <input type="date" formControlName="checkOutDate" class="form-control" />
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
                <label>Notes</label>
                <textarea formControlName="notes" class="form-control" rows="2"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showJoinModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="joinForm.invalid || submitting">
                {{ submitting ? 'Adding...' : 'Join Waitlist' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Remove from Waitlist"
        [message]="deleteMessage"
        (confirm)="executeCancel()"
        (cancel)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .queue-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
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
export class WaitlistComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private guestService = inject(GuestService);
  private roomService = inject(RoomService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  waitlists: WaitlistResponse[] = [];
  guests: GuestResponse[] = [];
  categories: RoomCategoryResponse[] = [];
  loading = false;
  submitting = false;

  showJoinModal = false;
  joinForm: FormGroup;

  showDeleteModal = false;
  deleteMessage = '';
  selectedId: number | null = null;

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);

    this.joinForm = this.fb.group({
      guestId: ['', Validators.required],
      categoryId: ['', Validators.required],
      checkInDate: [today, Validators.required],
      checkOutDate: [nextWeek.toISOString().split('T')[0], Validators.required],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.min(0)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.reservationService.getAllActiveWaitlists().subscribe({
      next: (list) => {
        this.waitlists = list;
        this.guestService.getAllGuests().subscribe({
          next: (guests) => {
            this.guests = guests;
            this.roomService.getAllCategories().subscribe({
              next: (cats) => {
                this.categories = cats;
                this.loading = false;
              },
              error: () => (this.loading = false)
            });
          },
          error: () => (this.loading = false)
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load waitlist: ' + (err.error?.message || err.message));
      }
    });
  }

  submitWaitlist(): void {
    if (this.joinForm.invalid) return;
    this.submitting = true;
    this.reservationService.joinWaitlist(this.joinForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Guest added to waitlist queue');
        this.showJoinModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to join waitlist: ' + (err.error?.message || err.message));
      }
    });
  }

  confirmCancel(item: WaitlistResponse): void {
    this.selectedId = item.id;
    this.deleteMessage = `Remove guest "${item.guestName || 'ID #' + item.guestId}" from waitlist?`;
    this.showDeleteModal = true;
  }

  executeCancel(): void {
    if (!this.selectedId) return;
    this.reservationService.cancelWaitlist(this.selectedId).subscribe({
      next: () => {
        this.notify.success('Removed from waitlist');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: (err) => {
        this.showDeleteModal = false;
        this.notify.error('Removal failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
