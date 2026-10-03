import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { PurchaseService } from '../../core/services/purchase.service';
import { SupplierResponse, SupplierStatus } from '../../core/models/purchase.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-suppliers',
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
    <div class="suppliers-page">
      <app-page-header
        title="Supplier & Vendor Directory"
        subtitle="Manage verified hotel suppliers, payment terms, and vendor quotation contacts"
      >
        <div class="header-actions">
          <a routerLink="/purchase/requests" class="btn btn-outline">Purchase Requests</a>
          <a routerLink="/purchase/orders" class="btn btn-outline">Purchase Orders</a>
          <button class="btn btn-primary" (click)="openSupplierModal()">+ Register Supplier</button>
        </div>
      </app-page-header>

      <!-- Filter Bar -->
      <div class="card filter-bar">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by vendor name, contact person, or code..."
            class="form-control"
          />
        </div>
        <div class="status-filters">
          <button
            *ngFor="let s of statuses"
            class="filter-pill"
            [class.active]="selectedStatus === s"
            (click)="filterByStatus(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Suppliers Table -->
      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Email / Phone</th>
                <th>Payment Terms</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sup of filteredSuppliers">
                <td><code>{{ sup.supplierCode }}</code></td>
                <td><strong>{{ sup.name }}</strong></td>
                <td>{{ sup.contactPerson }}</td>
                <td>
                  <div>{{ sup.email }}</div>
                  <div class="sub-text">{{ sup.phone }}</div>
                </td>
                <td>{{ sup.paymentTerms || 'Net 30' }}</td>
                <td>
                  <span class="rating-stars">⭐ {{ sup.rating ? (sup.rating | number:'1.1-1') : '4.5' }}</span>
                </td>
                <td>
                  <span
                    class="badge"
                    [class.badge-success]="sup.status === 'ACTIVE'"
                    [class.badge-secondary]="sup.status === 'INACTIVE'"
                    [class.badge-danger]="sup.status === 'BLACKLISTED'"
                  >
                    {{ sup.status }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline" (click)="openSupplierModal(sup)">Edit</button>
                  <button class="btn btn-sm btn-danger ml-1" (click)="confirmDelete(sup)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="filteredSuppliers.length === 0">
                <td colspan="8" class="text-center py-4">No suppliers found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Supplier Modal -->
      <div *ngIf="showSupplierModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingSupplier ? 'Edit Supplier' : 'Register New Vendor' }}</h3>
            <button class="close-btn" (click)="showSupplierModal = false">&times;</button>
          </div>
          <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
            <div class="modal-body">
              <div class="form-group">
                <label>Company / Supplier Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. Apex Linens Corp" />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Contact Person *</label>
                  <input type="text" formControlName="contactPerson" class="form-control" />
                </div>
                <div class="form-group col">
                  <label>Phone *</label>
                  <input type="tel" formControlName="phone" class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label>Email *</label>
                <input type="email" formControlName="email" class="form-control" />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Payment Terms</label>
                  <input type="text" formControlName="paymentTerms" class="form-control" placeholder="e.g. Net 30, Cash on Delivery" />
                </div>
                <div class="form-group col">
                  <label>Tax / VAT Number</label>
                  <input type="text" formControlName="taxNumber" class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label>Office Address</label>
                <textarea formControlName="address" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showSupplierModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="supplierForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Save Supplier' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Delete Supplier"
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
    .status-filters {
      display: flex;
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
    .rating-stars {
      font-weight: 600;
      color: #b45309;
    }
    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .ml-1 {
      margin-left: 0.35rem;
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
      max-width: 500px;
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
export class SuppliersComponent implements OnInit {
  private purchaseService = inject(PurchaseService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  suppliers: SupplierResponse[] = [];
  loading = false;
  submitting = false;
  searchQuery = '';
  selectedStatus = 'ALL';

  statuses = ['ALL', 'ACTIVE', 'INACTIVE', 'BLACKLISTED'];

  showSupplierModal = false;
  editingSupplier: SupplierResponse | null = null;
  supplierForm: FormGroup;

  showDeleteModal = false;
  deleteMessage = '';
  selectedId: number | null = null;

  constructor() {
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      paymentTerms: ['Net 30'],
      taxNumber: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(status?: SupplierStatus): void {
    this.loading = true;
    this.purchaseService.getAllSuppliers(status).subscribe({
      next: (list) => {
        this.suppliers = list;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load suppliers: ' + (err.error?.message || err.message));
      }
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    if (status === 'ALL') {
      this.loadSuppliers();
    } else {
      this.loadSuppliers(status as SupplierStatus);
    }
  }

  get filteredSuppliers(): SupplierResponse[] {
    return this.suppliers.filter((s) => {
      const q = this.searchQuery.toLowerCase().trim();
      return (
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.supplierCode.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q)
      );
    });
  }

  openSupplierModal(s?: SupplierResponse): void {
    if (s) {
      this.editingSupplier = s;
      this.supplierForm.patchValue({
        name: s.name,
        contactPerson: s.contactPerson,
        email: s.email,
        phone: s.phone,
        paymentTerms: s.paymentTerms,
        taxNumber: s.taxNumber,
        address: s.address
      });
    } else {
      this.editingSupplier = null;
      this.supplierForm.reset({
        paymentTerms: 'Net 30'
      });
    }
    this.showSupplierModal = true;
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) return;
    this.submitting = true;
    const req = this.supplierForm.value;

    if (this.editingSupplier) {
      this.purchaseService.updateSupplier(this.editingSupplier.id, req).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Supplier updated');
          this.showSupplierModal = false;
          this.loadSuppliers();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Update failed: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.purchaseService.createSupplier(req).subscribe({
        next: (created) => {
          this.submitting = false;
          this.notify.success(`Supplier registered! Code: ${created.supplierCode}`);
          this.showSupplierModal = false;
          this.loadSuppliers();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Creation failed: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  confirmDelete(s: SupplierResponse): void {
    this.selectedId = s.id;
    this.deleteMessage = `Are you sure you want to remove supplier "${s.name}" (${s.supplierCode})?`;
    this.showDeleteModal = true;
  }

  executeDelete(): void {
    if (!this.selectedId) return;
    this.purchaseService.deleteSupplier(this.selectedId).subscribe({
      next: () => {
        this.notify.success('Supplier deleted');
        this.showDeleteModal = false;
        this.loadSuppliers();
      },
      error: (err) => {
        this.showDeleteModal = false;
        this.notify.error('Delete failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
