import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../core/services/staff.service';
import { AttendanceResponse, StaffResponse } from '../../core/models/staff.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    IconComponent
  ],
  template: `
    <div class="attendance-page">
      <app-page-header
        title="Staff Attendance & Clocking Ledger"
        subtitle="Record daily staff clock-ins and clock-outs, monitor active work hours, and track shift compliance"
      >
        <div class="header-actions">
          <a routerLink="/staff" class="btn btn-outline">
            <app-icon name="arrow-left" [size]="14"></app-icon>
            <span>Staff Directory</span>
          </a>
          <button class="btn btn-primary" (click)="showClockModal = true">
            <app-icon name="clock" [size]="15"></app-icon>
            <span>Clock In / Out Employee</span>
          </button>
        </div>
      </app-page-header>

      <!-- Date Filter Bar -->
      <div class="card filter-bar">
        <div class="filter-row">
          <div class="form-group">
            <label>Attendance Date</label>
            <input type="date" [(ngModel)]="selectedDate" (change)="loadAttendance()" class="form-control" />
          </div>
          <button class="btn btn-outline" (click)="setToday()">Today</button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- Attendance Table -->
      <div *ngIf="!loading" class="card table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Record #</th>
                <th>Staff Member</th>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Work Hours</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let att of attendanceRecords">
                <td>#{{ att.id }}</td>
                <td>
                  <strong>{{ att.staffName || 'Staff #' + att.staffId }}</strong>
                </td>
                <td>{{ att.date }}</td>
                <td>
                  <span *ngIf="att.checkInTime" class="text-success font-bold">
                    {{ att.checkInTime | date:'shortTime' }}
                  </span>
                  <span *ngIf="!att.checkInTime" class="text-muted">-</span>
                </td>
                <td>
                  <span *ngIf="att.checkOutTime" class="text-info font-bold">
                    {{ att.checkOutTime | date:'shortTime' }}
                  </span>
                  <span *ngIf="!att.checkOutTime" class="text-muted">-</span>
                </td>
                <td>
                  <strong>{{ att.workHours ? (att.workHours + ' hrs') : '-' }}</strong>
                </td>
                <td>
                  <app-status-badge [status]="att.status"></app-status-badge>
                </td>
                <td>{{ att.remarks || '-' }}</td>
              </tr>
              <tr *ngIf="attendanceRecords.length === 0">
                <td colspan="8" class="text-center py-4">No attendance records logged for {{ selectedDate }}.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Clock In/Out Modal -->
      <div *ngIf="showClockModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Clock Action</h3>
            <button class="close-btn" (click)="showClockModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Staff Member *</label>
              <select [(ngModel)]="clockStaffId" class="form-control">
                <option [ngValue]="null" disabled>-- Select Employee --</option>
                <option *ngFor="let s of allStaff" [ngValue]="s.id">
                  {{ s.firstName }} {{ s.lastName }} ({{ s.employeeCode }} - {{ s.role }})
                </option>
              </select>
            </div>
            <p class="help-text">Clocking in will initialize check-in time for today. Clocking out will calculate total work hours.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showClockModal = false">Cancel</button>
            <button class="btn btn-success" (click)="executeClockIn()" [disabled]="!clockStaffId">
              Clock In
            </button>
            <button class="btn btn-warning" (click)="executeClockOut()" [disabled]="!clockStaffId">
              Clock Out
            </button>
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
      padding: 1rem 1.5rem;
      margin-bottom: 1.25rem;
    }
    .filter-row {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
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
    .help-text {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
  `]
})
export class AttendanceComponent implements OnInit {
  private staffService = inject(StaffService);
  private notify = inject(NotificationUiService);

  selectedDate: string = new Date().toISOString().split('T')[0];
  attendanceRecords: AttendanceResponse[] = [];
  allStaff: StaffResponse[] = [];
  loading = false;

  showClockModal = false;
  clockStaffId: number | null = null;

  ngOnInit(): void {
    this.loadStaff();
    this.loadAttendance();
  }

  setToday(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadAttendance();
  }

  loadStaff(): void {
    this.staffService.getAllStaff().subscribe({
      next: (list) => (this.allStaff = list)
    });
  }

  loadAttendance(): void {
    this.loading = true;
    this.staffService.getAttendanceByDate(this.selectedDate).subscribe({
      next: (records) => {
        this.attendanceRecords = records;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load attendance: ' + (err.error?.message || err.message));
      }
    });
  }

  executeClockIn(): void {
    if (!this.clockStaffId) return;
    this.staffService.checkIn(this.clockStaffId).subscribe({
      next: () => {
        this.notify.success('Clocked in successfully');
        this.showClockModal = false;
        this.loadAttendance();
      },
      error: (err) => {
        this.notify.error('Clock-in failed: ' + (err.error?.message || err.message));
      }
    });
  }

  executeClockOut(): void {
    if (!this.clockStaffId) return;
    this.staffService.checkOut(this.clockStaffId).subscribe({
      next: () => {
        this.notify.success('Clocked out successfully');
        this.showClockModal = false;
        this.loadAttendance();
      },
      error: (err) => {
        this.notify.error('Clock-out failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
