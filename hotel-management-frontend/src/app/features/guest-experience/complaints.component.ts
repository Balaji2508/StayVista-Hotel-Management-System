import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { GuestExperienceService } from '../../core/services/guest-experience.service';
import { GuestService } from '../../core/services/guest.service';
import { ComplaintResponse, ComplaintPriority, ComplaintStatus } from '../../core/models/guest-experience.models';
import { GuestResponse } from '../../core/models/guest.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-complaints',
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
    <div class="complaints-page">
      <app-page-header
        title="Guest Complaints & Service Recovery"
        subtitle="Track guest grievances, prioritize resolution urgency, assign duty managers, and record resolutions"
      >
        <div class="header-actions">
          <a routerLink="/guest-experience/requests" class="btn btn-outline">Service Requests</a>
          <a routerLink="/guest-experience/feedback" class="btn btn-outline">Guest Reviews</a>
          <button class="btn btn-primary" (click)="showNewModal = true">+ File Complaint</button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Subject</th>
                <th>Guest</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Logged At</th>
                <th>Resolution Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of complaints">
                <td>#{{ c.id }}</td>
                <td>
                  <strong>{{ c.subject }}</strong>
                  <div class="sub-text">{{ c.description }}</div>
                </td>
                <td>{{ c.guestName || 'Guest #' + c.guestId }}</td>
                <td>
                  <span class="priority-pill" [attr.data-priority]="c.priority">{{ c.priority }}</span>
                </td>
                <td>
                  <app-status-badge [status]="c.status"></app-status-badge>
                </td>
                <td>{{ c.createdAt | date:'short' }}</td>
                <td>{{ c.resolutionRemarks || '-' }}</td>
                <td>
                  <button
                    *ngIf="c.status !== 'RESOLVED' && c.status !== 'CLOSED'"
                    class="btn btn-sm btn-outline-success"
                    (click)="openResolveModal(c)"
                  >
                    Resolve Ticket
                  </button>
                </td>
              </tr>
              <tr *ngIf="complaints.length === 0">
                <td colspan="8" class="text-center py-4">No active complaints logged.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- New Complaint Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Log Guest Grievance</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="complaintForm" (ngSubmit)="submitComplaint()">
            <div class="modal-body">
              <div class="form-group">
                <label>Guest *</label>
                <select formControlName="guestId" class="form-control">
                  <option value="" disabled>-- Select Guest --</option>
                  <option *ngFor="let g of guests" [value]="g.id">
                    {{ g.firstName }} {{ g.lastName }} ({{ g.email }})
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Subject *</label>
                  <input type="text" formControlName="subject" class="form-control" placeholder="e.g. AC noise, Wi-Fi connectivity" />
                </div>
                <div class="form-group col">
                  <label>Priority *</label>
                  <select formControlName="priority" class="form-control">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Description *</label>
                <textarea formControlName="description" class="form-control" rows="3" placeholder="Detailed account of the issue..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="complaintForm.invalid || submitting">
                {{ submitting ? 'Logging...' : 'File Complaint' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Resolve Modal -->
      <div *ngIf="showResolveModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Resolve Complaint #{{ targetComplaint?.id }}</h3>
            <button class="close-btn" (click)="showResolveModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Subject: <strong>{{ targetComplaint?.subject }}</strong></p>
            <div class="form-group">
              <label>Resolution Action / Remarks *</label>
              <textarea [(ngModel)]="resolveRemarks" class="form-control" rows="3" placeholder="Offered room move, discount coupon applied, maintenance rectified issue..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showResolveModal = false">Cancel</button>
            <button class="btn btn-success" (click)="executeResolve()" [disabled]="!resolveRemarks || submitting">
              {{ submitting ? 'Saving...' : 'Mark as RESOLVED' }}
            </button>
          </div>
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
    .priority-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      background: var(--bg-hover);
    }
    .priority-pill[data-priority="URGENT"], .priority-pill[data-priority="HIGH"] {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.1);
    }
    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .btn-outline-success {
      border: 1px solid var(--success);
      color: var(--success);
      background: transparent;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-outline-success:hover {
      background: var(--success);
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
export class ComplaintsComponent implements OnInit {
  private guestExpService = inject(GuestExperienceService);
  private guestService = inject(GuestService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  complaints: ComplaintResponse[] = [];
  guests: GuestResponse[] = [];
  loading = false;
  submitting = false;

  showNewModal = false;
  complaintForm: FormGroup;

  showResolveModal = false;
  targetComplaint: ComplaintResponse | null = null;
  resolveRemarks = '';

  constructor() {
    this.complaintForm = this.fb.group({
      guestId: ['', Validators.required],
      subject: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.guestExpService.getAllComplaints().subscribe({
      next: (list) => {
        this.complaints = list;
        this.guestService.getAllGuests().subscribe({
          next: (guests) => {
            this.guests = guests;
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load complaints: ' + (err.error?.message || err.message));
      }
    });
  }

  submitComplaint(): void {
    if (this.complaintForm.invalid) return;
    this.submitting = true;
    this.guestExpService.createComplaint(this.complaintForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Complaint logged successfully');
        this.showNewModal = false;
        this.complaintForm.reset({ priority: 'MEDIUM' });
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to log complaint: ' + (err.error?.message || err.message));
      }
    });
  }

  openResolveModal(c: ComplaintResponse): void {
    this.targetComplaint = c;
    this.resolveRemarks = '';
    this.showResolveModal = true;
  }

  executeResolve(): void {
    if (!this.targetComplaint || !this.resolveRemarks) return;
    this.submitting = true;
    this.guestExpService.updateComplaintStatus(this.targetComplaint.id, {
      status: 'RESOLVED',
      resolutionRemarks: this.resolveRemarks
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Complaint marked as resolved');
        this.showResolveModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to resolve: ' + (err.error?.message || err.message));
      }
    });
  }
}
