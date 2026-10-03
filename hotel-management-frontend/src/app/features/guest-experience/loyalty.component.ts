import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { GuestExperienceService } from '../../core/services/guest-experience.service';
import { GuestService } from '../../core/services/guest.service';
import { LoyaltyAccountResponse, LoyaltyTransactionResponse } from '../../core/models/guest-experience.models';
import { GuestResponse } from '../../core/models/guest.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-loyalty',
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
    <div class="loyalty-page">
      <app-page-header
        title="Guest Loyalty Program & Rewards"
        subtitle="Manage guest reward points, tier upgrades (Silver, Gold, Platinum), and point redemptions"
      >
        <div class="header-actions">
          <a routerLink="/guest-experience/requests" class="btn btn-outline">Service Requests</a>
          <a routerLink="/guest-experience/complaints" class="btn btn-outline">Complaints</a>
          <button *ngIf="account" class="btn btn-outline" (click)="showEarnModal = true">+ Award Points</button>
          <button *ngIf="account" class="btn btn-primary" (click)="showRedeemModal = true">Redeem Points</button>
        </div>
      </app-page-header>

      <!-- Guest Selector Bar -->
      <div class="card selector-card">
        <div class="selector-row">
          <div class="form-group flex-1">
            <label>Select Guest to View Loyalty Account</label>
            <select [(ngModel)]="selectedGuestId" (change)="loadLoyalty()" class="form-control">
              <option [ngValue]="null">-- Select a Guest --</option>
              <option *ngFor="let g of guests" [ngValue]="g.id">
                {{ g.firstName }} {{ g.lastName }} ({{ g.email }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading && account" class="loyalty-grid">
        <!-- Tier Card -->
        <div class="card tier-card" [attr.data-tier]="account.currentTier">
          <div class="tier-top">
            <span class="tier-badge">{{ account.currentTier }} MEMBER</span>
            <div class="points-circle">
              <span class="pts-number">{{ account.totalPoints }}</span>
              <span class="pts-label">POINTS</span>
            </div>
          </div>

          <div class="tier-progress">
            <div class="progress-labels">
              <span>Points to next tier:</span>
              <strong>{{ account.pointsToNextTier }} pts</strong>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" [style.width.%]="getProgressPercent()"></div>
            </div>
          </div>
        </div>

        <!-- Transactions Ledger -->
        <div class="card ledger-card">
          <h3>Points Transaction History</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Points</th>
                  <th>Balance After</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of transactions">
                  <td>{{ tx.timestamp | date:'short' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="tx.transactionType === 'EARN'" [class.badge-warning]="tx.transactionType === 'REDEEM'">
                      {{ tx.transactionType }}
                    </span>
                  </td>
                  <td>
                    <strong [class.text-success]="tx.transactionType === 'EARN'" [class.text-danger]="tx.transactionType === 'REDEEM'">
                      {{ tx.transactionType === 'EARN' ? '+' : '-' }}{{ tx.points }}
                    </strong>
                  </td>
                  <td>{{ tx.balanceAfter }}</td>
                  <td>{{ tx.description || '-' }}</td>
                </tr>
                <tr *ngIf="transactions.length === 0">
                  <td colspan="5" class="text-center py-4">No points transactions recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && !account && selectedGuestId" class="card empty-card">
        <p>No loyalty membership account found for this guest.</p>
        <button class="btn btn-primary mt-3" (click)="initializeLoyalty()">Enroll in Loyalty Club</button>
      </div>

      <!-- Earn Points Modal -->
      <div *ngIf="showEarnModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Award Loyalty Points</h3>
            <button class="close-btn" (click)="showEarnModal = false">&times;</button>
          </div>
          <form [formGroup]="earnForm" (ngSubmit)="submitEarn()">
            <div class="modal-body">
              <div class="form-group">
                <label>Points to Award *</label>
                <input type="number" formControlName="points" class="form-control" min="1" />
              </div>
              <div class="form-group">
                <label>Source / Reason *</label>
                <input type="text" formControlName="source" class="form-control" placeholder="e.g. Completed Stay, Restaurant Dining, Promotional Bonus" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showEarnModal = false">Cancel</button>
              <button type="submit" class="btn btn-success" [disabled]="earnForm.invalid || submitting">
                {{ submitting ? 'Awarding...' : 'Award Points' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Redeem Points Modal -->
      <div *ngIf="showRedeemModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Redeem Points</h3>
            <button class="close-btn" (click)="showRedeemModal = false">&times;</button>
          </div>
          <form [formGroup]="redeemForm" (ngSubmit)="submitRedeem()">
            <div class="modal-body">
              <p>Available Balance: <strong>{{ account?.totalPoints }} points</strong></p>
              <div class="form-group">
                <label>Points to Redeem *</label>
                <input type="number" formControlName="points" class="form-control" min="1" [max]="account?.totalPoints || 99999" />
              </div>
              <div class="form-group">
                <label>Perk / Reward Description *</label>
                <input type="text" formControlName="description" class="form-control" placeholder="e.g. Free Breakfast voucher, Room Upgrade discount" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showRedeemModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="redeemForm.invalid || submitting">
                {{ submitting ? 'Redeeming...' : 'Confirm Redemption' }}
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
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .selector-card {
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .selector-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 {
      flex: 1;
    }
    .loyalty-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .loyalty-grid {
        grid-template-columns: 1fr;
      }
    }
    .tier-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
    }
    .tier-card[data-tier="GOLD"] {
      background: linear-gradient(135deg, #78350f 0%, #451a03 100%);
    }
    .tier-card[data-tier="PLATINUM"] {
      background: linear-gradient(135deg, #475569 0%, #1e293b 100%);
    }
    .tier-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tier-badge {
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.2);
    }
    .points-circle {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .pts-number {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1;
    }
    .pts-label {
      font-size: 0.7rem;
      opacity: 0.8;
      letter-spacing: 0.05em;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      opacity: 0.9;
    }
    .progress-bar-bg {
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: #38bdf8;
      border-radius: 9999px;
    }
    .ledger-card {
      padding: 1.5rem;
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
export class LoyaltyComponent implements OnInit {
  private guestExpService = inject(GuestExperienceService);
  private guestService = inject(GuestService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  selectedGuestId: number | null = null;
  guests: GuestResponse[] = [];
  account: LoyaltyAccountResponse | null = null;
  transactions: LoyaltyTransactionResponse[] = [];
  loading = false;
  submitting = false;

  showEarnModal = false;
  earnForm: FormGroup;

  showRedeemModal = false;
  redeemForm: FormGroup;

  constructor() {
    this.earnForm = this.fb.group({
      points: [100, [Validators.required, Validators.min(1)]],
      source: ['Room Stay Completed', Validators.required]
    });

    this.redeemForm = this.fb.group({
      points: [50, [Validators.required, Validators.min(1)]],
      description: ['Breakfast Voucher', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadGuests();
  }

  loadGuests(): void {
    this.guestService.getAllGuests().subscribe({
      next: (list) => {
        this.guests = list;
        if (list.length > 0 && !this.selectedGuestId) {
          this.selectedGuestId = list[0].id;
          this.loadLoyalty();
        }
      }
    });
  }

  loadLoyalty(): void {
    if (!this.selectedGuestId) return;
    this.loading = true;
    this.guestExpService.getLoyaltyAccountByGuestId(this.selectedGuestId).subscribe({
      next: (acc) => {
        this.account = acc;
        this.guestExpService.getLoyaltyTransactions(acc.id).subscribe({
          next: (txs) => {
            this.transactions = txs;
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: () => {
        this.account = null;
        this.transactions = [];
        this.loading = false;
      }
    });
  }

  getProgressPercent(): number {
    if (!this.account || !this.account.pointsToNextTier) return 100;
    const total = this.account.totalPoints + this.account.pointsToNextTier;
    return Math.min(100, Math.round((this.account.totalPoints / total) * 100));
  }

  initializeLoyalty(): void {
    if (!this.selectedGuestId) return;
    this.guestExpService.earnPoints({
      guestId: this.selectedGuestId,
      points: 50,
      source: 'Welcome Enrollment Bonus'
    }).subscribe({
      next: (acc) => {
        this.account = acc;
        this.notify.success('Guest enrolled in Loyalty Program!');
        this.loadLoyalty();
      },
      error: (err) => this.notify.error('Enrollment error: ' + (err.error?.message || err.message))
    });
  }

  submitEarn(): void {
    if (this.earnForm.invalid || !this.selectedGuestId) return;
    this.submitting = true;
    const req = {
      guestId: this.selectedGuestId,
      ...this.earnForm.value
    };

    this.guestExpService.earnPoints(req).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Points awarded successfully!');
        this.showEarnModal = false;
        this.loadLoyalty();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Failed to earn points: ' + (err.error?.message || err.message));
      }
    });
  }

  submitRedeem(): void {
    if (this.redeemForm.invalid || !this.selectedGuestId) return;
    this.submitting = true;
    const req = {
      guestId: this.selectedGuestId,
      ...this.redeemForm.value
    };

    this.guestExpService.redeemPoints(req).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Points redeemed successfully!');
        this.showRedeemModal = false;
        this.loadLoyalty();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Redemption failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
