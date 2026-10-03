import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { StaffService } from '../../core/services/staff.service';
import { StaffResponse, StaffRole } from '../../core/models/staff.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="staff-page">
      <app-page-header
        title="Staff Directory & Human Resources"
        subtitle="Manage hotel employees, assign roles and departments, track attendance and shifts"
      >
        <div class="header-nav">
          <a routerLink="/staff/attendance" class="btn btn-outline">Clock In & Attendance</a>
          <a routerLink="/staff/shifts" class="btn btn-outline">Shift Rosters</a>
          <a routerLink="/staff/leave" class="btn btn-outline">Leave Requests</a>
          <button class="btn btn-primary" (click)="openStaffModal()">+ Onboard New Staff</button>
        </div>
      </app-page-header>

      <!-- Filter Bar -->
      <div class="card filter-bar">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by name, employee code, or email..."
            class="form-control"
          />
        </div>
        <div class="role-filters">
          <button
            *ngFor="let r of roles"
            class="filter-pill"
            [class.active]="selectedRole === r"
            (click)="filterByRole(r)"
          >
            {{ r }}
          </button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Staff Grid -->
      <div *ngIf="!loading" class="staff-grid">
        <div *ngFor="let member of filteredStaff" class="card staff-card">
          <div class="card-top">
            <div class="avatar">{{ member.firstName.charAt(0) }}{{ member.lastName.charAt(0) }}</div>
            <div class="user-meta">
              <h4>{{ member.firstName }} {{ member.lastName }}</h4>
              <span class="emp-code">{{ member.employeeCode }}</span>
            </div>
            <span class="role-tag" [attr.data-role]="member.role">{{ member.role }}</span>
          </div>

          <div class="card-details">
            <div class="detail-item">
              <span class="label">Email:</span>
              <span class="value">{{ member.email }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Phone:</span>
              <span class="value">{{ member.phone }}</span>
            </div>
            <div class="detail-item" *ngIf="member.department">
              <span class="label">Department:</span>
              <span class="value font-bold">{{ member.department }}</span>
            </div>
            <div class="detail-item" *ngIf="member.salary">
              <span class="label">Salary:</span>
              <span class="value">\${{ member.salary | number:'1.2-2' }}/mo</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-sm btn-outline" (click)="openStaffModal(member)">Edit Profile</button>
            <button class="btn btn-sm btn-danger" (click)="confirmDelete(member)">Deactivate</button>
          </div>
        </div>

        <div *ngIf="filteredStaff.length === 0" class="col-span-all text-center py-4 card">
          <p>No staff members found matching criteria.</p>
        </div>
      </div>

      <!-- Add/Edit Staff Modal -->
      <div *ngIf="showStaffModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingStaff ? 'Edit Staff Member' : 'Onboard New Staff' }}</h3>
            <button class="close-btn" (click)="showStaffModal = false">&times;</button>
          </div>
          <form [formGroup]="staffForm" (ngSubmit)="saveStaff()">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group col">
                  <label>First Name *</label>
                  <input type="text" formControlName="firstName" class="form-control" />
                </div>
                <div class="form-group col">
                  <label>Last Name *</label>
                  <input type="text" formControlName="lastName" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Email *</label>
                  <input type="email" formControlName="email" class="form-control" />
                </div>
                <div class="form-group col">
                  <label>Phone *</label>
                  <input type="tel" formControlName="phone" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Role *</label>
                  <select formControlName="role" class="form-control">
                    <option *ngFor="let r of allStaffRoles" [value]="r">{{ r }}</option>
                  </select>
                </div>
                <div class="form-group col">
                  <label>Department</label>
                  <input type="text" formControlName="department" class="form-control" placeholder="Front Desk, Housekeeping, etc." />
                </div>
              </div>

              <div class="form-group">
                <label>Salary ($/month)</label>
                <input type="number" formControlName="salary" class="form-control" min="0" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showStaffModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="staffForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Save Staff' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Remove Staff"
        [message]="deleteMessage"
        (confirm)="executeDelete()"
        (cancel)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .header-nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-bar {
      padding: 1rem;
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .search-box {
      max-width: 420px;
    }
    .role-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
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
    .staff-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .staff-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card-top {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-light, #e0e7ff);
      color: var(--primary);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .user-meta {
      flex: 1;
    }
    .user-meta h4 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .emp-code {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .role-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      background: var(--bg-hover);
    }
    .card-details {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 0;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
    }
    .detail-item .label {
      color: var(--text-muted);
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
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
      max-width: 520px;
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
export class StaffListComponent implements OnInit {
  private staffService = inject(StaffService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  staff: StaffResponse[] = [];
  loading = false;
  submitting = false;
  searchQuery = '';
  selectedRole = 'ALL';

  roles = ['ALL', 'ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE_STAFF'];
  allStaffRoles: StaffRole[] = ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'STAFF', 'MAINTENANCE_STAFF'];

  showStaffModal = false;
  editingStaff: StaffResponse | null = null;
  staffForm: FormGroup;

  showDeleteModal = false;
  deleteMessage = '';
  selectedId: number | null = null;

  constructor() {
    this.staffForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      role: ['RECEPTIONIST', Validators.required],
      department: ['Front Office'],
      salary: [3000, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(role?: StaffRole): void {
    this.loading = true;
    this.staffService.getAllStaff(role).subscribe({
      next: (list) => {
        this.staff = list;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load staff list: ' + (err.error?.message || err.message));
      }
    });
  }

  filterByRole(r: string): void {
    this.selectedRole = r;
    if (r === 'ALL') {
      this.loadStaff();
    } else {
      this.loadStaff(r as StaffRole);
    }
  }

  get filteredStaff(): StaffResponse[] {
    return this.staff.filter((s) => {
      const q = this.searchQuery.toLowerCase().trim();
      return (
        !q ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.employeeCode.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }

  openStaffModal(member?: StaffResponse): void {
    if (member) {
      this.editingStaff = member;
      this.staffForm.patchValue({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        role: member.role,
        department: member.department,
        salary: member.salary
      });
      this.staffForm.get('email')?.disable();
    } else {
      this.editingStaff = null;
      this.staffForm.reset({
        role: 'RECEPTIONIST',
        department: 'Front Desk',
        salary: 3000
      });
      this.staffForm.get('email')?.enable();
    }
    this.showStaffModal = true;
  }

  saveStaff(): void {
    if (this.staffForm.invalid) return;
    this.submitting = true;
    const formVal = this.staffForm.getRawValue();

    if (this.editingStaff) {
      this.staffService.updateStaff(this.editingStaff.id, formVal).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Staff profile updated');
          this.showStaffModal = false;
          this.loadStaff();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Update failed: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.staffService.createStaff(formVal).subscribe({
        next: (created) => {
          this.submitting = false;
          this.notify.success(`Staff onboarded! Code: ${created.employeeCode}`);
          this.showStaffModal = false;
          this.loadStaff();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Failed to create staff: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  confirmDelete(member: StaffResponse): void {
    this.selectedId = member.id;
    this.deleteMessage = `Are you sure you want to deactivate ${member.firstName} ${member.lastName} (${member.employeeCode})?`;
    this.showDeleteModal = true;
  }

  executeDelete(): void {
    if (!this.selectedId) return;
    this.staffService.deleteStaff(this.selectedId).subscribe({
      next: () => {
        this.notify.success('Staff member deactivated');
        this.showDeleteModal = false;
        this.loadStaff();
      },
      error: (err) => {
        this.showDeleteModal = false;
        this.notify.error('Deactivation failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
