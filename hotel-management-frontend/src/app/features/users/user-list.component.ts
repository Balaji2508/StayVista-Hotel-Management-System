import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UserResponse, Role } from '../../core/models/auth.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="users-page">
      <app-page-header
        title="System User Accounts & Security"
        subtitle="Manage credentials, assign system roles, unlock accounts, and toggle user active states"
      >
        <button class="btn btn-primary" (click)="openCreateModal()">+ Create User</button>
      </app-page-header>

      <!-- Role Filter Bar -->
      <div class="card filter-bar">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by username or email..."
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

      <!-- Users Table -->
      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Lock State</th>
                <th>Failed Logins</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers">
                <td>#{{ u.id }}</td>
                <td><strong>{{ u.username }}</strong></td>
                <td>{{ u.email }}</td>
                <td>
                  <span class="role-badge" [attr.data-role]="u.role">{{ u.role }}</span>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="u.active" [class.badge-secondary]="!u.active">
                    {{ u.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class.badge-danger]="u.locked" [class.badge-success]="!u.locked">
                    {{ u.locked ? 'LOCKED' : 'Unlocked' }}
                  </span>
                </td>
                <td>{{ u.failedLoginAttempts || 0 }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      *ngIf="u.locked"
                      class="btn btn-sm btn-outline-success"
                      (click)="unlockUser(u)"
                      title="Unlock Account"
                    >
                      Unlock
                    </button>
                    <button
                      class="btn btn-sm btn-outline"
                      (click)="toggleStatus(u)"
                    >
                      {{ u.active ? 'Deactivate' : 'Activate' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredUsers.length === 0">
                <td colspan="8" class="text-center py-4">No users found matching criteria.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create User Modal -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Create System User</h3>
            <button class="close-btn" (click)="showCreateModal = false">&times;</button>
          </div>
          <form [formGroup]="userForm" (ngSubmit)="submitUser()">
            <div class="modal-body">
              <div class="form-group">
                <label>Username *</label>
                <input type="text" formControlName="username" class="form-control" />
              </div>

              <div class="form-group">
                <label>Email *</label>
                <input type="email" formControlName="email" class="form-control" />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Password *</label>
                  <input type="password" formControlName="password" class="form-control" />
                </div>
                <div class="form-group col">
                  <label>Role *</label>
                  <select formControlName="role" class="form-control">
                    <option *ngFor="let r of systemRoles" [value]="r">{{ r }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || submitting">
                {{ submitting ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      padding: 1rem;
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .search-box {
      max-width: 400px;
    }
    .role-filters {
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
    .role-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background: var(--bg-hover);
    }
    .action-buttons {
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
export class UserListComponent implements OnInit {
  private authService = inject(AuthService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  users: UserResponse[] = [];
  loading = false;
  submitting = false;
  searchQuery = '';
  selectedRole = 'ALL';

  roles = ['ALL', 'ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'GUEST'];
  systemRoles: Role[] = ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'GUEST'];

  showCreateModal = false;
  userForm: FormGroup;

  constructor() {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['RECEPTIONIST', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(role?: Role): void {
    this.loading = true;
    this.authService.getAllUsers(role).subscribe({
      next: (list) => {
        this.users = list;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load users: ' + (err.error?.message || err.message));
      }
    });
  }

  filterByRole(r: string): void {
    this.selectedRole = r;
    if (r === 'ALL') {
      this.loadUsers();
    } else {
      this.loadUsers(r as Role);
    }
  }

  get filteredUsers(): UserResponse[] {
    return this.users.filter((u) => {
      const q = this.searchQuery.toLowerCase().trim();
      return !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }

  openCreateModal(): void {
    this.userForm.reset({ role: 'RECEPTIONIST' });
    this.showCreateModal = true;
  }

  submitUser(): void {
    if (this.userForm.invalid) return;
    this.submitting = true;
    this.authService.createUser(this.userForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('User account created');
        this.showCreateModal = false;
        this.loadUsers();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Creation failed: ' + (err.error?.message || err.message));
      }
    });
  }

  unlockUser(u: UserResponse): void {
    this.authService.unlockUser(u.id).subscribe({
      next: () => {
        this.notify.success(`Account unlocked for ${u.username}`);
        this.loadUsers();
      },
      error: (err) => this.notify.error('Unlock failed: ' + (err.error?.message || err.message))
    });
  }

  toggleStatus(u: UserResponse): void {
    this.authService.setUserActiveStatus(u.id, !u.active).subscribe({
      next: () => {
        this.notify.success(`User status updated`);
        this.loadUsers();
      },
      error: (err) => this.notify.error('Update failed: ' + (err.error?.message || err.message))
    });
  }
}
