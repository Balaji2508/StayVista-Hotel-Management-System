import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { PurchaseService } from '../../core/services/purchase.service';
import {
  OrderStatus,
  PurchaseOrderResponse,
  SupplierResponse,
  GoodsReceiptResponse
} from '../../core/models/purchase.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-purchase-orders',
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
    <div class="po-page">
      <app-page-header
        title="Purchase Orders & Goods Receipt (GRN)"
        subtitle="Issue official purchase orders to suppliers and record Goods Receipt Notes (GRN) to trigger inventory Stock IN via RabbitMQ"
      >
        <div class="header-actions">
          <a routerLink="/purchase/requests" class="btn btn-outline">Purchase Requests</a>
          <a routerLink="/inventory" class="btn btn-outline">Warehouse Inventory</a>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <app-icon name="plus" [size]="15"></app-icon>
            <span>Create Purchase Order</span>
          </button>
        </div>
      </app-page-header>

      <!-- Status Filters -->
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

      <!-- Purchase Orders Table -->
      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>PR Link</th>
                <th>Total Amount</th>
                <th>Delivery Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let po of purchaseOrders">
                <td><strong>{{ po.poNumber }}</strong></td>
                <td>
                  <strong>{{ po.supplierName || 'Supplier #' + po.supplierId }}</strong>
                </td>
                <td>
                  <span *ngIf="po.purchaseRequestId">PR #{{ po.purchaseRequestId }}</span>
                  <span *ngIf="!po.purchaseRequestId" class="text-muted">Direct</span>
                </td>
                <td><strong class="price">\${{ po.totalAmount | number:'1.2-2' }}</strong></td>
                <td>{{ po.deliveryDueDate || '-' }}</td>
                <td>
                  <app-status-badge [status]="po.status"></app-status-badge>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      *ngIf="po.status === 'DRAFT'"
                      class="btn btn-sm btn-success"
                      (click)="approvePO(po)"
                    >
                      Approve
                    </button>

                    <button
                      *ngIf="po.status === 'APPROVED'"
                      class="btn btn-sm btn-primary"
                      (click)="sendToSupplier(po)"
                    >
                      Send to Supplier
                    </button>

                    <!-- GRN Action: Triggers RabbitMQ event to Inventory! -->
                    <button
                      *ngIf="po.status === 'SENT_TO_SUPPLIER' || po.status === 'PARTIALLY_RECEIVED'"
                      class="btn btn-sm btn-warning"
                      (click)="openGRNModal(po)"
                    >
                      <app-icon name="package" [size]="14"></app-icon>
                      <span>Receive Goods (GRN)</span>
                    </button>

                    <button class="btn btn-sm btn-outline" (click)="viewReceipts(po)">
                      Receipts
                    </button>

                    <button
                      *ngIf="po.status === 'DRAFT' || po.status === 'APPROVED'"
                      class="btn btn-sm btn-danger"
                      (click)="cancelPO(po)"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="purchaseOrders.length === 0">
                <td colspan="7" class="text-center py-4">No purchase orders found in this category.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create PO Modal -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Issue Purchase Order</h3>
            <button class="close-btn" (click)="showCreateModal = false">&times;</button>
          </div>
          <form [formGroup]="poForm" (ngSubmit)="submitPO()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Supplier *</label>
                <select formControlName="supplierId" class="form-control">
                  <option value="" disabled>-- Select Supplier --</option>
                  <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }} ({{ s.supplierCode }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Associated Purchase Request ID (Optional)</label>
                <input type="number" formControlName="purchaseRequestId" class="form-control" placeholder="e.g. 1" />
              </div>

              <div class="form-group">
                <label>Delivery Due Date *</label>
                <input type="date" formControlName="deliveryDueDate" class="form-control" />
              </div>

              <div class="form-group">
                <label>PO Remarks</label>
                <textarea formControlName="remarks" class="form-control" rows="2" placeholder="Delivery instructions..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="poForm.invalid || submitting">
                {{ submitting ? 'Issuing...' : 'Create Purchase Order' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Goods Receipt (GRN) Modal: The rabbitMQ trigger! -->
      <div *ngIf="showGRNModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Record Goods Receipt (GRN)</h3>
            <button class="close-btn" (click)="showGRNModal = false">&times;</button>
          </div>
          <form [formGroup]="grnForm" (ngSubmit)="submitGRN()">
            <div class="modal-body">
              <div class="info-alert">
                <strong>RabbitMQ Event Integration:</strong> Recording this Goods Receipt will broadcast a message over RabbitMQ to the Inventory Service, automatically incrementing warehouse stock!
              </div>

              <p>Receiving for Order: <strong>{{ targetPO?.poNumber }}</strong> ({{ targetPO?.supplierName }})</p>

              <div class="form-row">
                <div class="form-group col">
                  <label>Total Received Qty *</label>
                  <input type="number" formControlName="receivedQuantity" class="form-control" min="1" (input)="onReceivedQtyChange()" />
                </div>
                <div class="form-group col">
                  <label>Accepted Qty *</label>
                  <input type="number" formControlName="acceptedQuantity" class="form-control" min="0" />
                </div>
                <div class="form-group col">
                  <label>Rejected Qty</label>
                  <input type="number" formControlName="rejectedQuantity" class="form-control" min="0" />
                </div>
              </div>

              <div class="form-group">
                <label>Supplier Delivery Note / Waybill #</label>
                <input type="text" formControlName="deliveryNoteNumber" class="form-control" placeholder="e.g. DN-90812" />
              </div>

              <div class="form-group">
                <label>Inspection Remarks</label>
                <textarea formControlName="inspectionRemarks" class="form-control" rows="2" placeholder="Quality checks passed, packaging intact..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showGRNModal = false">Cancel</button>
              <button type="submit" class="btn btn-warning" [disabled]="grnForm.invalid || submitting">
                {{ submitting ? 'Receiving...' : 'Confirm Goods Receipt & Stock IN' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Receipts History Modal -->
      <div *ngIf="showReceiptsModal" class="modal-backdrop">
        <div class="modal-dialog receipts-dialog">
          <div class="modal-header">
            <h3>Goods Receipt History: {{ targetPO?.poNumber }}</h3>
            <button class="close-btn" (click)="showReceiptsModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>GRN #</th>
                    <th>Received At</th>
                    <th>Received</th>
                    <th>Accepted</th>
                    <th>Rejected</th>
                    <th>Waybill</th>
                    <th>Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let grn of receipts">
                    <td><strong>{{ grn.grnNumber }}</strong></td>
                    <td>{{ grn.receivedAt | date:'short' }}</td>
                    <td>{{ grn.receivedQuantity }}</td>
                    <td><strong class="text-success">{{ grn.acceptedQuantity }}</strong></td>
                    <td><span class="text-danger">{{ grn.rejectedQuantity }}</span></td>
                    <td>{{ grn.deliveryNoteNumber || '-' }}</td>
                    <td>{{ grn.inspectionRemarks || '-' }}</td>
                  </tr>
                  <tr *ngIf="receipts.length === 0">
                    <td colspan="7" class="text-center py-3">No Goods Receipts logged yet for this order.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showReceiptsModal = false">Close</button>
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
    .price {
      color: var(--primary);
    }
    .action-buttons {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .info-alert {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 0.75rem;
      border-radius: var(--radius);
      font-size: 0.825rem;
      margin-bottom: 1rem;
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
    .receipts-dialog {
      max-width: 720px;
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
export class PurchaseOrdersComponent implements OnInit {
  private purchaseService = inject(PurchaseService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  purchaseOrders: PurchaseOrderResponse[] = [];
  suppliers: SupplierResponse[] = [];
  loading = false;
  submitting = false;
  selectedStatus = 'ALL';

  statuses = ['ALL', 'DRAFT', 'APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'];

  // Create PO
  showCreateModal = false;
  poForm: FormGroup;

  // GRN Modal
  showGRNModal = false;
  targetPO: PurchaseOrderResponse | null = null;
  grnForm: FormGroup;

  // Receipts History
  showReceiptsModal = false;
  receipts: GoodsReceiptResponse[] = [];

  constructor() {
    const due = new Date();
    due.setDate(due.getDate() + 7);

    this.poForm = this.fb.group({
      supplierId: ['', Validators.required],
      purchaseRequestId: [null],
      deliveryDueDate: [due.toISOString().split('T')[0], Validators.required],
      remarks: ['']
    });

    this.grnForm = this.fb.group({
      receivedQuantity: [10, [Validators.required, Validators.min(1)]],
      acceptedQuantity: [10, [Validators.required, Validators.min(0)]],
      rejectedQuantity: [0, [Validators.required, Validators.min(0)]],
      deliveryNoteNumber: [''],
      inspectionRemarks: ['Goods inspected and approved']
    });
  }

  ngOnInit(): void {
    const qPrId = this.route.snapshot.queryParamMap.get('prId');
    if (qPrId) {
      this.poForm.patchValue({ purchaseRequestId: Number(qPrId) });
      this.showCreateModal = true;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.purchaseService.getAllPurchaseOrders().subscribe({
      next: (pos) => {
        this.purchaseOrders = pos;
        this.purchaseService.getAllSuppliers('ACTIVE').subscribe({
          next: (sups) => {
            this.suppliers = sups;
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load purchase orders: ' + (err.error?.message || err.message));
      }
    });
  }

  filterByStatus(s: string): void {
    this.selectedStatus = s;
    if (s === 'ALL') {
      this.loadData();
    } else {
      this.purchaseService.getAllPurchaseOrders(s as OrderStatus).subscribe({
        next: (pos) => (this.purchaseOrders = pos)
      });
    }
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  submitPO(): void {
    if (this.poForm.invalid) return;
    this.submitting = true;
    this.purchaseService.createPurchaseOrder(this.poForm.value).subscribe({
      next: (po) => {
        this.submitting = false;
        this.notify.success(`Purchase Order ${po.poNumber} created!`);
        this.showCreateModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('PO Creation failed: ' + (err.error?.message || err.message));
      }
    });
  }

  approvePO(po: PurchaseOrderResponse): void {
    this.purchaseService.approvePurchaseOrder(po.id, { remarks: 'Approved' }).subscribe({
      next: () => {
        this.notify.success(`PO ${po.poNumber} approved`);
        this.loadData();
      },
      error: (err) => this.notify.error('Approval failed: ' + (err.error?.message || err.message))
    });
  }

  sendToSupplier(po: PurchaseOrderResponse): void {
    this.purchaseService.sendPurchaseOrder(po.id).subscribe({
      next: () => {
        this.notify.success(`PO ${po.poNumber} sent to supplier`);
        this.loadData();
      },
      error: (err) => this.notify.error('Failed to send PO: ' + (err.error?.message || err.message))
    });
  }

  cancelPO(po: PurchaseOrderResponse): void {
    this.purchaseService.cancelPurchaseOrder(po.id, 'Cancelled by user').subscribe({
      next: () => {
        this.notify.warning(`PO ${po.poNumber} cancelled`);
        this.loadData();
      },
      error: (err) => this.notify.error('Cancel failed: ' + (err.error?.message || err.message))
    });
  }

  openGRNModal(po: PurchaseOrderResponse): void {
    this.targetPO = po;
    this.grnForm.reset({
      receivedQuantity: 10,
      acceptedQuantity: 10,
      rejectedQuantity: 0,
      deliveryNoteNumber: 'DN-' + Math.floor(Math.random() * 90000 + 10000),
      inspectionRemarks: 'Passed quality check'
    });
    this.showGRNModal = true;
  }

  onReceivedQtyChange(): void {
    const rec = this.grnForm.get('receivedQuantity')?.value || 0;
    this.grnForm.patchValue({ acceptedQuantity: rec, rejectedQuantity: 0 });
  }

  submitGRN(): void {
    if (this.grnForm.invalid || !this.targetPO) return;
    this.submitting = true;
    const req = {
      purchaseOrderId: this.targetPO.id,
      ...this.grnForm.value
    };

    this.purchaseService.recordGoodsReceipt(req).subscribe({
      next: (grn) => {
        this.submitting = false;
        this.notify.success(`GRN ${grn.grnNumber} created! Inventory stock updated via RabbitMQ.`);
        this.showGRNModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Goods receipt recording failed: ' + (err.error?.message || err.message));
      }
    });
  }

  viewReceipts(po: PurchaseOrderResponse): void {
    this.targetPO = po;
    this.purchaseService.getGoodsReceiptsByPurchaseOrder(po.id).subscribe({
      next: (list) => {
        this.receipts = list;
        this.showReceiptsModal = true;
      },
      error: (err) => this.notify.error('Failed to load receipts: ' + (err.error?.message || err.message))
    });
  }
}
