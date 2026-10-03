import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { GuestService } from '../../core/services/guest.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { GuestResponse } from '../../core/models/guest.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent,
    HasRoleDirective,
    IconComponent
  ],
  template: `
    <div class="content-wrapper">
      <app-page-header
        title="Guest Management"
        subtitle="Manage hotel guest profiles, member codes, and contact records"
      >
        <button class="btn btn-primary" (click)="openCreateModal()">
          <app-icon name="plus" [size]="15"></app-icon>
          <span>Add New Guest</span>
        </button>
      </app-page-header>

      <!-- Filter / Search Bar -->
      <div class="card" style="padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
        <div class="filter-bar" style="margin-bottom: 0;">
          <div class="filter-group" style="flex: 1; max-width: 400px;">
            <input
              type="text"
              class="form-control"
              placeholder="Search by name, email, or member code..."
              [(ngModel)]="searchQuery"
            />
          </div>
          <span class="text-muted" style="font-size: 0.8125rem;">
            Total Guests: <strong>{{ filteredGuests.length }}</strong>
          </span>
        </div>
      </div>

      <app-loading-spinner *ngIf="isLoading" message="Loading guest profiles..."></app-loading-spinner>

      <!-- Guest Table -->
      <div class="card" *ngIf="!isLoading" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member Code</th>
                <th>Guest Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Gender</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let guest of filteredGuests">
                <td>
                  <span class="member-badge">{{ guest.memberCode }}</span>
                </td>
                <td>
                  <strong>{{ guest.firstName }} {{ guest.lastName }}</strong>
                </td>
                <td>{{ guest.email }}</td>
                <td>{{ guest.phone }}</td>
                <td>{{ guest.company || '-' }}</td>
                <td>{{ guest.gender || '-' }}</td>
                <td style="text-align: right;">
                  <button class="btn btn-sm btn-secondary" (click)="openEditModal(guest)" style="margin-right: 0.5rem;">
                    Edit
                  </button>
                  <button
                    *hasRole="['ADMIN', 'OWNER']"
                    class="btn btn-sm btn-danger"
                    (click)="confirmDelete(guest)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredGuests.length === 0">
                <td colspan="7">
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      <app-icon name="users" [size]="36" color="#94a3b8"></app-icon>
                    </div>
                    <p class="empty-state-text">No guest records match your search.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingGuest ? 'Edit Guest Profile' : 'Register New Guest' }}</h3>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="guestForm" (ngSubmit)="saveGuest()">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label for="firstName">First Name *</label>
                  <input id="firstName" type="text" class="form-control" formControlName="firstName" />
                  <span *ngIf="guestForm.get('firstName')?.touched && guestForm.get('firstName')?.invalid" class="form-error">
                    First name is required.
                  </span>
                </div>

                <div class="form-group">
                  <label for="lastName">Last Name *</label>
                  <input id="lastName" type="text" class="form-control" formControlName="lastName" />
                  <span *ngIf="guestForm.get('lastName')?.touched && guestForm.get('lastName')?.invalid" class="form-error">
                    Last name is required.
                  </span>
                </div>

                <div class="form-group">
                  <label for="email">Email Address *</label>
                  <input id="email" type="email" class="form-control" formControlName="email" />
                  <span *ngIf="guestForm.get('email')?.touched && guestForm.get('email')?.invalid" class="form-error">
                    Valid email is required.
                  </span>
                </div>

                <div class="form-group">
                  <label for="phone">Phone Number *</label>
                  <input id="phone" type="text" class="form-control" formControlName="phone" placeholder="+1-555-0100" />
                  <span *ngIf="guestForm.get('phone')?.touched && guestForm.get('phone')?.invalid" class="form-error">
                    Valid phone number is required.
                  </span>
                </div>

                <div class="form-group">
                  <label for="company">Company</label>
                  <input id="company" type="text" class="form-control" formControlName="company" />
                </div>

                <div class="form-group">
                  <label for="gender">Gender</label>
                  <select id="gender" class="form-control" formControlName="gender">
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div class="form-group full-width">
                  <label for="address">Address</label>
                  <textarea id="address" class="form-control" formControlName="address" rows="2"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="guestForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : (editingGuest ? 'Update Guest' : 'Create Guest') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Delete Guest Profile"
        [message]="'Are you sure you want to delete profile for ' + (guestToDelete?.firstName || '') + ' ' + (guestToDelete?.lastName || '') + '? This action cannot be undone.'"
        confirmText="Delete Guest"
        [isDanger]="true"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .member-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-box {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
  `]
})
export class GuestListComponent implements OnInit {
  private guestService = inject(GuestService);
  public authService = inject(AuthService);
  private notificationService = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  guests: GuestResponse[] = [];
  searchQuery = '';
  isLoading = true;
  isSaving = false;

  showModal = false;
  editingGuest: GuestResponse | null = null;

  showDeleteModal = false;
  guestToDelete: GuestResponse | null = null;

  guestForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[+0-9\- ]{7,20}$/)]],
    company: [''],
    gender: [''],
    address: ['']
  });

  get filteredGuests(): GuestResponse[] {
    if (!this.searchQuery.trim()) return this.guests;
    const q = this.searchQuery.toLowerCase();
    return this.guests.filter(g =>
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.memberCode.toLowerCase().includes(q) ||
      g.phone.includes(q)
    );
  }

  ngOnInit(): void {
    this.loadGuests();
  }

  loadGuests(): void {
    this.isLoading = true;
    this.guestService.getAllGuests().subscribe({
      next: (data) => {
        this.guests = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  openCreateModal(): void {
    this.editingGuest = null;
    this.guestForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      gender: '',
      address: ''
    });
    this.showModal = true;
  }

  openEditModal(guest: GuestResponse): void {
    this.editingGuest = guest;
    this.guestForm.patchValue({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      company: guest.company || '',
      gender: guest.gender || '',
      address: guest.address || ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingGuest = null;
  }

  saveGuest(): void {
    if (this.guestForm.invalid) return;

    this.isSaving = true;
    const formVal = this.guestForm.value;

    if (this.editingGuest) {
      this.guestService.updateGuest(this.editingGuest.id, {
        firstName: formVal.firstName!,
        lastName: formVal.lastName!,
        phone: formVal.phone!,
        email: formVal.email!,
        company: formVal.company || undefined,
        gender: formVal.gender || undefined,
        address: formVal.address || undefined
      }).subscribe({
        next: (updated) => {
          this.isSaving = false;
          this.notificationService.success(`Guest ${updated.firstName} ${updated.lastName} updated successfully.`);
          this.closeModal();
          this.loadGuests();
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.guestService.createGuest({
        firstName: formVal.firstName!,
        lastName: formVal.lastName!,
        phone: formVal.phone!,
        email: formVal.email!,
        company: formVal.company || undefined,
        gender: formVal.gender || undefined,
        address: formVal.address || undefined
      }).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.notificationService.success(`Guest registered! Member Code: ${created.memberCode}`);
          this.closeModal();
          this.loadGuests();
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  confirmDelete(guest: GuestResponse): void {
    this.guestToDelete = guest;
    this.showDeleteModal = true;
  }

  deleteConfirmed(): void {
    if (!this.guestToDelete) return;
    this.guestService.deleteGuest(this.guestToDelete.id).subscribe({
      next: () => {
        this.notificationService.success('Guest profile deleted successfully.');
        this.showDeleteModal = false;
        this.guestToDelete = null;
        this.loadGuests();
      }
    });
  }
}
