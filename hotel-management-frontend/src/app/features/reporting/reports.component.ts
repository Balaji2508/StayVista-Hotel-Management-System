import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportingService } from '../../core/services/reporting.service';
import {
  DailySummaryResponse,
  OccupancyReportResponse,
  RevenueReportResponse,
  ExpenseReportResponse,
  StaffPerformanceReportResponse
} from '../../core/models/reporting.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatCardComponent,
    IconComponent
  ],
  template: `
    <div class="reports-page">
      <app-page-header
        title="Executive Reporting & Business Intelligence"
        subtitle="Access official hotel performance metrics, revenue analytics, occupancy trends, and staff productivity"
      >
        <div class="header-nav">
          <button class="btn btn-outline" [class.btn-primary]="activeTab === 'daily'" (click)="activeTab = 'daily'">
            Daily Summary
          </button>
          <button class="btn btn-outline" [class.btn-primary]="activeTab === 'occupancy'" (click)="activeTab = 'occupancy'">
            Occupancy
          </button>
          <button class="btn btn-outline" [class.btn-primary]="activeTab === 'revenue'" (click)="activeTab = 'revenue'">
            Revenue & RevPAR
          </button>
          <button class="btn btn-outline" [class.btn-primary]="activeTab === 'expenses'" (click)="activeTab = 'expenses'">
            Expenses
          </button>
          <button class="btn btn-outline" [class.btn-primary]="activeTab === 'staff'" (click)="activeTab = 'staff'">
            Staff Productivity
          </button>
        </div>
      </app-page-header>

      <!-- Date Range Filter Bar for Reports -->
      <div class="card filter-bar" *ngIf="activeTab !== 'daily'">
        <div class="filter-row">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" [(ngModel)]="startDate" class="form-control" />
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" [(ngModel)]="endDate" class="form-control" />
          </div>
          <button class="btn btn-primary" (click)="loadActiveReport()">Run Report</button>
        </div>
      </div>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <!-- 1. Daily Summary Tab -->
      <div *ngIf="!loading && activeTab === 'daily'" class="tab-content">
        <div class="card summary-header-card">
          <div class="header-row">
            <div>
              <h3>Daily Operational Snapshot</h3>
              <p class="sub-text">Live metrics aggregated by Reporting Service for today</p>
            </div>
            <button class="btn btn-primary btn-sm" (click)="refreshDailySummary()">
              <app-icon name="refresh-cw" [size]="14"></app-icon>
              <span>Re-aggregate Today's Metrics</span>
            </button>
          </div>
        </div>

        <div *ngIf="dailySummary" class="kpi-grid">
          <app-stat-card
            label="Occupancy Rate"
            [value]="(dailySummary.occupancyRate | number:'1.1-1') + '%'"
            [hint]="dailySummary.occupiedRooms + ' Occupied / ' + dailySummary.availableRooms + ' Available'"
            color="#2563eb"
          ></app-stat-card>

          <app-stat-card
            label="Today's Revenue"
            [value]="'$' + (dailySummary.totalDailyRevenue | number:'1.2-2')"
            hint="Gross billing & payments"
            color="#16a34a"
          ></app-stat-card>

          <app-stat-card
            label="Today's Expenses"
            [value]="'$' + (dailySummary.totalDailyExpenses | number:'1.2-2')"
            hint="Operational disbursements"
            color="#dc2626"
          ></app-stat-card>

          <app-stat-card
            label="Front Desk Movement"
            [value]="dailySummary.arrivalsToday + ' In / ' + dailySummary.departuresToday + ' Out'"
            [hint]="dailySummary.pendingComplaints + ' Pending Guest Complaints'"
            color="#f59e0b"
          ></app-stat-card>
        </div>

        <div *ngIf="!dailySummary" class="card empty-card">
          <p>No daily summary generated yet for today.</p>
          <button class="btn btn-primary mt-2" (click)="refreshDailySummary()">Generate Summary Now</button>
        </div>
      </div>

      <!-- 2. Occupancy Report Tab -->
      <div *ngIf="!loading && activeTab === 'occupancy' && occupancyReport" class="tab-content">
        <div class="card metric-overview">
          <div class="metric-val">
            <span class="label">Average Occupancy Rate</span>
            <span class="num">{{ occupancyReport.averageOccupancyRate | number:'1.1-2' }}%</span>
          </div>
          <div class="metric-val">
            <span class="label">Total Rooms In Service</span>
            <span class="num">{{ occupancyReport.totalRooms }}</span>
          </div>
        </div>

        <div class="card table-card">
          <div class="card-header">
            <h4>Daily Occupancy Breakdown</h4>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Capacity</th>
                  <th>Occupied Rooms</th>
                  <th>Occupancy %</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let day of occupancyReport.dailyBreakdown">
                  <td>{{ day.date }}</td>
                  <td>{{ day.totalRooms }}</td>
                  <td><strong>{{ day.occupiedRooms }}</strong></td>
                  <td>
                    <span class="font-bold" [class.text-success]="day.occupancyRate >= 70">
                      {{ day.occupancyRate | number:'1.1-2' }}%
                    </span>
                  </td>
                </tr>
                <tr *ngIf="occupancyReport.dailyBreakdown?.length === 0">
                  <td colspan="4" class="text-center py-4">No daily occupancy records in this window.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. Revenue Report Tab -->
      <div *ngIf="!loading && activeTab === 'revenue' && revenueReport" class="tab-content">
        <div class="kpi-grid">
          <app-stat-card
            label="Total Gross Revenue"
            [value]="'$' + (revenueReport.totalRevenue | number:'1.2-2')"
            color="#16a34a"
          ></app-stat-card>

          <app-stat-card
            label="RevPAR (Per Avail Room)"
            [value]="'$' + (revenueReport.revPAR | number:'1.2-2')"
            color="#2563eb"
          ></app-stat-card>

          <app-stat-card
            label="ADR (Average Daily Rate)"
            [value]="'$' + (revenueReport.averageDailyRate | number:'1.2-2')"
            color="#f59e0b"
          ></app-stat-card>
        </div>

        <div class="card table-card mt-3">
          <div class="card-header">
            <h4>Revenue Streams & Departmental Contributions</h4>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Department / Stream</th>
                  <th>Gross Inflow</th>
                  <th>Share of Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let stream of revenueReport.revenueStreams">
                  <td><strong>{{ stream.category }}</strong></td>
                  <td><strong class="text-success">\${{ stream.amount | number:'1.2-2' }}</strong></td>
                  <td>{{ stream.percentage | number:'1.1-2' }}%</td>
                </tr>
                <tr *ngIf="revenueReport.revenueStreams?.length === 0">
                  <td colspan="3" class="text-center py-4">No revenue recorded in this period.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 4. Expense Report Tab -->
      <div *ngIf="!loading && activeTab === 'expenses' && expenseReport" class="tab-content">
        <div class="card metric-overview">
          <div class="metric-val">
            <span class="label">Total Period Expenses</span>
            <span class="num text-danger">\${{ expenseReport.totalExpenses | number:'1.2-2' }}</span>
          </div>
        </div>

        <div class="card table-card">
          <div class="card-header">
            <h4>Category Breakdown</h4>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Expense Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of getExpenseEntries()">
                  <td><strong>{{ item.key }}</strong></td>
                  <td><strong class="text-danger">\${{ item.val | number:'1.2-2' }}</strong></td>
                </tr>
                <tr *ngIf="getExpenseEntries().length === 0">
                  <td colspan="2" class="text-center py-4">No expenses recorded for selected window.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 5. Staff Performance Tab -->
      <div *ngIf="!loading && activeTab === 'staff' && staffReport" class="tab-content">
        <div class="card metric-overview">
          <div class="metric-val">
            <span class="label">Active Staff Monitored</span>
            <span class="num">{{ staffReport.totalStaff }}</span>
          </div>
          <div class="metric-val">
            <span class="label">Total Tasks Completed</span>
            <span class="num text-success">{{ staffReport.totalCompletedTasks }}</span>
          </div>
        </div>

        <div class="card table-card">
          <div class="card-header">
            <h4>Staff Member Productivity & Attendance</h4>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Completed Work Orders</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of staffReport.staffMetrics">
                  <td><strong>{{ m.staffName }}</strong></td>
                  <td><span class="badge badge-success">{{ m.completedTasks }} tasks</span></td>
                  <td>{{ m.attendanceRate | number:'1.1-1' }}%</td>
                </tr>
                <tr *ngIf="staffReport.staffMetrics?.length === 0">
                  <td colspan="3" class="text-center py-4">No staff metrics recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
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
    .summary-header-card {
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sub-text {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .metric-overview {
      padding: 1.5rem;
      display: flex;
      gap: 3rem;
      margin-bottom: 1.25rem;
    }
    .metric-val {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .metric-val .label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .metric-val .num {
      font-size: 2rem;
      font-weight: 800;
    }
    .card-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }
    .empty-card {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);
    }
    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportingService);
  private notify = inject(NotificationUiService);

  activeTab: 'daily' | 'occupancy' | 'revenue' | 'expenses' | 'staff' = 'daily';
  startDate: string;
  endDate: string;
  loading = false;

  dailySummary: DailySummaryResponse | null = null;
  occupancyReport: OccupancyReportResponse | null = null;
  revenueReport: RevenueReportResponse | null = null;
  expenseReport: ExpenseReportResponse | null = null;
  staffReport: StaffPerformanceReportResponse | null = null;

  constructor() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = firstOfMonth.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadDailySummary();
  }

  loadActiveReport(): void {
    if (this.activeTab === 'occupancy') this.loadOccupancy();
    else if (this.activeTab === 'revenue') this.loadRevenue();
    else if (this.activeTab === 'expenses') this.loadExpenses();
    else if (this.activeTab === 'staff') this.loadStaff();
  }

  loadDailySummary(): void {
    this.loading = true;
    this.reportService.getDailySummary().subscribe({
      next: (summary) => {
        this.dailySummary = summary;
        this.loading = false;
      },
      error: () => {
        this.dailySummary = null;
        this.loading = false;
      }
    });
  }

  refreshDailySummary(): void {
    this.loading = true;
    this.reportService.generateDailySummary().subscribe({
      next: (res) => {
        this.dailySummary = res;
        this.loading = false;
        this.notify.success('Daily summary generated successfully');
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Generation failed: ' + (err.error?.message || err.message));
      }
    });
  }

  loadOccupancy(): void {
    this.loading = true;
    this.reportService.getOccupancyReport(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.occupancyReport = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load occupancy report: ' + (err.error?.message || err.message));
      }
    });
  }

  loadRevenue(): void {
    this.loading = true;
    this.reportService.getRevenueReport(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.revenueReport = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load revenue report: ' + (err.error?.message || err.message));
      }
    });
  }

  loadExpenses(): void {
    this.loading = true;
    this.reportService.getExpenseReport(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.expenseReport = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load expense report: ' + (err.error?.message || err.message));
      }
    });
  }

  getExpenseEntries(): { key: string; val: number }[] {
    if (!this.expenseReport || !this.expenseReport.expensesByCategory) return [];
    return Object.entries(this.expenseReport.expensesByCategory).map(([key, val]) => ({
      key,
      val
    }));
  }

  loadStaff(): void {
    this.loading = true;
    this.reportService.getStaffPerformanceReport(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.staffReport = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load staff performance report: ' + (err.error?.message || err.message));
      }
    });
  }
}
