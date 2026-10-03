import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { ExpenseResponse, UtilityResponse } from '../../core/models/operations.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="expenses-page">
      <app-page-header
        title="Operational Expenditures & Utility Invoices"
        subtitle="Record day-to-day operational overheads, vendor receipts, and monthly electricity, water, and fuel bills"
      >
        <div class="header-actions">
          <div class="tab-buttons">
            <button class="btn btn-outline" [class.btn-primary]="activeTab === 'expenses'" (click)="activeTab = 'expenses'">
              Operational Expenses
            </button>
            <button class="btn btn-outline" [class.btn-primary]="activeTab === 'utilities'" (click)="activeTab = 'utilities'">
              Utility Invoices
            </button>
          </div>
          <button class="btn btn-primary" (click)="activeTab === 'expenses' ? (showExpenseModal = true) : (showUtilityModal = true)">
            + Record {{ activeTab === 'expenses' ? 'Expense' : 'Utility Bill' }}
          </button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Expenses Tab -->
      <div *ngIf="!loading && activeTab === 'expenses'" class="tab-content">
        <div class="card table-card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Receipt #</th>
                  <th>Amount</th>
                  <th>Date Incurred</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let exp of expenses">
                  <td>#{{ exp.id }}</td>
                  <td><span class="category-tag">{{ exp.category }}</span></td>
                  <td><strong>{{ exp.description }}</strong></td>
                  <td><code>{{ exp.receiptNumber || '-' }}</code></td>
                  <td><strong class="text-danger">\${{ exp.amount | number:'1.2-2' }}</strong></td>
                  <td>{{ exp.expenseDate }}</td>
                </tr>
                <tr *ngIf="expenses.length === 0">
                  <td colspan="6" class="text-center py-4">No operational expenses recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Utilities Tab -->
      <div *ngIf="!loading && activeTab === 'utilities'" class="tab-content">
        <div class="card table-card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Utility Type</th>
                  <th>Billing Period</th>
                  <th>Units Consumed</th>
                  <th>Total Cost</th>
                  <th>Bill / Meter Ref</th>
                  <th>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of utilities">
                  <td><strong>{{ u.utilityType }}</strong></td>
                  <td>{{ getMonthName(u.month) }} {{ u.year }}</td>
                  <td>{{ u.unitsConsumed }} units</td>
                  <td><strong class="text-danger">\${{ u.totalCost | number:'1.2-2' }}</strong></td>
                  <td><code>{{ u.billReference || '-' }}</code></td>
                  <td>{{ u.recordedAt | date:'short' }}</td>
                </tr>
                <tr *ngIf="utilities.length === 0">
                  <td colspan="6" class="text-center py-4">No utility invoices logged yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add Expense Modal -->
      <div *ngIf="showExpenseModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Record Operational Expense</h3>
            <button class="close-btn" (click)="showExpenseModal = false">&times;</button>
          </div>
          <form [formGroup]="expenseForm" (ngSubmit)="submitExpense()">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group col">
                  <label>Category *</label>
                  <select formControlName="category" class="form-control">
                    <option value="OFFICE_SUPPLIES">Office Supplies</option>
                    <option value="MARKETING">Marketing & Advertising</option>
                    <option value="TRANSPORT">Guest Transport / Fuel</option>
                    <option value="REPAIRS">Local Emergency Repairs</option>
                    <option value="STAFF_MEALS">Staff Meals & Hospitality</option>
                    <option value="OTHER">Other Miscellaneous</option>
                  </select>
                </div>
                <div class="form-group col">
                  <label>Amount ($) *</label>
                  <input type="number" formControlName="amount" class="form-control" min="0.01" step="0.01" />
                </div>
              </div>

              <div class="form-group">
                <label>Description *</label>
                <input type="text" formControlName="description" class="form-control" placeholder="Purpose of expenditure..." />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Receipt / Voucher #</label>
                  <input type="text" formControlName="receiptNumber" class="form-control" placeholder="RCPT-1029" />
                </div>
                <div class="form-group col">
                  <label>Expense Date *</label>
                  <input type="date" formControlName="expenseDate" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showExpenseModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="expenseForm.invalid || submitting">
                {{ submitting ? 'Recording...' : 'Record Expense' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Utility Modal -->
      <div *ngIf="showUtilityModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Record Utility Invoice</h3>
            <button class="close-btn" (click)="showUtilityModal = false">&times;</button>
          </div>
          <form [formGroup]="utilityForm" (ngSubmit)="submitUtility()">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group col">
                  <label>Utility Type *</label>
                  <select formControlName="utilityType" class="form-control">
                    <option value="ELECTRICITY">Electricity (kWh)</option>
                    <option value="WATER">Water (m³)</option>
                    <option value="GAS">Gas / Heating</option>
                    <option value="INTERNET">Broadband & Telecom</option>
                    <option value="WASTE">Waste Management</option>
                  </select>
                </div>
                <div class="form-group col">
                  <label>Total Invoice Cost ($) *</label>
                  <input type="number" formControlName="totalCost" class="form-control" min="0.01" step="0.01" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Month (1-12) *</label>
                  <input type="number" formControlName="month" class="form-control" min="1" max="12" />
                </div>
                <div class="form-group col">
                  <label>Year *</label>
                  <input type="number" formControlName="year" class="form-control" min="2020" max="2030" />
                </div>
                <div class="form-group col">
                  <label>Units Consumed *</label>
                  <input type="number" formControlName="unitsConsumed" class="form-control" min="0" />
                </div>
              </div>

              <div class="form-group">
                <label>Utility Bill Reference #</label>
                <input type="text" formControlName="billReference" class="form-control" placeholder="e.g. MTR-EL-2026-09" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showUtilityModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="utilityForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Save Utility Bill' }}
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
      gap: 0.75rem;
      align-items: center;
    }
    .tab-buttons {
      display: flex;
      gap: 0.35rem;
    }
    .category-tag {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      background: var(--bg-hover);
      border-radius: 4px;
      font-weight: 600;
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
export class ExpensesComponent implements OnInit {
  private opsService = inject(OperationsService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  activeTab: 'expenses' | 'utilities' = 'expenses';
  expenses: ExpenseResponse[] = [];
  utilities: UtilityResponse[] = [];
  loading = false;
  submitting = false;

  showExpenseModal = false;
  expenseForm: FormGroup;

  showUtilityModal = false;
  utilityForm: FormGroup;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor() {
    const today = new Date();
    this.expenseForm = this.fb.group({
      category: ['OFFICE_SUPPLIES', Validators.required],
      amount: [50, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      receiptNumber: [''],
      expenseDate: [today.toISOString().split('T')[0], Validators.required]
    });

    this.utilityForm = this.fb.group({
      utilityType: ['ELECTRICITY', Validators.required],
      totalCost: [250, [Validators.required, Validators.min(0.01)]],
      month: [today.getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [today.getFullYear(), [Validators.required, Validators.min(2020)]],
      unitsConsumed: [1200, [Validators.required, Validators.min(0)]],
      billReference: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.opsService.getAllExpenses().subscribe({
      next: (exps) => {
        this.expenses = exps;
        this.opsService.getUtilityRecords().subscribe({
          next: (uts) => {
            this.utilities = uts;
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: () => (this.loading = false)
    });
  }

  getMonthName(m: number): string {
    return this.months[m - 1] || `Month ${m}`;
  }

  submitExpense(): void {
    if (this.expenseForm.invalid) return;
    this.submitting = true;
    this.opsService.createExpense(this.expenseForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Expense recorded successfully');
        this.showExpenseModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Expense error: ' + (err.error?.message || err.message));
      }
    });
  }

  submitUtility(): void {
    if (this.utilityForm.invalid) return;
    this.submitting = true;
    this.opsService.createUtilityRecord(this.utilityForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Utility invoice recorded');
        this.showUtilityModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Utility error: ' + (err.error?.message || err.message));
      }
    });
  }
}
