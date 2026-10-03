import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { RoomService } from '../../core/services/room.service';
import { StaffService } from '../../core/services/staff.service';
import { HousekeepingTaskResponse, HousekeepingStatus } from '../../core/models/operations.models';
import { RoomResponse } from '../../core/models/room.models';
import { StaffResponse } from '../../core/models/staff.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-housekeeping',
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
    <div class="housekeeping-page">
      <app-page-header
        title="Housekeeping Tasks & Room Readiness"
        subtitle="Track cleaning workflows, assign attendants, inspect cleanliness, and release rooms for arrivals"
      >
        <div class="header-actions">
          <a routerLink="/operations/assignments" class="btn btn-outline">Room Range Allocations</a>
          <a routerLink="/operations/maintenance" class="btn btn-outline">Maintenance Defects</a>
          <button class="btn btn-primary" (click)="showNewModal = true">+ Dispatch Cleaning Task</button>
        </div>
      </app-page-header>

      <!-- Status Filters -->
      <div class="card filter-bar">
        <div class="status-filters">
          <button
            *ngFor="let s of statuses"
            class="filter-pill"
            [class.active]="selectedStatus === s"
            (click)="selectedStatus = s"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Tasks Grid -->
      <div *ngIf="!loading" class="tasks-grid">
        <div *ngFor="let task of filteredTasks" class="card task-card">
          <div class="task-top">
            <div class="room-indicator">
              <span class="room-title">Room {{ task.roomNumber || '#' + task.roomId }}</span>
              <span class="task-type">{{ task.taskType }}</span>
            </div>
            <app-status-badge [status]="task.status"></app-status-badge>
          </div>

          <div class="task-info">
            <div class="info-row">
              <span class="label">Priority:</span>
              <span class="font-bold" [class.text-danger]="task.priority === 'HIGH' || task.priority === 'URGENT'">{{ task.priority }}</span>
            </div>
            <div class="info-row">
              <span class="label">Attendant:</span>
              <span>{{ task.staffName || (task.assignedStaffId ? 'Staff #' + task.assignedStaffId : 'Unassigned') }}</span>
            </div>
            <div class="info-row" *ngIf="task.notes">
              <span class="label">Notes:</span>
              <span class="italic">{{ task.notes }}</span>
            </div>
          </div>

          <div class="task-actions">
            <button
              *ngIf="task.status === 'ASSIGNED' || task.status === 'PENDING'"
              class="btn btn-sm btn-outline-primary"
              (click)="acceptTask(task)"
            >
              Accept
            </button>

            <button
              *ngIf="task.status === 'ACCEPTED'"
              class="btn btn-sm btn-primary"
              (click)="startTask(task)"
            >
              Start Cleaning
            </button>

            <button
              *ngIf="task.status === 'IN_PROGRESS'"
              class="btn btn-sm btn-success"
              (click)="completeTask(task)"
            >
              Mark Done
            </button>

            <button
              *ngIf="task.status === 'COMPLETED'"
              class="btn btn-sm btn-warning"
              (click)="verifyTask(task)"
            >
              Verify & Release
            </button>
          </div>
        </div>

        <div *ngIf="filteredTasks.length === 0" class="col-span-all text-center py-4 card">
          <p>No housekeeping tasks found matching criteria.</p>
        </div>
      </div>

      <!-- New Task Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Dispatch Cleaning Task</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="taskForm" (ngSubmit)="submitTask()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Room *</label>
                <select formControlName="roomId" class="form-control">
                  <option value="" disabled>-- Select Room --</option>
                  <option *ngFor="let r of rooms" [value]="r.id">
                    Room {{ r.roomNumber }} (Status: {{ r.status }} - Floor {{ r.floor }})
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Task Type *</label>
                  <select formControlName="taskType" class="form-control">
                    <option value="CHECKOUT_CLEANING">Checkout Deep Clean</option>
                    <option value="STAYOVER_CLEANING">Stayover Service</option>
                    <option value="TOUCHUP">Touchup Inspection</option>
                    <option value="LINEN_CHANGE">Linen Replacement</option>
                  </select>
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
                <label>Assign Attendant (Optional)</label>
                <select formControlName="assignedStaffId" class="form-control">
                  <option [ngValue]="null">Auto / Pool Assignment</option>
                  <option *ngFor="let s of attendants" [value]="s.id">
                    {{ s.firstName }} {{ s.lastName }} ({{ s.role }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Task Notes / Instructions</label>
                <textarea formControlName="notes" class="form-control" rows="2" placeholder="e.g. VIP arrival at 2 PM, sanitize balcony"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="taskForm.invalid || submitting">
                {{ submitting ? 'Dispatching...' : 'Dispatch Task' }}
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
    .filter-bar {
      padding: 1rem;
      margin-bottom: 1.25rem;
    }
    .status-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-pill {
      border: 1px solid var(--border-color);
      background: var(--surface);
      color: var(--text-secondary);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-pill:hover, .filter-pill.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .task-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .task-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .room-title {
      font-size: 1.15rem;
      font-weight: 700;
      display: block;
    }
    .task-type {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .task-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
    }
    .info-row .label {
      color: var(--text-muted);
    }
    .task-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
    }
    .btn-outline-primary {
      border: 1px solid var(--primary);
      color: var(--primary);
      background: transparent;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-outline-primary:hover {
      background: var(--primary);
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
export class HousekeepingComponent implements OnInit {
  private opsService = inject(OperationsService);
  private roomService = inject(RoomService);
  private staffService = inject(StaffService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  tasks: HousekeepingTaskResponse[] = [];
  rooms: RoomResponse[] = [];
  attendants: StaffResponse[] = [];
  loading = false;
  submitting = false;
  selectedStatus = 'ALL';

  statuses = ['ALL', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];

  showNewModal = false;
  taskForm: FormGroup;

  constructor() {
    this.taskForm = this.fb.group({
      roomId: ['', Validators.required],
      taskType: ['CHECKOUT_CLEANING', Validators.required],
      priority: ['MEDIUM', Validators.required],
      assignedStaffId: [null],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.opsService.getAllTasks().subscribe({
      next: (list) => {
        this.tasks = list;
        this.roomService.getAllRooms().subscribe({
          next: (rms) => {
            this.rooms = rms;
            this.staffService.getAllStaff().subscribe({
              next: (staff) => {
                this.attendants = staff.filter(s => s.role === 'HOUSEKEEPER' || s.role === 'STAFF');
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
        this.notify.error('Failed to load tasks: ' + (err.error?.message || err.message));
      }
    });
  }

  get filteredTasks(): HousekeepingTaskResponse[] {
    return this.tasks.filter((t) => {
      return this.selectedStatus === 'ALL' || t.status === this.selectedStatus;
    });
  }

  submitTask(): void {
    if (this.taskForm.invalid) return;
    this.submitting = true;
    this.opsService.createTask(this.taskForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Housekeeping task dispatched');
        this.showNewModal = false;
        this.taskForm.reset({ taskType: 'CHECKOUT_CLEANING', priority: 'MEDIUM' });
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Dispatch failed: ' + (err.error?.message || err.message));
      }
    });
  }

  acceptTask(t: HousekeepingTaskResponse): void {
    this.opsService.acceptTask(t.id).subscribe({
      next: () => {
        this.notify.success('Task accepted');
        this.loadData();
      },
      error: (err) => this.notify.error('Accept error: ' + (err.error?.message || err.message))
    });
  }

  startTask(t: HousekeepingTaskResponse): void {
    this.opsService.startTask(t.id).subscribe({
      next: () => {
        this.notify.success('Cleaning in progress');
        this.loadData();
      },
      error: (err) => this.notify.error('Start error: ' + (err.error?.message || err.message))
    });
  }

  completeTask(t: HousekeepingTaskResponse): void {
    this.opsService.completeTask(t.id).subscribe({
      next: () => {
        this.notify.success('Cleaning marked completed! Awaiting supervisor inspection.');
        this.loadData();
      },
      error: (err) => this.notify.error('Complete error: ' + (err.error?.message || err.message))
    });
  }

  verifyTask(t: HousekeepingTaskResponse): void {
    this.opsService.verifyTask(t.id).subscribe({
      next: () => {
        this.notify.success('Cleanliness verified! Room is now AVAILABLE.');
        this.loadData();
      },
      error: (err) => this.notify.error('Verification error: ' + (err.error?.message || err.message))
    });
  }
}
