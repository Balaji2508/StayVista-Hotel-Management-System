import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { StaffService } from '../../core/services/staff.service';
import { RoomAssignmentResponse } from '../../core/models/operations.models';
import { StaffResponse } from '../../core/models/staff.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-room-assignments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="assignments-page">
      <app-page-header
        title="Room Range Allocations"
        subtitle="Assign floor ranges and room blocks to housekeeping attendants"
      >
        <div class="header-actions">
          <a routerLink="/operations/housekeeping" class="btn btn-outline">← Housekeeping Tasks</a>
          <button class="btn btn-primary" (click)="showNewModal = true">+ Assign Room Range</button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Allocation #</th>
                <th>Housekeeper</th>
                <th>Room Range</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of assignments">
                <td>#{{ a.id }}</td>
                <td><strong>{{ a.staffName || 'Staff #' + a.staffId }}</strong></td>
                <td>
                  <span class="range-badge">Rooms {{ a.startRoomNumber }} → {{ a.endRoomNumber }}</span>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="a.active" [class.badge-secondary]="!a.active">
                    {{ a.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>{{ a.createdAt | date:'mediumDate' }}</td>
                <td>
                  <button class="btn btn-sm btn-danger" (click)="confirmDelete(a)">Remove</button>
                </td>
              </tr>
              <tr *ngIf="assignments.length === 0">
                <td colspan="6" class="text-center py-4">No room range allocations defined.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- New Assignment Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Assign Housekeeper Room Block</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="assignForm" (ngSubmit)="submitAssignment()">
            <div class="modal-body">
              <div class="form-group">
                <label>Housekeeper *</label>
                <select formControlName="staffId" class="form-control">
                  <option value="" disabled>-- Select Staff Member --</option>
                  <option *ngFor="let s of housekeepers" [value]="s.id">
                    {{ s.firstName }} {{ s.lastName }} ({{ s.employeeCode }})
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Start Room Number *</label>
                  <input type="number" formControlName="startRoomNumber" class="form-control" placeholder="e.g. 101" />
                </div>
                <div class="form-group col">
                  <label>End Room Number *</label>
                  <input type="number" formControlName="endRoomNumber" class="form-control" placeholder="e.g. 115" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="assignForm.invalid || submitting">
                {{ submitting ? 'Assigning...' : 'Assign Block' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Remove Allocation"
        [message]="deleteMessage"
        (confirm)="executeDelete()"
        (cancel)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .range-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background: var(--bg-hover);
      border-radius: 4px;
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
export class RoomAssignmentsComponent implements OnInit {
  private opsService = inject(OperationsService);
  private staffService = inject(StaffService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  assignments: RoomAssignmentResponse[] = [];
  housekeepers: StaffResponse[] = [];
  loading = false;
  submitting = false;

  showNewModal = false;
  assignForm: FormGroup;

  showDeleteModal = false;
  deleteMessage = '';
  selectedId: number | null = null;

  constructor() {
    this.assignForm = this.fb.group({
      staffId: ['', Validators.required],
      startRoomNumber: [101, [Validators.required, Validators.min(1)]],
      endRoomNumber: [120, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.opsService.getAllRoomAssignments().subscribe({
      next: (list) => {
        this.assignments = list;
        this.staffService.getAllStaff().subscribe({
          next: (staff) => {
            this.housekeepers = staff.filter(s => s.role === 'HOUSEKEEPER' || s.role === 'STAFF');
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load assignments: ' + (err.error?.message || err.message));
      }
    });
  }

  submitAssignment(): void {
    if (this.assignForm.invalid) return;
    this.submitting = true;
    this.opsService.createRoomAssignment(this.assignForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Room range assigned');
        this.showNewModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Assignment failed: ' + (err.error?.message || err.message));
      }
    });
  }

  confirmDelete(a: RoomAssignmentResponse): void {
    this.selectedId = a.id;
    this.deleteMessage = `Remove room allocation for ${a.staffName} (Rooms ${a.startRoomNumber}-${a.endRoomNumber})?`;
    this.showDeleteModal = true;
  }

  executeDelete(): void {
    if (!this.selectedId) return;
    this.opsService.deleteRoomAssignment(this.selectedId).subscribe({
      next: () => {
        this.notify.success('Allocation removed');
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
