import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { CashDrawerResponse } from '../../core/models/operations.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-cash-drawer',
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
    <div class="cash-drawer-page">
      <app-page-header
        title="Front Desk Cash Drawer & Reconciliation"
        subtitle="Manage daily cash float, track shift cash intake and drop-offs, and reconcile closing balance discrepancies"
      >
        <div class="header-actions">
          <a routerLink="/operations/handover" class="btn btn-outline">Shift Handover Notes</a>
          <button *ngIf="!currentDrawer || currentDrawer.status === 'CLOSED'" class="btn btn-primary" (click)="showOpenModal = true">
            Open Cash Drawer
          </button>
          <button *ngIf="currentDrawer && currentDrawer.status === 'OPEN'" class="btn btn-warning" (click)="showCloseModal = true">
            Close & Reconcile Drawer
          </button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading">
        <!-- Current Drawer Status Card -->
        <div class="card current-drawer-card" *ngIf="currentDrawer">
          <div class="card-header">
            <div>
              <h3>Active Drawer Session #{{ currentDrawer.id }}</h3>
              <p class="sub-text">Opened at: {{ currentDrawer.openedAt | date:'medium' }}</p>
            </div>
            <app-status-badge [status]="currentDrawer.status"></app-status-badge>
          </div>

          <div class="cash-grid">
            <div class="cash-stat">
              <span class="stat-label">Opening Float</span>
              <span class="stat-val">\${{ currentDrawer.openingBalance | number:'1.2-2' }}</span>
            </div>
            <div class="cash-stat">
              <span class="stat-label">Cash Received (In)</span>
              <span class="stat-val text-success">+\${{ currentDrawer.cashReceived | number:'1.2-2' }}</span>
            </div>
            <div class="cash-stat">
              <span class="stat-label">Cash Paid Out (Drops)</span>
              <span class="stat-val text-danger">-\${{ currentDrawer.cashPaidOut | number:'1.2-2' }}</span>
            </div>
            <div class="cash-stat total-stat">
              <span class="stat-label">System Expected Cash</span>
              <span class="stat-val">\${{ currentDrawer.systemCalculatedClosing | number:'1.2-2' }}</span>
            </div>
          </div>

          <div *ngIf="currentDrawer.status === 'CLOSED'" class="reconciliation-summary">
            <div class="recon-row">
              <span>Actual Physical Cash Counted:</span>
              <strong>\${{ currentDrawer.actualClosingCash | number:'1.2-2' }}</strong>
            </div>
            <div class="recon-row">
              <span>Cash Discrepancy (Over / Short):</span>
              <strong [class.text-danger]="(currentDrawer.discrepancy || 0) < 0" [class.text-success]="(currentDrawer.discrepancy || 0) >= 0">
                \${{ currentDrawer.discrepancy | number:'1.2-2' }}
              </strong>
            </div>
            <div class="recon-row" *ngIf="currentDrawer.remarks">
              <span>Closing Remarks:</span>
              <em>{{ currentDrawer.remarks }}</em>
            </div>
          </div>
        </div>

        <div *ngIf="!currentDrawer" class="card empty-card">
          <p>No active cash drawer currently open for this station.</p>
          <button class="btn btn-primary mt-3" (click)="showOpenModal = true">Open Cash Float Now</button>
        </div>
      </div>

      <!-- Open Drawer Modal -->
      <div *ngIf="showOpenModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Open Cash Drawer Session</h3>
            <button class="close-btn" (click)="showOpenModal = false">&times;</button>
          </div>
          <form [formGroup]="openForm" (ngSubmit)="submitOpen()">
            <div class="modal-body">
              <div class="form-group">
                <label>Opening Cash Float ($) *</label>
                <input type="number" formControlName="openingBalance" class="form-control" min="0" step="0.01" />
              </div>
              <div class="form-group">
                <label>Remarks</label>
                <input type="text" formControlName="remarks" class="form-control" placeholder="e.g. Morning shift float, starting bills" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showOpenModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="openForm.invalid || submitting">
                {{ submitting ? 'Opening...' : 'Open Session' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Close Drawer Modal -->
      <div *ngIf="showCloseModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Close & Reconcile Drawer</h3>
            <button class="close-btn" (click)="showCloseModal = false">&times;</button>
          </div>
          <form [formGroup]="closeForm" (ngSubmit)="submitClose()">
            <div class="modal-body">
              <p>System Expected: <strong>\${{ currentDrawer?.systemCalculatedClosing | number:'1.2-2' }}</strong></p>

              <div class="form-group">
                <label>Actual Physical Cash Counted ($) *</label>
                <input type="number" formControlName="actualClosingCash" class="form-control" min="0" step="0.01" />
              </div>

              <div class="form-group">
                <label>Discrepancy Explanation / Remarks</label>
                <textarea formControlName="remarks" class="form-control" rows="2" placeholder="Explain any shortages or surpluses..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCloseModal = false">Cancel</button>
              <button type="submit" class="btn btn-warning" [disabled]="closeForm.invalid || submitting">
                {{ submitting ? 'Closing...' : 'Close & Lock Drawer' }}
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
    }
    .current-drawer-card {
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .sub-text {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .cash-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .cash-stat {
      background: var(--bg-hover);
      padding: 1rem;
      border-radius: var(--radius);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .cash-stat.total-stat {
      background: var(--primary-light, #e0e7ff);
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .stat-val {
      font-size: 1.35rem;
      font-weight: 800;
    }
    .reconciliation-summary {
      background: var(--surface);
      border: 1px solid var(--border-color);
      padding: 1rem;
      border-radius: var(--radius);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    .recon-row {
      display: flex;
      justify-content: space-between;
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
  `]
})
export class CashDrawerComponent implements OnInit {
  private opsService = inject(OperationsService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  currentDrawer: CashDrawerResponse | null = null;
  loading = false;
  submitting = false;

  showOpenModal = false;
  openForm: FormGroup;

  showCloseModal = false;
  closeForm: FormGroup;

  constructor() {
    this.openForm = this.fb.group({
      openingBalance: [200, [Validators.required, Validators.min(0)]],
      remarks: ['Morning shift opening float']
    });

    this.closeForm = this.fb.group({
      actualClosingCash: [200, [Validators.required, Validators.min(0)]],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentDrawer();
  }

  loadCurrentDrawer(): void {
    this.loading = true;
    this.opsService.getCurrentCashDrawer().subscribe({
      next: (d) => {
        this.currentDrawer = d;
        this.loading = false;
      },
      error: () => {
        this.currentDrawer = null;
        this.loading = false;
      }
    });
  }

  submitOpen(): void {
    if (this.openForm.invalid) return;
    this.submitting = true;
    this.opsService.openCashDrawer(this.openForm.value).subscribe({
      next: (d) => {
        this.submitting = false;
        this.currentDrawer = d;
        this.showOpenModal = false;
        this.notify.success('Cash drawer opened successfully');
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to open drawer: ' + (err.error?.message || err.message));
      }
    });
  }

  submitClose(): void {
    if (this.closeForm.invalid || !this.currentDrawer) return;
    this.submitting = true;
    this.opsService.closeCashDrawer(this.currentDrawer.id, this.closeForm.value).subscribe({
      next: (d) => {
        this.submitting = false;
        this.currentDrawer = d;
        this.showCloseModal = false;
        this.notify.success('Cash drawer reconciled and closed');
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to close drawer: ' + (err.error?.message || err.message));
      }
    });
  }
}
