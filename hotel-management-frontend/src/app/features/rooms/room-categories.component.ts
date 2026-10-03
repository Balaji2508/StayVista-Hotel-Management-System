import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomService } from '../../core/services/room.service';
import { RoomCategoryResponse, AmenityResponse } from '../../core/models/room.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-room-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="categories-page">
      <app-page-header
        title="Categories & Amenities"
        subtitle="Configure room tiers, pricing structures, and included amenities"
      >
        <div class="btn-group">
          <button
            class="btn btn-outline"
            (click)="activeTab = 'categories'"
            [class.btn-primary]="activeTab === 'categories'"
          >
            Room Categories
          </button>
          <button
            class="btn btn-outline"
            (click)="activeTab = 'amenities'"
            [class.btn-primary]="activeTab === 'amenities'"
          >
            Amenities
          </button>
          <button
            class="btn btn-primary"
            (click)="activeTab === 'categories' ? openCategoryModal() : openAmenityModal()"
          >
            + Add {{ activeTab === 'categories' ? 'Category' : 'Amenity' }}
          </button>
        </div>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Categories Tab -->
      <div *ngIf="!loading && activeTab === 'categories'" class="tab-content">
        <div class="grid-cards">
          <div *ngFor="let cat of categories" class="card category-card">
            <div class="category-header">
              <h3>{{ cat.name }}</h3>
              <span class="badge" [class.badge-success]="cat.active" [class.badge-secondary]="!cat.active">
                {{ cat.active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p class="description">{{ cat.description || 'No description provided' }}</p>
            <div class="spec-row">
              <span class="spec-label">Base Price:</span>
              <span class="spec-value price">\${{ cat.basePrice | number:'1.2-2' }}/night</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Max Occupancy:</span>
              <span class="spec-value">{{ cat.maxOccupancy }} Persons</span>
            </div>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" (click)="openCategoryModal(cat)">Edit</button>
              <button class="btn btn-sm btn-danger" (click)="confirmDeleteCategory(cat)">Delete</button>
            </div>
          </div>
        </div>
        <div *ngIf="categories.length === 0" class="empty-state">
          <p>No room categories defined yet.</p>
        </div>
      </div>

      <!-- Amenities Tab -->
      <div *ngIf="!loading && activeTab === 'amenities'" class="tab-content">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amenity Name</th>
                <th>Description</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of amenities">
                <td>#{{ a.id }}</td>
                <td><strong>{{ a.name }}</strong></td>
                <td>{{ a.description || '-' }}</td>
                <td>\${{ a.cost ? (a.cost | number:'1.2-2') : '0.00' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="a.active" [class.badge-secondary]="!a.active">
                    {{ a.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline" (click)="openAmenityModal(a)">Edit</button>
                  <button class="btn btn-sm btn-danger" (click)="confirmDeleteAmenity(a)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="amenities.length === 0">
                <td colspan="6" class="text-center">No amenities found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Category Modal -->
      <div *ngIf="showCategoryModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingCategory ? 'Edit Category' : 'Create Room Category' }}</h3>
            <button class="close-btn" (click)="closeCategoryModal()">&times;</button>
          </div>
          <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
            <div class="modal-body">
              <div class="form-group">
                <label>Category Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. Deluxe Suite" />
                <span *ngIf="categoryForm.get('name')?.touched && categoryForm.get('name')?.invalid" class="error-text">
                  Category name is required
                </span>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea formControlName="description" class="form-control" rows="3" placeholder="Category details..."></textarea>
              </div>
              <div class="form-row">
                <div class="form-group col">
                  <label>Base Price ($) *</label>
                  <input type="number" formControlName="basePrice" class="form-control" min="0" step="0.01" />
                </div>
                <div class="form-group col">
                  <label>Max Occupancy *</label>
                  <input type="number" formControlName="maxOccupancy" class="form-control" min="1" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCategoryModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="categoryForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Save Category' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Amenity Modal -->
      <div *ngIf="showAmenityModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingAmenity ? 'Edit Amenity' : 'Create Amenity' }}</h3>
            <button class="close-btn" (click)="closeAmenityModal()">&times;</button>
          </div>
          <form [formGroup]="amenityForm" (ngSubmit)="saveAmenity()">
            <div class="modal-body">
              <div class="form-group">
                <label>Amenity Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. High-Speed WiFi" />
                <span *ngIf="amenityForm.get('name')?.touched && amenityForm.get('name')?.invalid" class="error-text">
                  Amenity name is required
                </span>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea formControlName="description" class="form-control" rows="2" placeholder="Description..."></textarea>
              </div>
              <div class="form-group">
                <label>Cost / Night ($)</label>
                <input type="number" formControlName="cost" class="form-control" min="0" step="0.01" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeAmenityModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="amenityForm.invalid || submitting">
                {{ submitting ? 'Saving...' : 'Save Amenity' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Confirm Delete Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Confirm Deletion"
        [message]="deleteMessage"
        (confirm)="executeDelete()"
        (cancel)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .grid-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .category-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .description {
      color: var(--text-muted);
      font-size: 0.875rem;
      flex: 1;
    }
    .spec-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.875rem;
    }
    .spec-label {
      color: var(--text-muted);
    }
    .spec-value {
      font-weight: 600;
      color: var(--text-primary);
    }
    .price {
      color: var(--primary);
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .btn-group {
      display: flex;
      gap: 0.5rem;
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
      gap: 1rem;
    }
    .col {
      flex: 1;
    }
    .error-text {
      color: var(--danger);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
  `]
})
export class RoomCategoriesComponent implements OnInit {
  private roomService = inject(RoomService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationUiService);

  activeTab: 'categories' | 'amenities' = 'categories';
  categories: RoomCategoryResponse[] = [];
  amenities: AmenityResponse[] = [];
  loading = false;
  submitting = false;

  showCategoryModal = false;
  editingCategory: RoomCategoryResponse | null = null;
  categoryForm: FormGroup;

  showAmenityModal = false;
  editingAmenity: AmenityResponse | null = null;
  amenityForm: FormGroup;

  showDeleteModal = false;
  deleteMessage = '';
  deleteAction: (() => void) | null = null;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      basePrice: [100, [Validators.required, Validators.min(0)]],
      maxOccupancy: [2, [Validators.required, Validators.min(1)]]
    });

    this.amenityForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      cost: [0, [Validators.min(0)]]
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
        this.roomService.getAllAmenities().subscribe({
          next: (ams) => {
            this.amenities = ams;
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.notify.error('Failed to load amenities: ' + (err.error?.message || err.message));
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load categories: ' + (err.error?.message || err.message));
      }
    });
  }

  openCategoryModal(cat?: RoomCategoryResponse): void {
    if (cat) {
      this.editingCategory = cat;
      this.categoryForm.patchValue({
        name: cat.name,
        description: cat.description,
        basePrice: cat.basePrice,
        maxOccupancy: cat.maxOccupancy
      });
    } else {
      this.editingCategory = null;
      this.categoryForm.reset({
        basePrice: 100,
        maxOccupancy: 2
      });
    }
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;
    this.submitting = true;
    const req = this.categoryForm.value;

    if (this.editingCategory) {
      this.roomService.updateCategory(this.editingCategory.id, req).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Category updated successfully');
          this.closeCategoryModal();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Failed to update category: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.roomService.createCategory(req).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Category created successfully');
          this.closeCategoryModal();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Failed to create category: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  confirmDeleteCategory(cat: RoomCategoryResponse): void {
    this.deleteMessage = `Are you sure you want to delete category "${cat.name}"?`;
    this.deleteAction = () => {
      this.roomService.deleteCategory(cat.id).subscribe({
        next: () => {
          this.notify.success('Category deleted');
          this.showDeleteModal = false;
          this.loadData();
        },
        error: (err) => {
          this.showDeleteModal = false;
          this.notify.error('Failed to delete category: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showDeleteModal = true;
  }

  openAmenityModal(amenity?: AmenityResponse): void {
    if (amenity) {
      this.editingAmenity = amenity;
      this.amenityForm.patchValue({
        name: amenity.name,
        description: amenity.description,
        cost: amenity.cost || 0
      });
    } else {
      this.editingAmenity = null;
      this.amenityForm.reset({ cost: 0 });
    }
    this.showAmenityModal = true;
  }

  closeAmenityModal(): void {
    this.showAmenityModal = false;
    this.editingAmenity = null;
  }

  saveAmenity(): void {
    if (this.amenityForm.invalid) return;
    this.submitting = true;
    const req = this.amenityForm.value;

    if (this.editingAmenity) {
      this.roomService.updateAmenity(this.editingAmenity.id, req).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Amenity updated successfully');
          this.closeAmenityModal();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Failed to update amenity: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.roomService.createAmenity(req).subscribe({
        next: () => {
          this.submitting = false;
          this.notify.success('Amenity created successfully');
          this.closeAmenityModal();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.notify.error('Failed to create amenity: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  confirmDeleteAmenity(a: AmenityResponse): void {
    this.deleteMessage = `Are you sure you want to delete amenity "${a.name}"?`;
    this.deleteAction = () => {
      this.roomService.deleteAmenity(a.id).subscribe({
        next: () => {
          this.notify.success('Amenity deleted');
          this.showDeleteModal = false;
          this.loadData();
        },
        error: (err) => {
          this.showDeleteModal = false;
          this.notify.error('Failed to delete amenity: ' + (err.error?.message || err.message));
        }
      });
    };
    this.showDeleteModal = true;
  }

  executeDelete(): void {
    if (this.deleteAction) {
      this.deleteAction();
    }
  }
}
