import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import {
  InventoryCategory,
  ItemResponse,
  StockMovementResponse,
  ReorderRuleResponse
} from '../../core/models/inventory.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-inventory-list',
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
    <div class="inventory-page">
      <app-page-header
        title="Inventory & Warehouse Operations"
        subtitle="Track hotel stock levels, monitor low-stock thresholds, record stock movements, and automate reorder rules"
      >
        <div class="header-actions">
          <a routerLink="/purchase/requests" class="btn btn-outline">Procurement & PRs</a>
          <button class="btn btn-primary" (click)="openItemModal()">+ Add New Item</button>
        </div>
      </app-page-header>

      <!-- Category & Search Bar -->
      <div class="card filter-bar">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search items by name, code..."
            class="form-control"
          />
        </div>
        <div class="category-filters">
          <button
            class="filter-pill"
            [class.active]="selectedCategory === 'ALL' && !showOnlyLowStock"
            (click)="setCategory('ALL')"
          >
            All Items
          </button>
          <button
            class="filter-pill pill-warning"
            [class.active]="showOnlyLowStock"
            (click)="toggleLowStockOnly()"
          >
            ⚠️ Low Stock Alert ({{ lowStockCount }})
          </button>
          <button
            *ngFor="let cat of categories"
            class="filter-pill"
            [class.active]="selectedCategory === cat && !showOnlyLowStock"
            (click)="setCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Inventory Table -->
      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Threshold</th>
                <th>Unit</th>
                <th>Unit Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredItems" [class.low-stock-row]="item.currentStock <= item.minThreshold">
                <td><code>{{ item.itemCode }}</code></td>
                <td>
                  <strong>{{ item.name }}</strong>
                  <div class="sub-text" *ngIf="item.description">{{ item.description }}</div>
                </td>
                <td><span class="category-tag">{{ item.category }}</span></td>
                <td>
                  <span class="stock-value" [class.text-danger]="item.currentStock <= item.minThreshold">
                    {{ item.currentStock }}
                  </span>
                  <span *ngIf="item.currentStock <= item.minThreshold" class="low-stock-badge">LOW</span>
                </td>
                <td>{{ item.minThreshold }}</td>
                <td>{{ item.unit }}</td>
                <td>\${{ item.unitCost | number:'1.2-2' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="item.active" [class.badge-secondary]="!item.active">
                    {{ item.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" (click)="openMovementModal(item, 'STOCK_IN')" title="Add Stock">
                      + IN
                    </button>
                    <button class="btn btn-sm btn-outline" (click)="openMovementModal(item, 'STOCK_OUT')" title="Consume Stock">
                      - OUT
                    </button>
                    <button class="btn btn-sm btn-outline" (click)="openMovementModal(item, 'ADJUSTMENT')" title="Audit Adjust">
                      Adjust
                    </button>
                    <button class="btn btn-sm btn-outline" (click)="viewHistory(item)" title="Ledger">
                      History
                    </button>
                    <button class="btn btn-sm btn-outline" (click)="openItemModal(item)">Edit</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmDelete(item)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredItems.length === 0">
                <td colspan="9" class="text-center py-4">No inventory items found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Item Create/Edit Modal -->
      <div *ngIf="showItemModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingItem ? 'Edit Item' : 'New Warehouse Item' }}</h3>
            <button class="close-btn" (click)="showItemModal = false">&times;</button>
          </div>
          <form [formGroup]="itemForm" (ngSubmit)="saveItem()">
            <div class="modal-body">
              <div class="form-group">
                <label>Item Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. King Bed Sheets, Towels" />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label>Category *</label>
                  <select formControlName="category" class="form-control">
                    <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                  </select>
                </div>
                <div class="form-group col">
                  <label>Unit of Measure *</label>
                  <input type="text" formControlName="unit" class="form-control" placeholder="PCS, KG, BOX" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col" *ngIf="!editingItem">
                  <label>Initial Stock *</label>
                  <input type="number" formControlName="currentStock" class="form-control" min="0" />
                </div>
                <div class="form-group col">
                  <label>Min Threshold *</label>
                  <input type="number" formControlName="minThreshold" class="form-control" min="0" />
                </div>
                <div class="form-group col">
                  <label>Unit Cost ($) *</label>
                  <input type="number" formControlName="unitCost" class="form-control" min="0" step="0.01" />
                </div>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea formControlName="description" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showItemModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="itemForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Save Item' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Stock Movement Modal (IN / OUT / ADJUST) -->
      <div *ngIf="showMovementModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ movementType === 'STOCK_IN' ? 'Stock IN' : (movementType === 'STOCK_OUT' ? 'Stock OUT' : 'Audit Adjustment') }}</h3>
            <button class="close-btn" (click)="showMovementModal = false">&times;</button>
          </div>
          <form [formGroup]="movementForm" (ngSubmit)="executeMovement()">
            <div class="modal-body">
              <p>Item: <strong>{{ targetItem?.name }}</strong> (Current: {{ targetItem?.currentStock }} {{ targetItem?.unit }})</p>

              <div class="form-group">
                <label>Quantity *</label>
                <input type="number" formControlName="quantity" class="form-control" min="1" />
              </div>

              <div class="form-group">
                <label>Reason / Department *</label>
                <input type="text" formControlName="reason" class="form-control" placeholder="Housekeeping replenishment, damaged, audit..." />
              </div>

              <div class="form-group">
                <label>Reference # (PO/GRN/Note)</label>
                <input type="text" formControlName="referenceNumber" class="form-control" placeholder="e.g. REF-2026-001" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showMovementModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="movementForm.invalid || submitting">
                {{ submitting ? 'Processing...' : 'Apply Movement' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- History Modal -->
      <div *ngIf="showHistoryModal" class="modal-backdrop">
        <div class="modal-dialog history-dialog">
          <div class="modal-header">
            <h3>Movement Ledger: {{ targetItem?.name }}</h3>
            <button class="close-btn" (click)="showHistoryModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Prev → New</th>
                    <th>Reason / Ref</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let m of movements">
                    <td>{{ m.timestamp | date:'short' }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="m.movementType === 'STOCK_IN'" [class.badge-warning]="m.movementType === 'STOCK_OUT'">
                        {{ m.movementType }}
                      </span>
                    </td>
                    <td><strong>{{ m.quantity }}</strong></td>
                    <td>{{ m.previousStock }} → {{ m.newStock }}</td>
                    <td>{{ m.reason }} <small *ngIf="m.referenceNumber">({{ m.referenceNumber }})</small></td>
                  </tr>
                  <tr *ngIf="movements.length === 0">
                    <td colspan="5" class="text-center py-3">No movements recorded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showHistoryModal = false">Close</button>
          </div>
        </div>
      </div>

      <!-- Delete Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Delete Item"
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
    .category-filters {
      display: flex;
      flex-wrap: wrap;
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
    .pill-warning {
      border-color: #f59e0b;
      color: #b45309;
    }
    .pill-warning.active {
      background: #f59e0b;
      color: white;
      border-color: #f59e0b;
    }
    .low-stock-row {
      background-color: rgba(239, 68, 68, 0.05);
    }
    .low-stock-badge {
      display: inline-block;
      margin-left: 0.4rem;
      background: var(--danger);
      color: white;
      font-size: 0.65rem;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      font-weight: 700;
    }
    .stock-value {
      font-weight: 700;
      font-size: 1rem;
    }
    .category-tag {
      font-size: 0.75rem;
      padding: 0.2rem 0.45rem;
      background: var(--bg-hover);
      border-radius: 4px;
      font-weight: 600;
    }
    .sub-text {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .action-buttons {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;
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
    .history-dialog {
      max-width: 700px;
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
export class InventoryListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private notify = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  items: ItemResponse[] = [];
  loading = false;
  submitting = false;
  searchQuery = '';
  selectedCategory = 'ALL';
  showOnlyLowStock = false;

  categories: InventoryCategory[] = [
    'LINEN',
    'TOILETRY',
    'FOOD_BEVERAGE',
    'CLEANING',
    'MAINTENANCE',
    'OFFICE',
    'OTHER'
  ];

  // Item Modal
  showItemModal = false;
  editingItem: ItemResponse | null = null;
  itemForm: FormGroup;

  // Movement Modal
  showMovementModal = false;
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' = 'STOCK_IN';
  targetItem: ItemResponse | null = null;
  movementForm: FormGroup;

  // History Modal
  showHistoryModal = false;
  movements: StockMovementResponse[] = [];

  // Delete
  showDeleteModal = false;
  deleteMessage = '';
  selectedId: number | null = null;

  constructor() {
    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      category: ['LINEN', Validators.required],
      description: [''],
      currentStock: [50, [Validators.required, Validators.min(0)]],
      minThreshold: [15, [Validators.required, Validators.min(0)]],
      unit: ['PCS', Validators.required],
      unitCost: [12.5, [Validators.required, Validators.min(0)]]
    });

    this.movementForm = this.fb.group({
      quantity: [10, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      referenceNumber: ['']
    });
  }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    const cat = this.selectedCategory !== 'ALL' ? (this.selectedCategory as InventoryCategory) : undefined;
    this.inventoryService.getAllItems(cat).subscribe({
      next: (list) => {
        this.items = list;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load inventory: ' + (err.error?.message || err.message));
      }
    });
  }

  get lowStockCount(): number {
    return this.items.filter(i => i.currentStock <= i.minThreshold).length;
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
    this.showOnlyLowStock = false;
    this.loadItems();
  }

  toggleLowStockOnly(): void {
    this.showOnlyLowStock = !this.showOnlyLowStock;
  }

  get filteredItems(): ItemResponse[] {
    return this.items.filter((item) => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchesLowStock = !this.showOnlyLowStock || item.currentStock <= item.minThreshold;

      return matchesSearch && matchesLowStock;
    });
  }

  openItemModal(item?: ItemResponse): void {
    if (item) {
      this.editingItem = item;
      this.itemForm.patchValue({
        name: item.name,
        category: item.category,
        description: item.description,
        minThreshold: item.minThreshold,
        unit: item.unit,
        unitCost: item.unitCost
      });
      this.itemForm.get('currentStock')?.disable();
    } else {
      this.editingItem = null;
      this.itemForm.reset({
        category: 'LINEN',
        currentStock: 50,
        minThreshold: 15,
        unit: 'PCS',
        unitCost: 10
      });
      this.itemForm.get('currentStock')?.enable();
    }
    this.showItemModal = true;
  }

  saveItem(): void {
    if (this.itemForm.invalid) return;
    this.submitting = true;
    const val = this.itemForm.getRawValue();

    if (this.editingItem) {
      this.inventoryService.updateItem(this.editingItem.id, val).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Item updated');
          this.showItemModal = false;
          this.loadItems();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Update failed: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.inventoryService.createItem(val).subscribe({
        next: (created) => {
          this.submitting = false;
          this.notify.success(`Item created! Code: ${created.itemCode}`);
          this.showItemModal = false;
          this.loadItems();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Creation failed: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  openMovementModal(item: ItemResponse, type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'): void {
    this.targetItem = item;
    this.movementType = type;
    this.movementForm.reset({
      quantity: 10,
      reason: type === 'STOCK_IN' ? 'Restocking shipment' : (type === 'STOCK_OUT' ? 'Usage replenishment' : 'Stock Audit'),
      referenceNumber: ''
    });
    this.showMovementModal = true;
  }

  executeMovement(): void {
    if (this.movementForm.invalid || !this.targetItem) return;
    this.submitting = true;
    const req = this.movementForm.value;

    let obs;
    if (this.movementType === 'STOCK_IN') {
      obs = this.inventoryService.stockIn(this.targetItem.id, req);
    } else if (this.movementType === 'STOCK_OUT') {
      obs = this.inventoryService.stockOut(this.targetItem.id, req);
    } else {
      obs = this.inventoryService.adjustStock(this.targetItem.id, req);
    }

    obs.subscribe({
      next: (mov) => {
        this.submitting = false;
        this.notify.success(`Stock updated! New level: ${mov.newStock}`);
        this.showMovementModal = false;
        this.loadItems();
      },
      error: (err) => {
        this.submitting = false;
        this.notify.error('Stock movement failed: ' + (err.error?.message || err.message));
      }
    });
  }

  viewHistory(item: ItemResponse): void {
    this.targetItem = item;
    this.inventoryService.getMovementsByItem(item.id).subscribe({
      next: (movs) => {
        this.movements = movs;
        this.showHistoryModal = true;
      },
      error: (err) => {
        this.notify.error('Failed to load movements: ' + (err.error?.message || err.message));
      }
    });
  }

  confirmDelete(item: ItemResponse): void {
    this.selectedId = item.id;
    this.deleteMessage = `Are you sure you want to delete item "${item.name}" (${item.itemCode})?`;
    this.showDeleteModal = true;
  }

  executeDelete(): void {
    if (!this.selectedId) return;
    this.inventoryService.deleteItem(this.selectedId).subscribe({
      next: () => {
        this.notify.success('Item deleted');
        this.showDeleteModal = false;
        this.loadItems();
      },
      error: (err) => {
        this.showDeleteModal = false;
        this.notify.error('Delete failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
