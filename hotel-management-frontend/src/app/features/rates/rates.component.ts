import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RateService } from '../../core/services/rate.service';
import { RoomService } from '../../core/services/room.service';
import { RateResponse, RateQuoteResponse } from '../../core/models/rate.models';
import { RoomCategoryResponse } from '../../core/models/room.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-rates',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="rates-page">
      <app-page-header
        title="Rate & Dynamic Pricing Management"
        subtitle="Manage category base prices, dynamic demand multipliers, and test real-time rate quotations"
      >
        <button class="btn btn-primary" (click)="openRateModal()">+ Configure New Rate</button>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="rates-layout">
        <!-- Main Rates List -->
        <div class="rates-section card">
          <h3 class="section-title">Standard & Dynamic Rate Configuration</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Weekend Mult.</th>
                  <th>Seasonal Mult.</th>
                  <th>High/Low Occ.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let rate of rates">
                  <td>
                    <strong>{{ getCategoryName(rate.categoryId) }}</strong>
                    <div class="sub-text">Category #{{ rate.categoryId }}</div>
                  </td>
                  <td><span class="price">\${{ rate.basePrice | number:'1.2-2' }}</span></td>
                  <td>{{ rate.weekendMultiplier }}x</td>
                  <td>{{ rate.seasonalMultiplier }}x</td>
                  <td>
                    <span class="text-success">{{ rate.highOccupancyMultiplier }}x</span> /
                    <span class="text-danger">{{ rate.lowOccupancyMultiplier }}x</span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-success]="rate.active" [class.badge-secondary]="!rate.active">
                      {{ rate.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-outline" (click)="openRateModal(rate)">Edit</button>
                      <button class="btn btn-sm btn-danger" (click)="confirmDeleteRate(rate)">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="rates.length === 0">
                  <td colspan="7" class="text-center">No rates configured yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Real-Time Quotation Calculator -->
        <div class="quote-section card">
          <h3 class="section-title">Real-Time Backend Pricing Calculator</h3>
          <p class="section-desc">Test the backend dynamic pricing algorithm for any stay range and category.</p>

          <form [formGroup]="quoteForm" (ngSubmit)="calculateQuote()" class="quote-form">
            <div class="form-group">
              <label>Room Category *</label>
              <select formControlName="categoryId" class="form-control">
                <option value="" disabled>Select Category</option>
                <option *ngFor="let cat of categories" [value]="cat.id">
                  {{ cat.name }} (Base: \${{ cat.basePrice }})
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Check-in Date *</label>
                <input type="date" formControlName="checkInDate" class="form-control" />
              </div>
              <div class="form-group col">
                <label>Check-out Date *</label>
                <input type="date" formControlName="checkOutDate" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Guests Count</label>
                <input type="number" formControlName="guestsCount" class="form-control" min="1" />
              </div>
              <div class="form-group col">
                <label>Simulated Occupancy %</label>
                <input type="number" formControlName="currentOccupancyPercentage" class="form-control" min="0" max="100" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="quoteForm.invalid || quoting">
              {{ quoting ? 'Calculating...' : 'Request Backend Rate Quote' }}
            </button>
          </form>

          <!-- Quote Results -->
          <div *ngIf="quoteResult" class="quote-result">
            <h4>Quote Breakdown</h4>
            <div class="result-summary">
              <div class="result-row">
                <span>Total Nights:</span>
                <strong>{{ quoteResult.numberOfNights }}</strong>
              </div>
              <div class="result-row">
                <span>Base Price / Night:</span>
                <span>\${{ quoteResult.basePricePerNight | number:'1.2-2' }}</span>
              </div>
              <div class="result-row">
                <span>Total Base Cost:</span>
                <span>\${{ quoteResult.totalBasePrice | number:'1.2-2' }}</span>
              </div>
              <div class="result-row">
                <span>Dynamic Adjustment:</span>
                <span [class.text-success]="quoteResult.totalDynamicAdjustment >= 0">
                  {{ quoteResult.totalDynamicAdjustment >= 0 ? '+' : '' }}\${{ quoteResult.totalDynamicAdjustment | number:'1.2-2' }}
                </span>
              </div>
              <div class="result-row total">
                <span>Final Quoted Amount:</span>
                <span class="price-large">\${{ quoteResult.totalQuotedAmount | number:'1.2-2' }}</span>
              </div>
            </div>

            <div *ngIf="quoteResult.dailyBreakdown?.length" class="daily-table">
              <h5>Daily Breakdown</h5>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Base</th>
                    <th>Wknd</th>
                    <th>Seas</th>
                    <th>Occ</th>
                    <th>Daily Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let day of quoteResult.dailyBreakdown">
                    <td>{{ day.date }}</td>
                    <td>\${{ day.basePrice }}</td>
                    <td>{{ day.weekendMultiplier }}x</td>
                    <td>{{ day.seasonalMultiplier }}x</td>
                    <td>{{ day.occupancyMultiplier }}x</td>
                    <td><strong>\${{ day.finalDailyRate | number:'1.2-2' }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Rate Modal -->
      <div *ngIf="showRateModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingRate ? 'Edit Rate Rule' : 'New Rate Configuration' }}</h3>
            <button class="close-btn" (click)="closeRateModal()">&times;</button>
          </div>
          <form [formGroup]="rateForm" (ngSubmit)="saveRate()">
            <div class="modal-body">
              <div class="form-group" *ngIf="!editingRate">
                <label>Room Category *</label>
                <select formControlName="categoryId" class="form-control">
                  <option value="" disabled>Select Category</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Base Price ($) *</label>
                <input type="number" formControlName="basePrice" class="form-control" min="0" step="0.01" />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Weekend Mult. (e.g. 1.2)</label>
                  <input type="number" formControlName="weekendMultiplier" class="form-control" step="0.05" min="0.5" />
                </div>
                <div class="form-group col">
                  <label>Seasonal Mult. (e.g. 1.15)</label>
                  <input type="number" formControlName="seasonalMultiplier" class="form-control" step="0.05" min="0.5" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>High Occupancy Mult. (e.g. 1.25)</label>
                  <input type="number" formControlName="highOccupancyMultiplier" class="form-control" step="0.05" min="0.5" />
                </div>
                <div class="form-group col">
                  <label>Low Occupancy Mult. (e.g. 0.9)</label>
                  <input type="number" formControlName="lowOccupancyMultiplier" class="form-control" step="0.05" min="0.5" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeRateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="rateForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Save Rate' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Confirm Delete Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Delete Rate Rule"
        [message]="deleteMessage"
        (confirm)="executeDelete()"
        (cancel)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .rates-layout {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .rates-layout {
        grid-template-columns: 1fr;
      }
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
    }
    .quote-form {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
    }
    .quote-result {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }
    .quote-result h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .result-summary {
      background: var(--bg-hover);
      padding: 1rem;
      border-radius: var(--radius);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
    }
    .result-row.total {
      border-top: 1px solid var(--border-color);
      padding-top: 0.5rem;
      margin-top: 0.25rem;
      font-size: 1rem;
    }
    .price-large {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }
    .daily-table {
      margin-top: 1rem;
    }
    .daily-table h5 {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .daily-table table {
      width: 100%;
      font-size: 0.75rem;
      border-collapse: collapse;
    }
    .daily-table th, .daily-table td {
      padding: 0.35rem 0.5rem;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .action-buttons {
      display: flex;
      gap: 0.35rem;
    }
    .price {
      font-weight: 700;
      color: var(--primary);
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
    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `]
})
export class RatesComponent implements OnInit {
  private rateService = inject(RateService);
  private roomService = inject(RoomService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationUiService);

  rates: RateResponse[] = [];
  categories: RoomCategoryResponse[] = [];
  loading = false;
  submitting = false;
  quoting = false;

  quoteResult: RateQuoteResponse | null = null;

  showRateModal = false;
  editingRate: RateResponse | null = null;
  rateForm: FormGroup;
  quoteForm: FormGroup;

  showDeleteModal = false;
  deleteMessage = '';
  deleteAction: (() => void) | null = null;

  constructor() {
    this.rateForm = this.fb.group({
      categoryId: ['', Validators.required],
      basePrice: [120, [Validators.required, Validators.min(0)]],
      weekendMultiplier: [1.2, [Validators.required, Validators.min(0.5)]],
      seasonalMultiplier: [1.1, [Validators.required, Validators.min(0.5)]],
      highOccupancyMultiplier: [1.25, [Validators.required, Validators.min(0.5)]],
      lowOccupancyMultiplier: [0.9, [Validators.required, Validators.min(0.5)]]
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);

    this.quoteForm = this.fb.group({
      categoryId: ['', Validators.required],
      checkInDate: [tomorrow.toISOString().split('T')[0], Validators.required],
      checkOutDate: [dayAfter.toISOString().split('T')[0], Validators.required],
      guestsCount: [2, [Validators.required, Validators.min(1)]],
      currentOccupancyPercentage: [75, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.roomService.getAllCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (cats.length > 0 && !this.quoteForm.get('categoryId')?.value) {
          this.quoteForm.patchValue({ categoryId: cats[0].id });
        }
        this.rateService.getAllRates().subscribe({
          next: (rates) => {
            this.rates = rates;
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.notify.error('Failed to load rates: ' + (err.error?.message || err.message));
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load categories: ' + (err.error?.message || err.message));
      }
    });
  }

  getCategoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name : `Category #${id}`;
  }

  openRateModal(rate?: RateResponse): void {
    if (rate) {
      this.editingRate = rate;
      this.rateForm.patchValue({
        categoryId: rate.categoryId,
        basePrice: rate.basePrice,
        weekendMultiplier: rate.weekendMultiplier,
        seasonalMultiplier: rate.seasonalMultiplier,
        highOccupancyMultiplier: rate.highOccupancyMultiplier,
        lowOccupancyMultiplier: rate.lowOccupancyMultiplier
      });
      this.rateForm.get('categoryId')?.disable();
    } else {
      this.editingRate = null;
      this.rateForm.reset({
        categoryId: this.categories.length > 0 ? this.categories[0].id : '',
        basePrice: 120,
        weekendMultiplier: 1.2,
        seasonalMultiplier: 1.1,
        highOccupancyMultiplier: 1.25,
        lowOccupancyMultiplier: 0.9
      });
      this.rateForm.get('categoryId')?.enable();
    }
    this.showRateModal = true;
  }

  closeRateModal(): void {
    this.showRateModal = false;
    this.editingRate = null;
  }

  saveRate(): void {
    if (this.rateForm.invalid) return;
    this.submitting = true;
    const rawValue = this.rateForm.getRawValue();

    if (this.editingRate) {
      this.rateService.updateRate(this.editingRate.id, rawValue).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Rate rule updated successfully');
          this.closeRateModal();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Failed to update rate: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.rateService.createRate(rawValue).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Rate rule created successfully');
          this.closeRateModal();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Failed to create rate: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  confirmDeleteRate(rate: RateResponse): void {
    this.deleteMessage = `Are you sure you want to delete rate configuration for category "${this.getCategoryName(rate.categoryId)}"?`;
    this.deleteAction = () => {
      this.rateService.deleteRate(rate.id).subscribe({
        next: () => {
          this.notify.success('Rate deleted');
          this.showDeleteModal = false;
          this.loadData();
        },
        error: (err) => {
          this.showDeleteModal = false;
          this.notify.error('Failed to delete rate: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showDeleteModal = true;
  }

  calculateQuote(): void {
    if (this.quoteForm.invalid) return;
    this.quoting = true;
    const req = this.quoteForm.value;

    this.rateService.calculateQuote(req).subscribe({
      next: (res) => {
        this.quoteResult = res;
        this.quoting = false;
        this.notify.success('Backend quote calculated successfully');
      },
      error: (err) => {
        this.quoting = false;
        this.notify.error('Quote calculation error: ' + (err.error?.message || err.message));
      }
    });
  }

  executeDelete(): void {
    if (this.deleteAction) {
      this.deleteAction();
    }
  }
}
