import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RoomService } from '../../core/services/room.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import {
  AmenityResponse,
  RoomCategoryResponse,
  RoomResponse,
  RoomStatus
} from '../../core/models/room.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent,
    HasRoleDirective,
    IconComponent
  ],
  template: `
    <div class="content-wrapper">
      <app-page-header
        title="Rooms Management"
        subtitle="Live status, physical room inventory, and occupancy states"
      >
        <button
          *hasRole="['ADMIN', 'OWNER', 'MANAGER']"
          class="btn btn-primary"
          (click)="openCreateModal()"
        >
          <app-icon name="plus" [size]="15"></app-icon>
          <span>Add Room</span>
        </button>
      </app-page-header>

      <!-- Filter Controls -->
      <div class="card" style="padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
        <div class="filter-bar" style="margin-bottom: 0;">
          <div class="filter-group">
            <select class="form-control" [(ngModel)]="statusFilter" style="width: 160px;">
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="DIRTY">Dirty</option>
              <option value="CLEANING">Cleaning</option>
              <option value="CLEAN">Clean</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            <select class="form-control" [(ngModel)]="categoryFilter" style="width: 180px;">
              <option value="ALL">All Categories</option>
              <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
            </select>

            <input
              type="text"
              class="form-control"
              placeholder="Search room number..."
              [(ngModel)]="searchNumber"
              style="width: 180px;"
            />
          </div>

          <div class="filter-group">
            <span class="text-muted" style="font-size: 0.8125rem;">
              Showing <strong>{{ filteredRooms.length }}</strong> rooms
            </span>
          </div>
        </div>
      </div>

      <app-loading-spinner *ngIf="isLoading" message="Loading hotel rooms..."></app-loading-spinner>

      <!-- Room Cards Grid -->
      <div class="rooms-grid" *ngIf="!isLoading">
        <div *ngFor="let room of filteredRooms" class="room-card" [class.inactive]="!room.active">
          <div class="room-card-header">
            <div class="room-number">
              <span class="num">{{ room.roomNumber }}</span>
              <span class="floor">Floor {{ room.floor }}</span>
            </div>
            <app-status-badge [status]="room.status"></app-status-badge>
          </div>

          <div class="room-card-body">
            <div class="room-info-row">
              <span class="label">Category:</span>
              <span class="val"><strong>{{ room.category.name }}</strong></span>
            </div>
            <div class="room-info-row">
              <span class="label">Capacity:</span>
              <span class="val">{{ room.capacity }} Guests</span>
            </div>
            <div class="room-info-row">
              <span class="label">Base Price:</span>
              <span class="val price">{{ room.pricePerNight | currency }}/night</span>
            </div>

            <!-- Amenities -->
            <div class="amenities-list" *ngIf="room.amenities && room.amenities.length > 0">
              <span *ngFor="let a of room.amenities" class="amenity-chip">
                {{ a.name }}
              </span>
            </div>
          </div>

          <div class="room-card-footer">
            <!-- Quick Status Change Dropdown -->
            <select
              class="form-control form-control-sm"
              [ngModel]="room.status"
              (ngModelChange)="changeStatus(room, $event)"
              style="font-size: 0.75rem; height: 32px;"
            >
              <option value="AVAILABLE">Mark Available</option>
              <option value="CLEAN">Mark Clean</option>
              <option value="CLEANING">Mark Cleaning</option>
              <option value="DIRTY">Mark Dirty</option>
              <option value="MAINTENANCE">Mark Maintenance</option>
            </select>

            <div class="actions" *hasRole="['ADMIN', 'OWNER', 'MANAGER']">
              <button class="btn btn-sm btn-secondary" (click)="openEditModal(room)">Edit</button>
              <button
                *hasRole="['ADMIN', 'OWNER']"
                class="btn btn-sm btn-danger"
                (click)="confirmDelete(room)"
                title="Delete Room"
              >
                <app-icon name="trash" [size]="14"></app-icon>
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="filteredRooms.length === 0" class="card" style="grid-column: 1 / -1;">
          <div class="empty-state">
            <div class="empty-state-icon">
              <app-icon name="bed" [size]="36" color="#94a3b8"></app-icon>
            </div>
            <p class="empty-state-text">No rooms found matching the selected filters.</p>
          </div>
        </div>
      </div>

      <!-- Create / Edit Room Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingRoom ? 'Edit Room' : 'Add New Room' }}</h3>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="roomForm" (ngSubmit)="saveRoom()">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label for="roomNumber">Room Number *</label>
                  <input id="roomNumber" type="text" class="form-control" formControlName="roomNumber" placeholder="e.g. 101" />
                </div>

                <div class="form-group">
                  <label for="categoryId">Category *</label>
                  <select id="categoryId" class="form-control" formControlName="categoryId">
                    <option value="">Select Category</option>
                    <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }} (\${{ cat.basePrice }})</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="floor">Floor *</label>
                  <input id="floor" type="number" class="form-control" formControlName="floor" min="1" />
                </div>

                <div class="form-group">
                  <label for="capacity">Capacity (Guests) *</label>
                  <input id="capacity" type="number" class="form-control" formControlName="capacity" min="1" />
                </div>

                <div class="form-group">
                  <label for="pricePerNight">Price Per Night ($) *</label>
                  <input id="pricePerNight" type="number" step="0.01" class="form-control" formControlName="pricePerNight" />
                </div>

                <div class="form-group full-width">
                  <label>Amenities</label>
                  <div class="amenities-checkbox-grid">
                    <label *ngFor="let a of allAmenities" class="checkbox-label">
                      <input
                        type="checkbox"
                        [checked]="isAmenitySelected(a.id)"
                        (change)="toggleAmenity(a.id)"
                      />
                      <span>{{ a.name }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="roomForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : (editingRoom ? 'Update Room' : 'Create Room') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Room Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Delete Room"
        [message]="'Are you sure you want to delete Room ' + (roomToDelete?.roomNumber || '') + '?'"
        confirmText="Delete Room"
        [isDanger]="true"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
  styles: [`
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .room-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .room-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .room-card.inactive {
      opacity: 0.6;
    }

    .room-card-header {
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .room-number {
      display: flex;
      flex-direction: column;
    }
    .room-number .num {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }
    .room-number .floor {
      font-size: 0.75rem;
      color: #64748b;
    }

    .room-card-body {
      padding: 1.25rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .room-info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
    }
    .room-info-row .label { color: #64748b; }
    .room-info-row .val { color: #1e293b; }
    .room-info-row .val.price { color: #2563eb; font-weight: 700; }

    .amenities-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.5rem;
    }
    .amenity-chip {
      font-size: 0.6875rem;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .room-card-footer {
      padding: 0.875rem 1.25rem;
      background: #fafafa;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .actions {
      display: flex;
      gap: 0.375rem;
    }

    .amenities-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.5rem;
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-box {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 580px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-title { font-size: 1.125rem; font-weight: 700; margin: 0; }
    .modal-close { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body { padding: 1.5rem; max-height: 70vh; overflow-y: auto; }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
  `]
})
export class RoomListComponent implements OnInit {
  private roomService = inject(RoomService);
  public authService = inject(AuthService);
  private notificationService = inject(NotificationUiService);
  private fb = inject(FormBuilder);

  rooms: RoomResponse[] = [];
  categories: RoomCategoryResponse[] = [];
  allAmenities: AmenityResponse[] = [];

  statusFilter = 'ALL';
  categoryFilter = 'ALL';
  searchNumber = '';

  isLoading = true;
  isSaving = false;

  showModal = false;
  editingRoom: RoomResponse | null = null;
  selectedAmenityIds: Set<number> = new Set();

  showDeleteModal = false;
  roomToDelete: RoomResponse | null = null;

  roomForm = this.fb.group({
    roomNumber: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    floor: [1, [Validators.required, Validators.min(1)]],
    capacity: [2, [Validators.required, Validators.min(1)]],
    pricePerNight: [150.00, [Validators.required, Validators.min(1)]]
  });

  get filteredRooms(): RoomResponse[] {
    return this.rooms.filter(r => {
      const matchStatus = this.statusFilter === 'ALL' || r.status === this.statusFilter;
      const matchCat = this.categoryFilter === 'ALL' || r.category?.id?.toString() === this.categoryFilter;
      const matchNum = !this.searchNumber || r.roomNumber.toLowerCase().includes(this.searchNumber.toLowerCase());
      return matchStatus && matchCat && matchNum;
    });
  }

  ngOnInit(): void {
    this.loadRoomsAndMeta();
  }

  loadRoomsAndMeta(): void {
    this.isLoading = true;
    this.roomService.getAllCategories().subscribe({
      next: (cats) => this.categories = cats
    });

    this.roomService.getAllAmenities().subscribe({
      next: (ams) => this.allAmenities = ams
    });

    this.roomService.getAllRooms(true).subscribe({
      next: (data) => {
        this.rooms = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  changeStatus(room: RoomResponse, newStatus: RoomStatus): void {
    if (room.status === newStatus) return;
    this.roomService.updateRoomStatus(room.id, {
      status: newStatus,
      remarks: 'Status updated via HMS Room Management'
    }).subscribe({
      next: (updated) => {
        room.status = updated.status;
        this.notificationService.success(`Room ${room.roomNumber} status changed to ${newStatus}`);
      }
    });
  }

  openCreateModal(): void {
    this.editingRoom = null;
    this.selectedAmenityIds.clear();
    this.roomForm.reset({
      roomNumber: '',
      categoryId: this.categories.length > 0 ? (this.categories[0].id as unknown as string) : '',
      floor: 1,
      capacity: 2,
      pricePerNight: 150.00
    });
    this.showModal = true;
  }

  openEditModal(room: RoomResponse): void {
    this.editingRoom = room;
    this.selectedAmenityIds = new Set(room.amenities?.map(a => a.id) || []);
    this.roomForm.patchValue({
      roomNumber: room.roomNumber,
      categoryId: room.category?.id as unknown as string,
      floor: room.floor,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingRoom = null;
  }

  isAmenitySelected(id: number): boolean {
    return this.selectedAmenityIds.has(id);
  }

  toggleAmenity(id: number): void {
    if (this.selectedAmenityIds.has(id)) {
      this.selectedAmenityIds.delete(id);
    } else {
      this.selectedAmenityIds.add(id);
    }
  }

  saveRoom(): void {
    if (this.roomForm.invalid) return;

    this.isSaving = true;
    const formVal = this.roomForm.value;

    const payload = {
      roomNumber: formVal.roomNumber!,
      categoryId: Number(formVal.categoryId),
      floor: Number(formVal.floor),
      capacity: Number(formVal.capacity),
      pricePerNight: Number(formVal.pricePerNight),
      amenityIds: Array.from(this.selectedAmenityIds)
    };

    if (this.editingRoom) {
      this.roomService.updateRoom(this.editingRoom.id, payload).subscribe({
        next: (updated) => {
          this.isSaving = false;
          this.notificationService.success(`Room ${updated.roomNumber} updated successfully.`);
          this.closeModal();
          this.loadRoomsAndMeta();
        },
        error: () => this.isSaving = false
      });
    } else {
      this.roomService.createRoom(payload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.notificationService.success(`Room ${created.roomNumber} created successfully.`);
          this.closeModal();
          this.loadRoomsAndMeta();
        },
        error: () => this.isSaving = false
      });
    }
  }

  confirmDelete(room: RoomResponse): void {
    this.roomToDelete = room;
    this.showDeleteModal = true;
  }

  deleteConfirmed(): void {
    if (!this.roomToDelete) return;
    this.roomService.deleteRoom(this.roomToDelete.id).subscribe({
      next: () => {
        this.notificationService.success('Room deleted successfully.');
        this.showDeleteModal = false;
        this.roomToDelete = null;
        this.loadRoomsAndMeta();
      }
    });
  }
}
