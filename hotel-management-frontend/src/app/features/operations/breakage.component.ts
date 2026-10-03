import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { RoomService } from '../../core/services/room.service';
import { BreakageResponse, BreakageStatus } from '../../core/models/operations.models';
import { RoomResponse } from '../../core/models/room.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-breakage',
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
    <div class="breakage-page">
      <app-page-header
        title="Breakage & Property Damage Tracking"
        subtitle="Report room damage, estimate replacement costs, review manager liabilities, and charge guest folios"
      >
        <div class="header-actions">
          <a routerLink="/operations/maintenance" class="btn btn-outline">Maintenance Orders</a>
          <button class="btn btn-primary" (click)="showNewModal = true">+ Report Damage</button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Report #</th>
                <th>Room</th>
                <th>Damaged Item</th>
                <th>Estimated Cost</th>
                <th>Reservation Ref</th>
                <th>Status</th>
                <th>Reported At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of breakages">
                <td>#{{ b.id }}</td>
                <td><strong>Room {{ b.roomNumber || '#' + b.roomId }}</strong></td>
                <td>
                  <strong>{{ b.itemName }}</strong>
                  <div class="sub-text" *ngIf="b.remarks">{{ b.remarks }}</div>
                </td>
                <td><strong class="text-danger">\${{ b.estimatedCost | number:'1.2-2' }}</strong></td>
                <td>
                  <span *ngIf="b.reservationId">Res #{{ b.reservationId }}</span>
                  <span *ngIf="!b.reservationId" class="text-muted">-</span>
                </td>
                <td>
                  <app-status-badge [status]="b.status"></app-status-badge>
                </td>
                <td>{{ b.createdAt | date:'short' }}</td>
                <td>
                  <div class="actions" *ngIf="b.status === 'REPORTED'">
                    <button class="btn btn-sm btn-outline-success" (click)="openReviewModal(b, 'APPROVED')">Approve</button>
                    <button class="btn btn-sm btn-outline-danger" (click)="openReviewModal(b, 'REJECTED')">Reject</button>
                  </div>
                  <div *ngIf="b.status === 'APPROVED'">
                    <button class="btn btn-sm btn-success" (click)="openReviewModal(b, 'CHARGED')">Charge Folio</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="breakages.length === 0">
                <td colspan="8" class="text-center py-4">No damage or breakage reports logged.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Report Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Report Damaged Hotel Property</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="breakageForm" (ngSubmit)="submitBreakage()">
            <div class="modal-body">
              <div class="form-group">
                <label>Room *</label>
                <select formControlName="roomId" class="form-control">
                  <option value="" disabled>-- Select Room --</option>
                  <option *ngFor="let r of rooms" [value]="r.id">Room {{ r.roomNumber }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Damaged Item Name *</label>
                <input type="text" formControlName="itemName" class="form-control" placeholder="e.g. Broken Lamp, Stained Carpet, Cracked Mirror" />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Estimated Replacement Cost ($) *</label>
                  <input type="number" formControlName="estimatedCost" class="form-control" min="0" step="0.01" />
                </div>
                <div class="form-group col">
                  <label>Reservation ID (Optional)</label>
                  <input type="number" formControlName="reservationId" class="form-control" placeholder="e.g. 12" />
                </div>
              </div>

              <div class="form-group">
                <label>Damage Details / Remarks</label>
                <textarea formControlName="remarks" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="breakageForm.invalid || submitting">
                {{ submitting ? 'Submitting...' : 'File Report' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Review Modal -->
      <div *ngIf="showReviewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Review Damage Liability</h3>
            <button class="close-btn" (click)="showReviewModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Action: <strong>{{ targetStatus }}</strong> for {{ targetBreakage?.itemName }} (\${{ targetBreakage?.estimatedCost }})</p>
            <div class="form-group">
              <label>Review Remarks</label>
              <input type="text" [(ngModel)]="reviewRemarks" class="form-control" placeholder="Remarks..." />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showReviewModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="executeReview()" [disabled]="submitting">
              Confirm Decision
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .actions {
      display: flex;
      gap: 0.35rem;
    }
    .btn-outline-success {
      border: 1px solid var(--success);
      color: var(--success);
      background: transparent;
      padding: 0.2rem 0.45rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-outline-success:hover {
      background: var(--success);
      color: white;
    }
    .btn-outline-danger {
      border: 1px solid var(--danger);
      color: var(--danger);
      background: transparent;
      padding: 0.2rem 0.45rem;
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
export class BreakageComponent implements OnInit {
  private opsService = inject(OperationsService);
  private roomService = inject(RoomService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  breakages: BreakageResponse[] = [];
  rooms: RoomResponse[] = [];
  loading = false;
  submitting = false;

  showNewModal = false;
  breakageForm: FormGroup;

  showReviewModal = false;
  targetBreakage: BreakageResponse | null = null;
  targetStatus: BreakageStatus = 'APPROVED';
  reviewRemarks = '';

  constructor() {
    this.breakageForm = this.fb.group({
      roomId: ['', Validators.required],
      itemName: ['', Validators.required],
      estimatedCost: [50, [Validators.required, Validators.min(0)]],
      reservationId: [null],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.opsService.getAllBreakageReports().subscribe({
      next: (list) => {
        this.breakages = list;
        this.roomService.getAllRooms().subscribe({
          next: (rms) => {
            this.rooms = rms;
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load breakages: ' + (err.error?.message || err.message));
      }
    });
  }

  submitBreakage(): void {
    if (this.breakageForm.invalid) return;
    this.submitting = true;
    this.opsService.reportBreakage(this.breakageForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Breakage reported');
        this.showNewModal = false;
        this.breakageForm.reset({ estimatedCost: 50 });
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to report: ' + (err.error?.message || err.message));
      }
    });
  }

  openReviewModal(b: BreakageResponse, status: BreakageStatus): void {
    this.targetBreakage = b;
    this.targetStatus = status;
    this.reviewRemarks = status === 'CHARGED' ? 'Added to guest folio' : '';
    this.showReviewModal = true;
  }

  executeReview(): void {
    if (!this.targetBreakage) return;
    this.submitting = true;
    this.opsService.reviewBreakage(this.targetBreakage.id, {
      status: this.targetStatus,
      remarks: this.reviewRemarks
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success(`Breakage updated to ${this.targetStatus}`);
        this.showReviewModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Review failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
