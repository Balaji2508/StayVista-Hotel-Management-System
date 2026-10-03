import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { BillingService } from '../../core/services/billing.service';
import { ReservationService } from '../../core/services/reservation.service';
import { BillResponse, PrintBillResponse } from '../../core/models/billing.models';
import { ReservationResponse } from '../../core/models/reservation.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-bill-detail',
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
    <div class="billing-page">
      <app-page-header
        title="Billing & Guest Folio"
        subtitle="Manage itemized folio charges, taxes, discounts, checkout finalization, and official invoices"
      >
        <div class="header-actions">
          <button *ngIf="bill" class="btn btn-outline" (click)="loadPrintBill()">🖨️ Print / Invoice View</button>
          <a routerLink="/reservations" class="btn btn-outline">← Back to Reservations</a>
        </div>
      </app-page-header>

      <!-- Reservation Selector -->
      <div class="card selector-card">
        <div class="selector-row">
          <div class="form-group flex-1">
            <label>Select Reservation for Folio / Invoice</label>
            <select [(ngModel)]="selectedReservationId" (change)="onReservationChange()" class="form-control">
              <option [ngValue]="null">-- Select a Reservation --</option>
              <option *ngFor="let r of reservations" [ngValue]="r.id">
                {{ r.reservationCode }} - {{ r.guestName }} (Status: {{ r.status }})
              </option>
            </select>
          </div>
          <button
            *ngIf="selectedReservationId && !bill && !loading"
            class="btn btn-primary create-bill-btn"
            (click)="generateInitialBill()"
          >
            Create Initial Bill
          </button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading && bill" class="billing-grid">
        <!-- Main Folio Items -->
        <div class="card folio-card">
          <div class="card-header">
            <div>
              <h3>Folio Charges (Bill #{{ bill.id }})</h3>
              <p class="sub-text">Guest: <strong>{{ bill.guestName || 'Reservation #' + bill.reservationId }}</strong></p>
            </div>
            <div class="header-badges">
              <app-status-badge [status]="bill.status"></app-status-badge>
              <button
                *ngIf="bill.status === 'DRAFT'"
                class="btn btn-sm btn-outline"
                (click)="showAddItemModal = true"
              >
                + Add Folio Charge
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of bill.items">
                  <td><strong>{{ item.description }}</strong></td>
                  <td><span class="category-badge">{{ item.category }}</span></td>
                  <td>{{ item.quantity }}</td>
                  <td>\${{ item.unitPrice | number:'1.2-2' }}</td>
                  <td><strong>\${{ item.totalAmount | number:'1.2-2' }}</strong></td>
                </tr>
                <tr *ngIf="bill.items?.length === 0">
                  <td colspan="5" class="text-center py-4">No folio items recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="folio-actions" *ngIf="bill.status === 'DRAFT'">
            <button class="btn btn-outline" (click)="recalculateBill()" [disabled]="calculating">
              {{ calculating ? 'Calculating...' : 'Recalculate Totals' }}
            </button>
            <button class="btn btn-primary" (click)="showFinalizeModal = true">
              Finalize Bill
            </button>
          </div>
        </div>

        <!-- Summary & Balance -->
        <div class="card summary-card">
          <h3>Billing Summary</h3>

          <div class="summary-breakdown">
            <div class="breakdown-row">
              <span>Subtotal:</span>
              <strong>\${{ bill.subtotal | number:'1.2-2' }}</strong>
            </div>
            <div class="breakdown-row">
              <span>Tax:</span>
              <span>+\${{ bill.taxAmount | number:'1.2-2' }}</span>
            </div>
            <div class="breakdown-row">
              <span>Discount:</span>
              <span class="text-success">-\${{ bill.discountAmount | number:'1.2-2' }}</span>
            </div>
            <div class="breakdown-row total-row">
              <span>Total Bill Amount:</span>
              <span class="price-large">\${{ bill.totalAmount | number:'1.2-2' }}</span>
            </div>
            <div class="breakdown-row">
              <span>Total Paid:</span>
              <span class="text-success font-bold">\${{ bill.paidAmount | number:'1.2-2' }}</span>
            </div>
            <div class="breakdown-row balance-row">
              <span>Outstanding Balance:</span>
              <span [class.text-danger]="bill.balanceAmount > 0" [class.text-success]="bill.balanceAmount <= 0" class="balance-due">
                \${{ bill.balanceAmount | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <div class="payment-action" *ngIf="bill.balanceAmount > 0">
            <a [routerLink]="['/payments']" [queryParams]="{ reservationId: bill.reservationId }" class="btn btn-success btn-block">
              Pay Remaining Balance
            </a>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && !bill && selectedReservationId" class="card empty-card">
        <p>No billing statement found for this reservation yet.</p>
        <button class="btn btn-primary mt-3" (click)="generateInitialBill()">Initialize Bill Now</button>
      </div>

      <!-- Add Folio Item Modal -->
      <div *ngIf="showAddItemModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Add Line Item / Charge</h3>
            <button class="close-btn" (click)="showAddItemModal = false">&times;</button>
          </div>
          <form [formGroup]="itemForm" (ngSubmit)="submitItem()">
            <div class="modal-body">
              <div class="form-group">
                <label>Description *</label>
                <input type="text" formControlName="description" class="form-control" placeholder="e.g. Laundry Service, Mini-Bar snacks" />
              </div>
              <div class="form-group">
                <label>Category *</label>
                <select formControlName="category" class="form-control">
                  <option value="ROOM_CHARGE">ROOM_CHARGE</option>
                  <option value="FOOD_AND_BEVERAGE">FOOD_AND_BEVERAGE</option>
                  <option value="LAUNDRY">LAUNDRY</option>
                  <option value="SPA">SPA</option>
                  <option value="DAMAGE_BREAKAGE">DAMAGE_BREAKAGE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group col">
                  <label>Quantity *</label>
                  <input type="number" formControlName="quantity" class="form-control" min="1" />
                </div>
                <div class="form-group col">
                  <label>Unit Price ($) *</label>
                  <input type="number" formControlName="unitPrice" class="form-control" min="0" step="0.01" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showAddItemModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="itemForm.invalid || submitting">
                {{ submitting ? 'Adding...' : 'Add Charge' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Finalize Modal -->
      <div *ngIf="showFinalizeModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Finalize Bill</h3>
            <button class="close-btn" (click)="showFinalizeModal = false">&times;</button>
          </div>
          <form [formGroup]="finalizeForm" (ngSubmit)="submitFinalize()">
            <div class="modal-body">
              <p>Lock folio charges and calculate final checkout balance.</p>
              <div class="form-group">
                <label>Discount Percentage (%)</label>
                <input type="number" formControlName="discountPercentage" class="form-control" min="0" max="100" />
              </div>
              <div class="form-group">
                <label>Notes / Folio Remarks</label>
                <textarea formControlName="notes" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showFinalizeModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="finalizeForm.invalid || submitting">
                {{ submitting ? 'Finalizing...' : 'Finalize & Lock Bill' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Printable Invoice Modal -->
      <div *ngIf="showPrintModal && printData" class="modal-backdrop">
        <div class="modal-dialog print-dialog">
          <div class="modal-header no-print">
            <h3>Invoice Preview</h3>
            <div class="print-actions">
              <button class="btn btn-primary btn-sm" (click)="triggerBrowserPrint()">🖨️ Print Now</button>
              <button class="close-btn" (click)="showPrintModal = false">&times;</button>
            </div>
          </div>
          <div class="modal-body printable-content" id="printable-area">
            <div class="invoice-header">
              <div class="hotel-info">
                <h2>GRAND LUXE HOTEL & RESORTS</h2>
                <p>100 Waterfront Blvd, Hospitality Bay</p>
                <p>Tel: +1 (555) 234-5678 | Email: billing&#64;grandluxe.com</p>
              </div>
              <div class="invoice-meta">
                <h3>INVOICE</h3>
                <p><strong>Invoice #:</strong> {{ printData.billNumber }}</p>
                <p><strong>Reservation:</strong> {{ printData.reservationCode }}</p>
                <p><strong>Date:</strong> {{ printData.printedAt | date:'mediumDate' }}</p>
                <p><strong>Status:</strong> {{ printData.status }}</p>
              </div>
            </div>

            <div class="guest-info-section">
              <p><strong>Billed To:</strong> {{ printData.guestName }}</p>
              <p><strong>Stay Duration:</strong> {{ printData.checkInDate }} → {{ printData.checkOutDate }}</p>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let itm of printData.items">
                  <td>{{ itm.description }}</td>
                  <td>{{ itm.category }}</td>
                  <td>{{ itm.quantity }}</td>
                  <td>\${{ itm.unitPrice | number:'1.2-2' }}</td>
                  <td>\${{ itm.totalAmount | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>

            <div class="invoice-summary">
              <div class="summary-line"><span>Subtotal:</span> \${{ printData.subtotal | number:'1.2-2' }}</div>
              <div class="summary-line"><span>Tax:</span> +\${{ printData.taxAmount | number:'1.2-2' }}</div>
              <div class="summary-line"><span>Discount:</span> -\${{ printData.discountAmount | number:'1.2-2' }}</div>
              <div class="summary-line total"><span>Total Amount:</span> \${{ printData.totalAmount | number:'1.2-2' }}</div>
              <div class="summary-line"><span>Total Paid:</span> \${{ printData.paidAmount | number:'1.2-2' }}</div>
              <div class="summary-line balance"><span>Balance Due:</span> \${{ printData.balanceDue | number:'1.2-2' }}</div>
            </div>

            <div class="invoice-footer">
              <p>Thank you for choosing Grand Luxe Hotel. We look forward to welcoming you again!</p>
            </div>
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
    .selector-card {
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .selector-row {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
    }
    .flex-1 {
      flex: 1;
    }
    .create-bill-btn {
      height: 40px;
    }
    .billing-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .billing-grid {
        grid-template-columns: 1fr;
      }
    }
    .folio-card, .summary-card {
      padding: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    .header-badges {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .category-badge {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      background: var(--bg-hover);
      font-size: 0.75rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .folio-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
    .summary-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin: 1.25rem 0;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
    }
    .total-row {
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
      font-size: 1rem;
      font-weight: 700;
    }
    .price-large {
      font-size: 1.25rem;
      color: var(--primary);
      font-weight: 800;
    }
    .balance-row {
      border-top: 1px dashed var(--border-color);
      padding-top: 0.5rem;
      font-size: 1.1rem;
      font-weight: 800;
    }
    .balance-due {
      font-size: 1.3rem;
    }
    .btn-block {
      width: 100%;
    }
    .empty-card {
      padding: 3rem;
      text-align: center;
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
      max-width: 480px;
      box-shadow: var(--shadow-lg);
    }
    .print-dialog {
      max-width: 750px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }
    .print-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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
    /* Invoice Styles */
    .printable-content {
      background: white;
      color: #111;
      padding: 2rem;
      font-family: 'Inter', sans-serif;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #ddd;
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .hotel-info h2 {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }
    .hotel-info p {
      font-size: 0.8rem;
      color: #555;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h3 {
      font-size: 1.5rem;
      color: #333;
    }
    .guest-info-section {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }
    .invoice-table th, .invoice-table td {
      border: 1px solid #ddd;
      padding: 0.6rem;
      text-align: left;
      font-size: 0.85rem;
    }
    .invoice-summary {
      width: 300px;
      margin-left: auto;
      margin-bottom: 2rem;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0;
      font-size: 0.85rem;
    }
    .summary-line.total {
      border-top: 1px solid #333;
      font-weight: 700;
      font-size: 1rem;
    }
    .summary-line.balance {
      border-top: 2px solid #333;
      font-weight: 800;
      font-size: 1.1rem;
      color: #d9534f;
    }
    .invoice-footer {
      text-align: center;
      font-size: 0.8rem;
      color: #777;
      border-top: 1px solid #ddd;
      padding-top: 1rem;
    }
  `]
})
export class BillDetailComponent implements OnInit {
  private billingService = inject(BillingService);
  private reservationService = inject(ReservationService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  selectedReservationId: number | null = null;
  reservations: ReservationResponse[] = [];
  bill: BillResponse | null = null;
  printData: PrintBillResponse | null = null;

  loading = false;
  calculating = false;
  submitting = false;

  showAddItemModal = false;
  itemForm: FormGroup;

  showFinalizeModal = false;
  finalizeForm: FormGroup;

  showPrintModal = false;

  constructor() {
    this.itemForm = this.fb.group({
      description: ['', Validators.required],
      category: ['ROOM_CHARGE', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });

    this.finalizeForm = this.fb.group({
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const qResId = this.route.snapshot.queryParamMap.get('reservationId');
    if (qResId) {
      this.selectedReservationId = Number(qResId);
    }
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
      next: (list) => {
        this.reservations = list;
        if (!this.selectedReservationId && list.length > 0) {
          this.selectedReservationId = list[0].id;
        }
        if (this.selectedReservationId) {
          this.loadBill();
        }
      },
      error: (err) => {
        this.notify.error('Failed to load reservations: ' + (err.error?.message || err.message));
      }
    });
  }

  onReservationChange(): void {
    if (this.selectedReservationId) {
      this.loadBill();
    }
  }

  loadBill(): void {
    if (!this.selectedReservationId) return;
    this.loading = true;
    this.billingService.getBillByReservationId(this.selectedReservationId).subscribe({
      next: (b) => {
        this.bill = b;
        this.loading = false;
      },
      error: () => {
        this.bill = null;
        this.loading = false;
      }
    });
  }

  generateInitialBill(): void {
    if (!this.selectedReservationId) return;
    this.loading = true;
    this.billingService.createBill({ reservationId: this.selectedReservationId }).subscribe({
      next: (b) => {
        this.bill = b;
        this.loading = false;
        this.notify.success('Bill initialized for reservation');
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to create bill: ' + (err.error?.message || err.message));
      }
    });
  }

  submitItem(): void {
    if (this.itemForm.invalid || !this.bill) return;
    this.submitting = true;
    this.billingService.addItemToBill(this.bill.id, this.itemForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Charge item added to folio');
        this.showAddItemModal = false;
        this.itemForm.reset({ category: 'ROOM_CHARGE', quantity: 1, unitPrice: 0 });
        this.loadBill();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to add item: ' + (err.error?.message || err.message));
      }
    });
  }

  recalculateBill(): void {
    if (!this.bill) return;
    this.calculating = true;
    this.billingService.calculateBill(this.bill.id).subscribe({
      next: (b) => {
        this.bill = b;
        this.calculating = false;
        this.notify.success('Bill calculated successfully');
      },
      error: (err) => {
        this.calculating = false;
        this.notify.error('Calculation failed: ' + (err.error?.message || err.message));
      }
    });
  }

  submitFinalize(): void {
    if (!this.bill) return;
    this.submitting = true;
    this.billingService.finalizeBill(this.bill.id, this.finalizeForm.value).subscribe({
      next: (b) => {
        this.bill = b;
        this.submitting = false;
        this.showFinalizeModal = false;
        this.notify.success('Bill finalized!');
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Finalization failed: ' + (err.error?.message || err.message));
      }
    });
  }

  loadPrintBill(): void {
    if (!this.bill) return;
    this.billingService.getPrintBill(this.bill.id).subscribe({
      next: (data) => {
        this.printData = data;
        this.showPrintModal = true;
      },
      error: (err) => {
        this.notify.error('Failed to load printable invoice: ' + (err.error?.message || err.message));
      }
    });
  }

  triggerBrowserPrint(): void {
    window.print();
  }
}
