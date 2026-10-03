import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { PurchaseService } from '../../core/services/purchase.service';
import { InventoryService } from '../../core/services/inventory.service';
import {
  PurchaseRequestResponse,
  RequestStatus,
  SupplierQuotationResponse,
  SupplierResponse
} from '../../core/models/purchase.models';
import { ItemResponse } from '../../core/models/inventory.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-purchase-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    IconComponent
  ],
  template: `
    <div class="pr-page">
      <app-page-header
        title="Purchase Requests & Quotations"
        subtitle="Manage procurement requests for hotel inventory replenishment and compare vendor quotations"
      >
        <div class="header-actions">
          <a routerLink="/purchase/orders" class="btn btn-outline">Purchase Orders</a>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <app-icon name="plus" [size]="15"></app-icon>
            <span>Create Purchase Request</span>
          </button>
        </div>
      </app-page-header>

      <!-- Status Filter Bar -->
      <div class="card filter-bar">
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

      <!-- PRs List -->
      <div *ngIf="!loading" class="pr-grid">
        <div *ngFor="let pr of purchaseRequests" class="card pr-card">
          <div class="pr-header">
            <div>
              <h3>{{ pr.prNumber }}</h3>
              <span class="priority-tag" [attr.data-priority]="pr.priority">{{ pr.priority }} PRIORITY</span>
            </div>
            <app-status-badge [status]="pr.status"></app-status-badge>
          </div>

          <div class="justification-block">
            <strong>Justification:</strong>
            <p>{{ pr.justification }}</p>
          </div>

          <div class="items-summary">
            <h5>Requested Items:</h5>
            <ul>
              <li *ngFor="let itm of pr.items">
                <span>{{ itm.itemName || 'Item #' + itm.itemId }}</span>
                <strong>{{ itm.requestedQuantity }} qty</strong>
                <span class="cost" *ngIf="itm.estimatedTotalCost">(\${{ itm.estimatedTotalCost | number:'1.2-2' }})</span>
              </li>
            </ul>
          </div>

          <div class="pr-footer">
            <span class="total-cost" *ngIf="pr.totalEstimatedCost">
              Est: \${{ pr.totalEstimatedCost | number:'1.2-2' }}
            </span>
            <div class="pr-actions">
              <!-- Quotations Management Button -->
              <button class="btn btn-sm btn-outline" (click)="openQuotesModal(pr)">
                Quotes & Bids
              </button>

              <!-- Manager Approval Actions -->
              <button
                *ngIf="pr.status === 'SUBMITTED'"
                class="btn btn-sm btn-success"
                (click)="approvePR(pr)"
              >
                Approve
              </button>
              <button
                *ngIf="pr.status === 'SUBMITTED'"
                class="btn btn-sm btn-danger"
                (click)="promptReject(pr)"
              >
                Reject
              </button>

              <!-- Convert to PO -->
              <a
                *ngIf="pr.status === 'APPROVED'"
                [routerLink]="['/purchase/orders']"
                [queryParams]="{ prId: pr.id }"
                class="btn btn-sm btn-primary"
              >
                <span>Create PO</span>
                <app-icon name="arrow-right" [size]="14"></app-icon>
              </a>
            </div>
          </div>
        </div>

        <div *ngIf="purchaseRequests.length === 0" class="col-span-all text-center py-4 card">
          <p>No purchase requests found in this category.</p>
        </div>
      </div>

      <!-- Create PR Modal -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-dialog pr-dialog">
          <div class="modal-header">
            <h3>New Procurement Request</h3>
            <button class="close-btn" (click)="showCreateModal = false">&times;</button>
          </div>
          <form [formGroup]="prForm" (ngSubmit)="submitPR()">
            <div class="modal-body">
              <div class="form-row">
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
                <label>Operational Justification *</label>
                <textarea formControlName="justification" class="form-control" rows="2" placeholder="e.g. Stock fell below critical threshold..."></textarea>
              </div>

              <!-- Items Array -->
              <div class="items-section">
                <div class="section-title-row">
                  <h4>Requested Items</h4>
                  <button type="button" class="btn btn-sm btn-outline" (click)="addItemRow()">+ Add Item</button>
                </div>

                <div formArrayName="items" class="items-rows">
                  <div *ngFor="let itemGroup of itemsFormArray.controls; let idx = index" [formGroupName]="idx" class="item-row">
                    <div class="form-group col-item">
                      <label>Inventory Item *</label>
                      <select formControlName="itemId" class="form-control">
                        <option value="" disabled>-- Select Item --</option>
                        <option *ngFor="let inv of inventoryItems" [value]="inv.id">
                          {{ inv.name }} (Stock: {{ inv.currentStock }} {{ inv.unit }})
                        </option>
                      </select>
                    </div>

                    <div class="form-group col-qty">
                      <label>Quantity *</label>
                      <input type="number" formControlName="requestedQuantity" class="form-control" min="1" />
                    </div>

                    <div class="form-group col-cost">
                      <label>Est. Unit Cost ($)</label>
                      <input type="number" formControlName="estimatedUnitCost" class="form-control" min="0" step="0.01" />
                    </div>

                    <button type="button" class="remove-row-btn" (click)="removeItemRow(idx)" *ngIf="itemsFormArray.length > 1">
                      &times;
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="prForm.invalid || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Request' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Quotes Modal -->
      <div *ngIf="showQuotesModal" class="modal-backdrop">
        <div class="modal-dialog quotes-dialog">
          <div class="modal-header">
            <h3>Supplier Quotations: {{ targetPR?.prNumber }}</h3>
            <button class="close-btn" (click)="showQuotesModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Existing Quotations Table -->
            <div class="table-container mb-3">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Supplier</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Lead Days</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let q of quotations">
                    <td><code>{{ q.quotationNumber }}</code></td>
                    <td><strong>{{ q.supplierName || 'Supplier #' + q.supplierId }}</strong></td>
                    <td>\${{ q.unitPrice | number:'1.2-2' }}</td>
                    <td><strong class="text-success">\${{ q.totalPrice | number:'1.2-2' }}</strong></td>
                    <td>{{ q.deliveryLeadDays }} days</td>
                    <td>{{ q.validityDate }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="q.selected" [class.badge-secondary]="!q.selected">
                        {{ q.selected ? 'SELECTED' : 'Received' }}
                      </span>
                    </td>
                    <td>
                      <button
                        *ngIf="!q.selected"
                        class="btn btn-sm btn-outline-success"
                        (click)="selectWinningQuote(q)"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="quotations.length === 0">
                    <td colspan="8" class="text-center py-3">No supplier quotations entered for this PR yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Form to Add Quotation -->
            <div class="card add-quote-box">
              <h4>+ Record Supplier Quotation</h4>
              <form [formGroup]="quoteForm" (ngSubmit)="submitQuotation()">
                <div class="form-row">
                  <div class="form-group col">
                    <label>Supplier *</label>
                    <select formControlName="supplierId" class="form-control">
                      <option value="" disabled>Select Supplier</option>
                      <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</option>
                    </select>
                  </div>
                  <div class="form-group col">
                    <label>Offered Unit Price ($) *</label>
                    <input type="number" formControlName="unitPrice" class="form-control" min="0.01" step="0.01" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group col">
                    <label>Delivery Lead Days *</label>
                    <input type="number" formControlName="deliveryLeadDays" class="form-control" min="1" />
                  </div>
                  <div class="form-group col">
                    <label>Quote Validity Date *</label>
                    <input type="date" formControlName="validityDate" class="form-control" />
                  </div>
                </div>

                <button type="submit" class="btn btn-sm btn-primary mt-2" [disabled]="quoteForm.invalid || submittingQuote">
                  {{ submittingQuote ? 'Saving...' : 'Add Quotation' }}
                </button>
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showQuotesModal = false">Close</button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div *ngIf="showRejectModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Reject Purchase Request</h3>
            <button class="close-btn" (click)="showRejectModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Rejection Reason *</label>
              <textarea [(ngModel)]="rejectReason" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showRejectModal = false">Cancel</button>
            <button class="btn btn-danger" (click)="executeReject()" [disabled]="!rejectReason">Confirm Reject</button>
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
    .pr-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.25rem;
    }
    .col-span-all {
      grid-column: 1 / -1;
    }
    .pr-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .pr-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .pr-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .priority-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #b45309;
    }
    .priority-tag[data-priority="URGENT"], .priority-tag[data-priority="HIGH"] {
      color: var(--danger);
    }
    .justification-block {
      font-size: 0.85rem;
    }
    .justification-block strong {
      display: block;
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .items-summary {
      font-size: 0.85rem;
      background: var(--bg-hover);
      padding: 0.75rem;
      border-radius: var(--radius);
    }
    .items-summary h5 {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .items-summary ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .items-summary li {
      display: flex;
      justify-content: space-between;
    }
    .pr-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
    }
    .total-cost {
      font-weight: 700;
      color: var(--primary);
    }
    .pr-actions {
      display: flex;
      gap: 0.35rem;
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
    .pr-dialog, .quotes-dialog {
      max-width: 750px;
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
      max-height: 75vh;
      overflow-y: auto;
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
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .item-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
      margin-bottom: 0.5rem;
    }
    .col-item {
      flex: 3;
    }
    .col-qty {
      flex: 1;
    }
    .col-cost {
      flex: 1;
    }
    .remove-row-btn {
      background: none;
      border: none;
      font-size: 1.4rem;
      color: var(--danger);
      cursor: pointer;
      padding-bottom: 0.5rem;
    }
    .btn-outline-success {
      border: 1px solid var(--success);
      color: var(--success);
      background: transparent;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-outline-success:hover {
      background: var(--success);
      color: white;
    }
    .add-quote-box {
      padding: 1rem;
    }
    .add-quote-box h4 {
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
    }
  `]
})
export class PurchaseRequestsComponent implements OnInit {
  private purchaseService = inject(PurchaseService);
  private inventoryService = inject(InventoryService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  purchaseRequests: PurchaseRequestResponse[] = [];
  inventoryItems: ItemResponse[] = [];
  suppliers: SupplierResponse[] = [];
  loading = false;
  submitting = false;
  selectedStatus = 'ALL';

  statuses = ['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ORDERED'];

  // Create PR Modal
  showCreateModal = false;
  prForm: FormGroup;

  // Quotes Modal
  showQuotesModal = false;
  targetPR: PurchaseRequestResponse | null = null;
  quotations: SupplierQuotationResponse[] = [];
  quoteForm: FormGroup;
  submittingQuote = false;

  // Reject Modal
  showRejectModal = false;
  targetPRToReject: PurchaseRequestResponse | null = null;
  rejectReason = '';

  constructor() {
    this.prForm = this.fb.group({
      priority: ['MEDIUM', Validators.required],
      justification: ['', Validators.required],
      items: this.fb.array([])
    });

    const validity = new Date();
    validity.setDate(validity.getDate() + 14);

    this.quoteForm = this.fb.group({
      supplierId: ['', Validators.required],
      unitPrice: [10, [Validators.required, Validators.min(0.01)]],
      deliveryLeadDays: [7, [Validators.required, Validators.min(1)]],
      validityDate: [validity.toISOString().split('T')[0], Validators.required]
    });
  }

  get itemsFormArray(): FormArray {
    return this.prForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.purchaseService.getAllPurchaseRequests().subscribe({
      next: (prs) => {
        this.purchaseRequests = prs;
        this.inventoryService.getAllItems().subscribe({
          next: (items) => {
            this.inventoryItems = items;
            this.purchaseService.getAllSuppliers('ACTIVE').subscribe({
              next: (sups) => {
                this.suppliers = sups;
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
        this.notify.error('Failed to load purchase requests: ' + (err.error?.message || err.message));
      }
    });
  }

  filterByStatus(s: string): void {
    this.selectedStatus = s;
    if (s === 'ALL') {
      this.loadData();
    } else {
      this.purchaseService.getAllPurchaseRequests(s as RequestStatus).subscribe({
        next: (prs) => (this.purchaseRequests = prs)
      });
    }
  }

  openCreateModal(): void {
    this.prForm.reset({ priority: 'MEDIUM', justification: '' });
    this.itemsFormArray.clear();
    this.addItemRow();
    this.showCreateModal = true;
  }

  addItemRow(): void {
    this.itemsFormArray.push(
      this.fb.group({
        itemId: ['', Validators.required],
        requestedQuantity: [10, [Validators.required, Validators.min(1)]],
        estimatedUnitCost: [0]
      })
    );
  }

  removeItemRow(index: number): void {
    this.itemsFormArray.removeAt(index);
  }

  submitPR(): void {
    if (this.prForm.invalid) return;
    this.submitting = true;
    this.purchaseService.createPurchaseRequest(this.prForm.value).subscribe({
      next: (res) => {
        this.submitting = false;
        this.notify.success(`Purchase Request ${res.prNumber} submitted!`);
        this.showCreateModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Submission failed: ' + (err.error?.message || err.message));
      }
    });
  }

  approvePR(pr: PurchaseRequestResponse): void {
    this.purchaseService.approvePurchaseRequest(pr.id, { remarks: 'Approved by manager' }).subscribe({
      next: () => {
        this.notify.success(`PR ${pr.prNumber} approved`);
        this.loadData();
      },
      error: (err) => this.notify.error('Approval failed: ' + (err.error?.message || err.message))
    });
  }

  promptReject(pr: PurchaseRequestResponse): void {
    this.targetPRToReject = pr;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  executeReject(): void {
    if (!this.targetPRToReject || !this.rejectReason) return;
    this.purchaseService.rejectPurchaseRequest(this.targetPRToReject.id, {
      rejectionReason: this.rejectReason
    }).subscribe({
      next: () => {
        this.notify.warning(`PR ${this.targetPRToReject?.prNumber} rejected`);
        this.showRejectModal = false;
        this.loadData();
      },
      error: (err) => this.notify.error('Rejection failed: ' + (err.error?.message || err.message))
    });
  }

  openQuotesModal(pr: PurchaseRequestResponse): void {
    this.targetPR = pr;
    this.quoteForm.reset({
      supplierId: this.suppliers.length > 0 ? this.suppliers[0].id : '',
      unitPrice: 10,
      deliveryLeadDays: 7,
      validityDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    });
    this.loadQuotations(pr.id);
    this.showQuotesModal = true;
  }

  loadQuotations(prId: number): void {
    this.purchaseService.getQuotationsByPurchaseRequest(prId).subscribe({
      next: (qs) => (this.quotations = qs),
      error: () => (this.quotations = [])
    });
  }

  submitQuotation(): void {
    if (this.quoteForm.invalid || !this.targetPR) return;
    this.submittingQuote = true;
    const req = {
      purchaseRequestId: this.targetPR.id,
      ...this.quoteForm.value
    };

    this.purchaseService.createQuotation(req).subscribe({
      next: () => {
        this.submittingQuote = false;
        this.notify.success('Supplier quotation recorded');
        this.loadQuotations(this.targetPR!.id);
      },
      error: (err) => {
        this.submittingQuote = false;
        this.notify.error('Quotation error: ' + (err.error?.message || err.message));
      }
    });
  }

  selectWinningQuote(q: SupplierQuotationResponse): void {
    this.purchaseService.selectQuotation(q.id).subscribe({
      next: () => {
        this.notify.success('Quotation selected for order!');
        if (this.targetPR) {
          this.loadQuotations(this.targetPR.id);
        }
      },
      error: (err) => this.notify.error('Selection failed: ' + (err.error?.message || err.message))
    });
  }
}
