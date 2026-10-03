import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { StaffService } from '../../core/services/staff.service';
import { LeaveResponse, StaffResponse } from '../../core/models/staff.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-leave',
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
    <div class="leave-page">
      <app-page-header
        title="Leave Management & Approvals"
        subtitle="Submit staff leave requests and review pending manager approval workflows"
      >
        <div class="header-actions">
          <a routerLink="/staff" class="btn btn-outline">← Staff Directory</a>
          <button class="btn btn-primary" (click)="showRequestModal = true">+ Submit Leave Request</button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Staff Member</th>
                <th>Leave Type</th>
                <th>Dates (Start → End)</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of leaves">
                <td>#{{ l.id }}</td>
                <td><strong>{{ l.staffName || 'Staff #' + l.staffId }}</strong></td>
                <td><span class="type-pill">{{ l.leaveType }}</span></td>
                <td>{{ l.startDate }} → {{ l.endDate }}</td>
                <td>{{ l.reason }}</td>
                <td>
                  <app-status-badge [status]="l.status"></app-status-badge>
                </td>
                <td>{{ l.remarks || '-' }}</td>
                <td>
                  <div class="actions" *ngIf="l.status === 'PENDING'">
                    <button class="btn btn-sm btn-success" (click)="openDecisionModal(l, 'APPROVED')">Approve</button>
                    <button class="btn btn-sm btn-danger" (click)="openDecisionModal(l, 'REJECTED')">Reject</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="leaves.length === 0">
                <td colspan="8" class="text-center py-4">No leave requests found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Request Modal -->
      <div *ngIf="showRequestModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Apply for Staff Leave</h3>
            <button class="close-btn" (click)="showRequestModal = false">&times;</button>
          </div>
          <form [formGroup]="leaveForm" (ngSubmit)="submitRequest()">
            <div class="modal-body">
              <div class="form-group">
                <label>Staff Member *</label>
                <select formControlName="staffId" class="form-control">
                  <option value="" disabled>-- Select Staff Member --</option>
                  <option *ngFor="let s of allStaff" [value]="s.id">
                    {{ s.firstName }} {{ s.lastName }} ({{ s.role }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Leave Type *</label>
                <select formControlName="leaveType" class="form-control">
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Start Date *</label>
                  <input type="date" formControlName="startDate" class="form-control" />
                </div>
                <div class="form-group col">
                  <label>End Date *</label>
                  <input type="date" formControlName="endDate" class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label>Reason *</label>
                <textarea formControlName="reason" class="form-control" rows="2" placeholder="Explanation..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showRequestModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="leaveForm.invalid || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Request' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Approve/Reject Decision Modal -->
      <div *ngIf="showDecisionModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ targetStatus === 'APPROVED' ? 'Approve' : 'Reject' }} Leave Request</h3>
            <button class="close-btn" (click)="showDecisionModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Leave request for <strong>{{ targetLeave?.staffName }}</strong> ({{ targetLeave?.startDate }} to {{ targetLeave?.endDate }})</p>
            <div class="form-group">
              <label>Decision Remarks (Optional)</label>
              <input type="text" [(ngModel)]="decisionRemarks" class="form-control" placeholder="Remarks..." />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDecisionModal = false">Cancel</button>
            <button
              class="btn"
              [class.btn-success]="targetStatus === 'APPROVED'"
              [class.btn-danger]="targetStatus === 'REJECTED'"
              (click)="executeDecision()"
              [disabled]="submitting"
            >
              {{ submitting ? 'Processing...' : ('Confirm ' + targetStatus) }}
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
    .type-pill {
      font-size: 0.75rem;
      background: var(--bg-hover);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
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
export class LeaveComponent implements OnInit {
  private staffService = inject(StaffService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  leaves: LeaveResponse[] = [];
  allStaff: StaffResponse[] = [];
  loading = false;
  submitting = false;

  showRequestModal = false;
  leaveForm: FormGroup;

  showDecisionModal = false;
  targetLeave: LeaveResponse | null = null;
  targetStatus: 'APPROVED' | 'REJECTED' = 'APPROVED';
  decisionRemarks = '';

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);

    this.leaveForm = this.fb.group({
      staffId: ['', Validators.required],
      leaveType: ['ANNUAL', Validators.required],
      startDate: [today, Validators.required],
      endDate: [nextDay.toISOString().split('T')[0], Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.staffService.getAllLeaves().subscribe({
      next: (list) => {
        this.leaves = list;
        this.staffService.getAllStaff().subscribe({
          next: (staff) => {
            this.allStaff = staff;
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load leaves: ' + (err.error?.message || err.message));
      }
    });
  }

  submitRequest(): void {
    if (this.leaveForm.invalid) return;
    this.submitting = true;
    this.staffService.requestLeave(this.leaveForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Leave request submitted');
        this.showRequestModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Submission failed: ' + (err.error?.message || err.message));
      }
    });
  }

  openDecisionModal(l: LeaveResponse, status: 'APPROVED' | 'REJECTED'): void {
    this.targetLeave = l;
    this.targetStatus = status;
    this.decisionRemarks = '';
    this.showDecisionModal = true;
  }

  executeDecision(): void {
    if (!this.targetLeave) return;
    this.submitting = true;
    this.staffService.approveOrRejectLeave(this.targetLeave.id, {
      status: this.targetStatus,
      remarks: this.decisionRemarks
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success(`Leave request ${this.targetStatus.toLowerCase()}`);
        this.showDecisionModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Action failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
