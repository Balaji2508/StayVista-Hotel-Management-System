import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { ShiftHandoverResponse } from '../../core/models/operations.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-shift-handover',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    IconComponent
  ],
  template: `
    <div class="handover-page">
      <app-page-header
        title="Duty Manager Shift Handover Notes"
        subtitle="Log operational handover notes, pending front desk tasks, VIP arrivals, cash positions, and guest complaints"
      >
        <div class="header-actions">
          <a routerLink="/operations/cash-drawer" class="btn btn-outline">Cash Drawer</a>
          <button class="btn btn-primary" (click)="showNewModal = true">
            <app-icon name="plus" [size]="15"></app-icon>
            <span>Create Handover Note</span>
          </button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="handovers-grid">
        <div *ngFor="let h of handovers" class="card handover-card">
          <div class="handover-header">
            <div>
              <h3>Shift of {{ h.shiftDate }}</h3>
              <span class="staff-tag">Outgoing Staff #{{ h.outgoingStaffId }}</span>
            </div>
            <span class="badge" [class.badge-success]="h.acknowledged" [class.badge-warning]="!h.acknowledged">
              {{ h.acknowledged ? 'ACKNOWLEDGED' : 'PENDING ACKNOWLEDGEMENT' }}
            </span>
          </div>

          <div class="notes-sections">
            <div class="note-box" *ngIf="h.pendingTasksNotes">
              <span class="note-label">Pending Tasks:</span>
              <p>{{ h.pendingTasksNotes }}</p>
            </div>
            <div class="note-box" *ngIf="h.arrivalsNotes">
              <span class="note-label">Expected Arrivals & VIPs:</span>
              <p>{{ h.arrivalsNotes }}</p>
            </div>
            <div class="note-box" *ngIf="h.departuresNotes">
              <span class="note-label">Departures & Extensions:</span>
              <p>{{ h.departuresNotes }}</p>
            </div>
            <div class="note-box" *ngIf="h.cashNotes">
              <span class="note-label">Cash Position Notes:</span>
              <p>{{ h.cashNotes }}</p>
            </div>
            <div class="note-box" *ngIf="h.complaintsNotes">
              <span class="note-label">Escalated Complaints:</span>
              <p>{{ h.complaintsNotes }}</p>
            </div>
          </div>

          <div class="handover-footer">
            <span class="date">{{ h.createdAt | date:'short' }}</span>
            <button
              *ngIf="!h.acknowledged"
              class="btn btn-sm btn-success"
              (click)="acknowledgeHandover(h)"
            >
              <app-icon name="check" [size]="14"></app-icon>
              <span>Acknowledge Handover</span>
            </button>
            <span *ngIf="h.acknowledged" class="ack-info">
              Acknowledged by Staff #{{ h.incomingStaffId || 'Manager' }} on {{ h.acknowledgedAt | date:'short' }}
            </span>
          </div>
        </div>

        <div *ngIf="handovers.length === 0" class="col-span-all text-center py-4 card">
          <p>No shift handover notes logged yet.</p>
        </div>
      </div>

      <!-- New Handover Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog handover-dialog">
          <div class="modal-header">
            <h3>New Shift Handover Report</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="handoverForm" (ngSubmit)="submitHandover()">
            <div class="modal-body">
              <div class="form-group">
                <label>Shift Date *</label>
                <input type="date" formControlName="shiftDate" class="form-control" />
              </div>

              <div class="form-group">
                <label>Pending Tasks for Next Shift</label>
                <textarea formControlName="pendingTasksNotes" class="form-control" rows="2" placeholder="e.g. Call luggage delivery, follow up with guest in 304..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Arrivals & VIP Notes</label>
                  <textarea formControlName="arrivalsNotes" class="form-control" rows="2" placeholder="VIP arrivals expected..."></textarea>
                </div>
                <div class="form-group col">
                  <label>Departures / Late Checkout</label>
                  <textarea formControlName="departuresNotes" class="form-control" rows="2" placeholder="Guests requesting 2 PM checkout..."></textarea>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Cash Drawer Notes</label>
                  <input type="text" formControlName="cashNotes" class="form-control" placeholder="Float balanced, \$500 drop completed" />
                </div>
                <div class="form-group col">
                  <label>Complaint Escalations</label>
                  <input type="text" formControlName="complaintsNotes" class="form-control" placeholder="Room 102 noise issue escalated" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="handoverForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Submit Handover' }}
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
      gap: 0.75rem;
    }
    .handovers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .handover-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .handover-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .handover-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .staff-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .notes-sections {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .note-box {
      background: var(--bg-hover);
      padding: 0.6rem 0.8rem;
      border-radius: var(--radius);
      font-size: 0.85rem;
    }
    .note-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.15rem;
    }
    .note-box p {
      margin: 0;
      color: var(--text-secondary);
    }
    .handover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .ack-info {
      color: var(--success);
      font-weight: 600;
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
    .handover-dialog {
      max-width: 680px;
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
export class ShiftHandoverComponent implements OnInit {
  private opsService = inject(OperationsService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  handovers: ShiftHandoverResponse[] = [];
  loading = false;
  submitting = false;

  showNewModal = false;
  handoverForm: FormGroup;

  constructor() {
    this.handoverForm = this.fb.group({
      shiftDate: [new Date().toISOString().split('T')[0], Validators.required],
      pendingTasksNotes: [''],
      arrivalsNotes: [''],
      departuresNotes: [''],
      cashNotes: ['Cash float reconciled'],
      complaintsNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadHandovers();
  }

  loadHandovers(): void {
    this.loading = true;
    this.opsService.getShiftHandovers().subscribe({
      next: (list) => {
        this.handovers = list;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load handovers: ' + (err.error?.message || err.message));
      }
    });
  }

  submitHandover(): void {
    if (this.handoverForm.invalid) return;
    this.submitting = true;
    this.opsService.createShiftHandover(this.handoverForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Shift handover note logged');
        this.showNewModal = false;
        this.loadHandovers();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Submission failed: ' + (err.error?.message || err.message));
      }
    });
  }

  acknowledgeHandover(h: ShiftHandoverResponse): void {
    this.opsService.acknowledgeShiftHandover(h.id, { notes: 'Acknowledged and accepted' }).subscribe({
      next: () => {
        this.notify.success('Handover acknowledged');
        this.loadHandovers();
      },
      error: (err) => this.notify.error('Acknowledge failed: ' + (err.error?.message || err.message))
    });
  }
}
