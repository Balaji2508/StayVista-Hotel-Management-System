import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { PaymentService } from '../../core/services/payment.service';
import { ReservationService } from '../../core/services/reservation.service';
import { PaymentResponse, PaymentMethod } from '../../core/models/payment.models';
import { ReservationResponse } from '../../core/models/reservation.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-payment-list',
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
    <div class="payments-page">
      <app-page-header
        title="Payment Processing & Transactions"
        subtitle="Process reservation payments with idempotency keys, accept multi-channel payments, and issue refunds"
      >
        <button class="btn btn-primary" (click)="showNewPaymentModal = true">+ Process New Payment</button>
      </app-page-header>

      <!-- Reservation Selector / Search -->
      <div class="card search-card">
        <div class="search-row">
          <div class="form-group flex-1">
            <label>Filter by Reservation</label>
            <select [(ngModel)]="selectedReservationId" (change)="onReservationChange()" class="form-control">
              <option [ngValue]="null">-- Select a Reservation to View Payment Ledger --</option>
              <option *ngFor="let r of reservations" [ngValue]="r.id">
                {{ r.reservationCode }} - {{ r.guestName || 'Guest #' + r.guestId }} (Total: \${{ r.totalAmount }})
              </option>
            </select>
          </div>
          <button class="btn btn-outline reload-btn" (click)="loadPayments()">Refresh Ledger</button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Payments Table -->
      <div *ngIf="!loading" class="card table-card">
        <div class="card-header">
          <h3>Transaction Ledger</h3>
          <span *ngIf="selectedReservationId" class="badge badge-info">
            Reservation #{{ selectedReservationId }}
          </span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Res. Code</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Refunded</th>
                <th>Idempotency Key</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payments">
                <td>#{{ p.id }}</td>
                <td>
                  <a [routerLink]="['/reservations', p.reservationId]" class="font-bold">
                    Res #{{ p.reservationId }}
                  </a>
                </td>
                <td>
                  <span class="method-tag">{{ p.paymentMethod }}</span>
                </td>
                <td><strong class="text-success">\${{ p.amount | number:'1.2-2' }}</strong></td>
                <td>
                  <span *ngIf="p.refundedAmount" class="text-danger">
                    -\${{ p.refundedAmount | number:'1.2-2' }}
                  </span>
                  <span *ngIf="!p.refundedAmount" class="text-muted">-</span>
                </td>
                <td><code class="key-code">{{ p.idempotencyKey }}</code></td>
                <td>{{ p.providerReference || '-' }}</td>
                <td>
                  <app-status-badge [status]="p.status"></app-status-badge>
                </td>
                <td>{{ (p.paymentTime || p.createdAt) | date:'short' }}</td>
                <td>
                  <button
                    *ngIf="p.status === 'SUCCESS' && (!p.remainingRefundableAmount || p.remainingRefundableAmount > 0)"
                    class="btn btn-sm btn-outline-danger"
                    (click)="openRefundModal(p)"
                  >
                    Refund
                  </button>
                </td>
              </tr>
              <tr *ngIf="payments.length === 0">
                <td colspan="10" class="text-center py-4">
                  {{ selectedReservationId ? 'No payments found for this reservation.' : 'Select a reservation above or create a new payment.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- New Payment Modal -->
      <div *ngIf="showNewPaymentModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Process Payment</h3>
            <button class="close-btn" (click)="showNewPaymentModal = false">&times;</button>
          </div>
          <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()">
            <div class="modal-body">
              <div class="form-group">
                <label>Reservation *</label>
                <select formControlName="reservationId" class="form-control" (change)="onModalReservationChange()">
                  <option value="" disabled>-- Select Reservation --</option>
                  <option *ngFor="let r of reservations" [value]="r.id">
                    {{ r.reservationCode }} - {{ r.guestName }} (\${{ r.totalAmount }})
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Amount ($) *</label>
                  <input type="number" formControlName="amount" class="form-control" min="0.01" step="0.01" />
                </div>
                <div class="form-group col">
                  <label>Payment Method *</label>
                  <select formControlName="paymentMethod" class="form-control">
                    <option *ngFor="let m of methods" [value]="m">{{ m }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Provider / Transaction Reference</label>
                <input type="text" formControlName="providerReference" class="form-control" placeholder="e.g. UPI-REF-9872 or CASH-RECEIPT-12" />
              </div>

              <div class="form-group">
                <label>Idempotency Key (Auto-Generated)</label>
                <div class="input-with-button">
                  <input type="text" formControlName="idempotencyKey" class="form-control" />
                  <button type="button" class="btn btn-sm btn-outline" (click)="regenerateKey()">Regen</button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showNewPaymentModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="paymentForm.invalid || submitting">
                {{ submitting ? 'Processing...' : 'Charge Payment' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Refund Modal -->
      <div *ngIf="showRefundModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Process Refund</h3>
            <button class="close-btn" (click)="showRefundModal = false">&times;</button>
          </div>
          <form [formGroup]="refundForm" (ngSubmit)="submitRefund()">
            <div class="modal-body">
              <p>Refund for Payment <strong>#{{ targetPayment?.id }}</strong> (Original: \${{ targetPayment?.amount }})</p>

              <div class="form-group">
                <label>Refund Amount ($) *</label>
                <input type="number" formControlName="amount" class="form-control" min="0.01" step="0.01" />
              </div>

              <div class="form-group">
                <label>Reason *</label>
                <input type="text" formControlName="reason" class="form-control" placeholder="Guest requested refund, cancellation..." />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showRefundModal = false">Cancel</button>
              <button type="submit" class="btn btn-danger" [disabled]="refundForm.invalid || submitting">
                {{ submitting ? 'Refunding...' : 'Confirm Refund' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-card {
      padding: 1rem 1.5rem;
      margin-bottom: 1.25rem;
    }
    .search-row {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
    }
    .flex-1 {
      flex: 1;
    }
    .reload-btn {
      height: 40px;
    }
    .card-header {
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }
    .method-tag {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: var(--bg-hover);
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .key-code {
      font-size: 0.75rem;
      background: var(--bg-hover);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      max-width: 140px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .input-with-button {
      display: flex;
      gap: 0.5rem;
    }
    .btn-outline-danger {
      border: 1px solid var(--danger);
      color: var(--danger);
      background: transparent;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-outline-danger:hover {
      background: var(--danger);
      color: white;
    }
  `]
})
export class PaymentListComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private reservationService = inject(ReservationService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  selectedReservationId: number | null = null;
  reservations: ReservationResponse[] = [];
  payments: PaymentResponse[] = [];
  loading = false;
  submitting = false;

  methods: PaymentMethod[] = ['CASH', 'CARD', 'UPI', 'WALLET'];

  // Modal
  showNewPaymentModal = false;
  paymentForm: FormGroup;

  showRefundModal = false;
  targetPayment: PaymentResponse | null = null;
  refundForm: FormGroup;

  constructor() {
    this.paymentForm = this.fb.group({
      reservationId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['CASH', Validators.required],
      providerReference: [''],
      idempotencyKey: [this.generateUUID(), Validators.required]
    });

    this.refundForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required],
      idempotencyKey: [this.generateUUID(), Validators.required]
    });
  }

  ngOnInit(): void {
    const qResId = this.route.snapshot.queryParamMap.get('reservationId');
    if (qResId) {
      this.selectedReservationId = Number(qResId);
    }
    this.loadReservations();
  }

  generateUUID(): string {
    return 'pay-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  }

  regenerateKey(): void {
    this.paymentForm.patchValue({ idempotencyKey: this.generateUUID() });
  }

  loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
      next: (list) => {
        this.reservations = list;
        if (!this.selectedReservationId && list.length > 0) {
          this.selectedReservationId = list[0].id;
        }
        if (this.selectedReservationId) {
          this.paymentForm.patchValue({ reservationId: this.selectedReservationId });
          this.loadPayments();
        }
      },
      error: (err) => {
        this.notify.error('Failed to load reservations: ' + (err.error?.message || err.message));
      }
    });
  }

  onReservationChange(): void {
    if (this.selectedReservationId) {
      this.paymentForm.patchValue({ reservationId: this.selectedReservationId });
      this.loadPayments();
    }
  }

  onModalReservationChange(): void {
    const rId = Number(this.paymentForm.get('reservationId')?.value);
    const r = this.reservations.find(res => res.id === rId);
    if (r) {
      this.paymentForm.patchValue({ amount: r.totalAmount });
    }
  }

  loadPayments(): void {
    if (!this.selectedReservationId) return;
    this.loading = true;
    this.paymentService.getPaymentsByReservationId(this.selectedReservationId).subscribe({
      next: (res) => {
        this.payments = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load payments: ' + (err.error?.message || err.message));
      }
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) return;
    this.submitting = true;
    const req = this.paymentForm.value;

    this.paymentService.processPayment(req).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Payment successfully processed!');
        this.showNewPaymentModal = false;
        this.paymentForm.patchValue({
          amount: 0,
          providerReference: '',
          idempotencyKey: this.generateUUID()
        });
        this.loadPayments();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Payment processing failed: ' + (err.error?.message || err.message));
      }
    });
  }

  openRefundModal(payment: PaymentResponse): void {
    this.targetPayment = payment;
    this.refundForm.reset({
      amount: payment.remainingRefundableAmount || payment.amount,
      reason: '',
      idempotencyKey: this.generateUUID()
    });
    this.showRefundModal = true;
  }

  submitRefund(): void {
    if (this.refundForm.invalid || !this.targetPayment) return;
    this.submitting = true;
    const req = this.refundForm.value;

    this.paymentService.processRefund(this.targetPayment.id, req).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Refund processed successfully!');
        this.showRefundModal = false;
        this.targetPayment = null;
        this.loadPayments();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Refund failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
