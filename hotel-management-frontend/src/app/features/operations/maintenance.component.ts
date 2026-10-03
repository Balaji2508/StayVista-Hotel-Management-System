import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { RoomService } from '../../core/services/room.service';
import { StaffService } from '../../core/services/staff.service';
import { MaintenanceResponse, MaintenanceStatus } from '../../core/models/operations.models';
import { RoomResponse } from '../../core/models/room.models';
import { StaffResponse } from '../../core/models/staff.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-maintenance',
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
    <div class="maintenance-page">
      <app-page-header
        title="Maintenance Defects & Work Orders"
        subtitle="Report room facility breakdowns, assign technicians, track repair progress, and log repair expenditures"
      >
        <div class="header-actions">
          <a routerLink="/operations/breakage" class="btn btn-outline">Breakage & Damages</a>
          <button class="btn btn-primary" (click)="showNewModal = true">+ Report Defect</button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="maintenance-grid">
        <div *ngFor="let m of issues" class="card maintenance-card">
          <div class="card-header">
            <div>
              <span class="category-tag">{{ m.category }}</span>
              <h4>Room {{ m.roomNumber || '#' + m.roomId }}</h4>
            </div>
            <app-status-badge [status]="m.status"></app-status-badge>
          </div>

          <p class="description">{{ m.description }}</p>

          <div class="meta-details">
            <div class="meta-row">
              <span class="label">Priority:</span>
              <span class="font-bold" [class.text-danger]="m.priority === 'HIGH' || m.priority === 'URGENT'">{{ m.priority }}</span>
            </div>
            <div class="meta-row">
              <span class="label">Technician:</span>
              <span>{{ m.staffName || (m.assignedStaffId ? 'Staff #' + m.assignedStaffId : 'Unassigned') }}</span>
            </div>
            <div class="meta-row" *ngIf="m.repairCost">
              <span class="label">Repair Cost:</span>
              <strong class="text-danger">\${{ m.repairCost | number:'1.2-2' }}</strong>
            </div>
            <div class="meta-row" *ngIf="m.remarks">
              <span class="label">Remarks:</span>
              <span class="italic">{{ m.remarks }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button
              *ngIf="m.status === 'REPORTED'"
              class="btn btn-sm btn-outline-primary"
              (click)="openAssignModal(m)"
            >
              Assign Tech
            </button>

            <button
              *ngIf="m.status === 'ASSIGNED'"
              class="btn btn-sm btn-primary"
              (click)="acceptIssue(m)"
            >
              Accept Ticket
            </button>

            <button
              *ngIf="m.status === 'ACCEPTED'"
              class="btn btn-sm btn-warning"
              (click)="startIssue(m)"
            >
              Start Repairs
            </button>

            <button
              *ngIf="m.status === 'IN_PROGRESS'"
              class="btn btn-sm btn-success"
              (click)="openResolveModal(m)"
            >
              Resolve & Log Cost
            </button>

            <button
              *ngIf="m.status === 'RESOLVED'"
              class="btn btn-sm btn-info"
              (click)="verifyIssue(m)"
            >
              Verify Fix
            </button>
          </div>
        </div>

        <div *ngIf="issues.length === 0" class="col-span-all text-center py-4 card">
          <p>No maintenance defect tickets logged.</p>
        </div>
      </div>

      <!-- Report Issue Modal -->
      <div *ngIf="showNewModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Report Facility Defect</h3>
            <button class="close-btn" (click)="showNewModal = false">&times;</button>
          </div>
          <form [formGroup]="issueForm" (ngSubmit)="submitIssue()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Room *</label>
                <select formControlName="roomId" class="form-control">
                  <option value="" disabled>-- Select Room --</option>
                  <option *ngFor="let r of rooms" [value]="r.id">
                    Room {{ r.roomNumber }} ({{ r.status }})
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Category *</label>
                  <select formControlName="category" class="form-control">
                    <option value="PLUMBING">Plumbing / Water</option>
                    <option value="ELECTRICAL">Electrical / Lighting</option>
                    <option value="HVAC">HVAC / Air Conditioning</option>
                    <option value="FURNITURE">Furniture & Fixtures</option>
                    <option value="APPLIANCE">TV / Safe / Minibar</option>
                    <option value="OTHER">Other</option>
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
                <label>Defect Description *</label>
                <textarea formControlName="description" class="form-control" rows="3" placeholder="Explain the defect and symptoms..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="issueForm.invalid || submitting">
                {{ submitting ? 'Logging...' : 'Report Defect' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Assign Tech Modal -->
      <div *ngIf="showAssignModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Assign Maintenance Technician</h3>
            <button class="close-btn" (click)="showAssignModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Technician *</label>
              <select [(ngModel)]="selectedStaffId" class="form-control">
                <option [ngValue]="null" disabled>-- Select Staff Member --</option>
                <option *ngFor="let s of technicians" [ngValue]="s.id">
                  {{ s.firstName }} {{ s.lastName }} ({{ s.role }})
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAssignModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="executeAssign()" [disabled]="!selectedStaffId || submitting">
              {{ submitting ? 'Assigning...' : 'Assign Work Order' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Resolve Modal -->
      <div *ngIf="showResolveModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Resolve Defect Ticket</h3>
            <button class="close-btn" (click)="showResolveModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Repair Cost ($)</label>
              <input type="number" [(ngModel)]="resolveCost" class="form-control" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Resolution Remarks</label>
              <textarea [(ngModel)]="resolveRemarks" class="form-control" rows="2" placeholder="Replaced valve, re-wired switch..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showResolveModal = false">Cancel</button>
            <button class="btn btn-success" (click)="executeResolve()" [disabled]="submitting">
              {{ submitting ? 'Resolving...' : 'Confirm Resolution' }}
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
    .maintenance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .maintenance-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .category-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
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
    .meta-details {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
      background: var(--bg-hover);
      padding: 0.65rem;
      border-radius: var(--radius);
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
    }
    .meta-row .label {
      color: var(--text-muted);
    }
    .action-buttons {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
      flex-wrap: wrap;
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
    .btn-info {
      background: #0284c7;
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
export class MaintenanceComponent implements OnInit {
  private opsService = inject(OperationsService);
  private roomService = inject(RoomService);
  private staffService = inject(StaffService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  issues: MaintenanceResponse[] = [];
  rooms: RoomResponse[] = [];
  technicians: StaffResponse[] = [];
  loading = false;
  submitting = false;

  showNewModal = false;
  issueForm: FormGroup;

  showAssignModal = false;
  targetIssue: MaintenanceResponse | null = null;
  selectedStaffId: number | null = null;

  showResolveModal = false;
  resolveCost = 0;
  resolveRemarks = '';

  constructor() {
    this.issueForm = this.fb.group({
      roomId: ['', Validators.required],
      category: ['PLUMBING', Validators.required],
      priority: ['MEDIUM', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.opsService.getAllMaintenanceIssues().subscribe({
      next: (list) => {
        this.issues = list;
        this.roomService.getAllRooms().subscribe({
          next: (rms) => {
            this.rooms = rms;
            this.staffService.getAllStaff().subscribe({
              next: (staff) => {
                this.technicians = staff.filter(s => s.role === 'MAINTENANCE_STAFF' || s.role === 'STAFF');
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
        this.notify.error('Failed to load maintenance issues: ' + (err.error?.message || err.message));
      }
    });
  }

  submitIssue(): void {
    if (this.issueForm.invalid) return;
    this.submitting = true;
    this.opsService.createMaintenanceIssue(this.issueForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Maintenance defect ticket created');
        this.showNewModal = false;
        this.issueForm.reset({ category: 'PLUMBING', priority: 'MEDIUM' });
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Creation failed: ' + (err.error?.message || err.message));
      }
    });
  }

  openAssignModal(m: MaintenanceResponse): void {
    this.targetIssue = m;
    this.selectedStaffId = null;
    this.showAssignModal = true;
  }

  executeAssign(): void {
    if (!this.targetIssue || !this.selectedStaffId) return;
    this.submitting = true;
    this.opsService.assignMaintenance(this.targetIssue.id, { staffId: this.selectedStaffId }).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Technician assigned to work order');
        this.showAssignModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Assign failed: ' + (err.error?.message || err.message));
      }
    });
  }

  acceptIssue(m: MaintenanceResponse): void {
    this.opsService.acceptMaintenance(m.id).subscribe({
      next: () => {
        this.notify.success('Maintenance order accepted');
        this.loadData();
      },
      error: (err) => this.notify.error('Accept error: ' + (err.error?.message || err.message))
    });
  }

  startIssue(m: MaintenanceResponse): void {
    this.opsService.startMaintenance(m.id).subscribe({
      next: () => {
        this.notify.success('Repairs started');
        this.loadData();
      },
      error: (err) => this.notify.error('Start error: ' + (err.error?.message || err.message))
    });
  }

  openResolveModal(m: MaintenanceResponse): void {
    this.targetIssue = m;
    this.resolveCost = 0;
    this.resolveRemarks = 'Defect repaired and tested';
    this.showResolveModal = true;
  }

  executeResolve(): void {
    if (!this.targetIssue) return;
    this.submitting = true;
    this.opsService.resolveMaintenance(this.targetIssue.id, undefined, {
      repairCost: this.resolveCost,
      remarks: this.resolveRemarks
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Maintenance issue resolved');
        this.showResolveModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Resolution failed: ' + (err.error?.message || err.message));
      }
    });
  }

  verifyIssue(m: MaintenanceResponse): void {
    this.opsService.verifyMaintenance(m.id).subscribe({
      next: () => {
        this.notify.success('Maintenance verified & closed');
        this.loadData();
      },
      error: (err) => this.notify.error('Verify error: ' + (err.error?.message || err.message))
    });
  }
}
