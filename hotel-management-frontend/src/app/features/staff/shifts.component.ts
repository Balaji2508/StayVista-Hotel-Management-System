import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { StaffService } from '../../core/services/staff.service';
import { ShiftResponse, StaffResponse } from '../../core/models/staff.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-shifts',
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
    <div class="shifts-page">
      <app-page-header
        title="Shift Rosters & Staff Allocations"
        subtitle="Configure morning, evening, and night work shifts and assign team members to rosters"
      >
        <div class="header-actions">
          <a routerLink="/staff" class="btn btn-outline">← Staff Directory</a>
          <button class="btn btn-primary" (click)="showNewShiftModal = true">+ Create Shift</button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="shifts-grid">
        <div *ngFor="let shift of shifts" class="card shift-card">
          <div class="shift-header">
            <h3>{{ shift.name }}</h3>
            <span class="badge" [class.badge-success]="shift.active" [class.badge-secondary]="!shift.active">
              {{ shift.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="time-block">
            <span class="clock-icon">🕒</span>
            <span class="time-text">{{ shift.startTime }} — {{ shift.endTime }}</span>
          </div>

          <div class="assigned-section">
            <div class="section-top">
              <h5>Assigned Personnel ({{ shift.assignedStaff?.length || 0 }})</h5>
              <button class="btn btn-sm btn-outline" (click)="openAssignModal(shift)">+ Assign Staff</button>
            </div>

            <div class="staff-chips" *ngIf="shift.assignedStaff?.length">
              <div *ngFor="let s of shift.assignedStaff" class="staff-chip">
                <span>{{ s.firstName }} {{ s.lastName }} ({{ s.role }})</span>
                <button class="remove-btn" (click)="removeStaff(shift.id, s.id)" title="Remove">&times;</button>
              </div>
            </div>
            <p *ngIf="!shift.assignedStaff?.length" class="empty-note">No personnel currently allocated to this shift.</p>
          </div>
        </div>

        <div *ngIf="shifts.length === 0" class="col-span-all text-center py-4 card">
          <p>No work shifts configured yet.</p>
        </div>
      </div>

      <!-- New Shift Modal -->
      <div *ngIf="showNewShiftModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Create Work Shift</h3>
            <button class="close-btn" (click)="showNewShiftModal = false">&times;</button>
          </div>
          <form [formGroup]="shiftForm" (ngSubmit)="submitShift()">
            <div class="modal-body">
              <div class="form-group">
                <label>Shift Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. Morning Front-Desk" />
              </div>
              <div class="form-row">
                <div class="form-group col">
                  <label>Start Time *</label>
                  <input type="time" formControlName="startTime" class="form-control" />
                </div>
                <div class="form-group col">
                  <label>End Time *</label>
                  <input type="time" formControlName="endTime" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewShiftModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="shiftForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Create Shift' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Assign Staff Modal -->
      <div *ngIf="showAssignModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Assign Staff to {{ targetShift?.name }}</h3>
            <button class="close-btn" (click)="showAssignModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Team Member *</label>
              <select [(ngModel)]="selectedStaffId" class="form-control">
                <option [ngValue]="null" disabled>-- Select Staff --</option>
                <option *ngFor="let s of allStaff" [ngValue]="s.id">
                  {{ s.firstName }} {{ s.lastName }} ({{ s.role }} - {{ s.department }})
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAssignModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="executeAssign()" [disabled]="!selectedStaffId || submitting">
              {{ submitting ? 'Assigning...' : 'Assign to Shift' }}
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
    .shifts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .shift-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .shift-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .shift-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .time-block {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary);
      background: var(--bg-hover);
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius);
    }
    .assigned-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
    }
    .section-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-top h5 {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .staff-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .staff-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-hover);
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .remove-btn {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: var(--text-muted);
      line-height: 1;
    }
    .remove-btn:hover {
      color: var(--danger);
    }
    .empty-note {
      font-size: 0.8rem;
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
    .form-row {
      display: flex;
      gap: 0.75rem;
    }
    .col {
      flex: 1;
    }
  `]
})
export class ShiftsComponent implements OnInit {
  private staffService = inject(StaffService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  shifts: ShiftResponse[] = [];
  allStaff: StaffResponse[] = [];
  loading = false;
  submitting = false;

  showNewShiftModal = false;
  shiftForm: FormGroup;

  showAssignModal = false;
  targetShift: ShiftResponse | null = null;
  selectedStaffId: number | null = null;

  constructor() {
    this.shiftForm = this.fb.group({
      name: ['', Validators.required],
      startTime: ['08:00', Validators.required],
      endTime: ['16:00', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.staffService.getAllShifts().subscribe({
      next: (list) => {
        this.shifts = list;
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
        this.notify.error('Failed to load shifts: ' + (err.error?.message || err.message));
      }
    });
  }

  submitShift(): void {
    if (this.shiftForm.invalid) return;
    this.submitting = true;
    this.staffService.createShift(this.shiftForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Shift created');
        this.showNewShiftModal = false;
        this.shiftForm.reset({ startTime: '08:00', endTime: '16:00' });
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to create shift: ' + (err.error?.message || err.message));
      }
    });
  }

  openAssignModal(shift: ShiftResponse): void {
    this.targetShift = shift;
    this.selectedStaffId = null;
    this.showAssignModal = true;
  }

  executeAssign(): void {
    if (!this.targetShift || !this.selectedStaffId) return;
    this.submitting = true;
    this.staffService.assignStaffToShift(this.targetShift.id, this.selectedStaffId).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Staff assigned to shift');
        this.showAssignModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Assignment failed: ' + (err.error?.message || err.message));
      }
    });
  }

  removeStaff(shiftId: number, staffId: number): void {
    this.staffService.removeStaffFromShift(shiftId, staffId).subscribe({
      next: () => {
        this.notify.success('Removed staff from shift');
        this.loadData();
      },
      error: (err) => {
        this.notify.error('Removal failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
