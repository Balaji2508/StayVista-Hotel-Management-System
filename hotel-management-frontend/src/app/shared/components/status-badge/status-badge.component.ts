import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, StatusLabelPipe],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()">
      <span class="dot"></span>
      {{ status | statusLabel }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    /* Success / Positive */
    .badge-success {
      background-color: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    /* Warning / Pending */
    .badge-warning {
      background-color: rgba(245, 158, 11, 0.14);
      color: #d97706;
    }

    /* Danger / Rejected / Dirty / Cancelled */
    .badge-danger {
      background-color: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }

    /* Info / Processing / Active */
    .badge-info {
      background-color: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }

    /* Neutral / Closed */
    .badge-neutral {
      background-color: rgba(107, 114, 128, 0.12);
      color: #4b5563;
    }

    /* Purple / VIP / Maintenance */
    .badge-purple {
      background-color: rgba(139, 92, 246, 0.12);
      color: #7c3aed;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = '';

  getBadgeClass(): string {
    const s = (this.status || '').toUpperCase();
    if (['AVAILABLE', 'CONFIRMED', 'CHECKED_IN', 'PAID', 'APPROVED', 'CLEAN', 'VERIFIED', 'ACTIVE', 'COMPLETED', 'PRESENT', 'SUCCESS'].includes(s)) {
      return 'badge-success';
    }
    if (['PENDING', 'SUBMITTED', 'IN_PROGRESS', 'CLEANING', 'ASSIGNED', 'IN_INVESTIGATION', 'LATE', 'HALF_DAY'].includes(s)) {
      return 'badge-warning';
    }
    if (['CANCELLED', 'REJECTED', 'DIRTY', 'OUT_OF_SERVICE', 'FAILED', 'BLACKLISTED', 'ABSENT', 'LOCKED'].includes(s)) {
      return 'badge-danger';
    }
    if (['OCCUPIED', 'RESERVED', 'ORDERED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED', 'ON_LEAVE', 'OPEN'].includes(s)) {
      return 'badge-info';
    }
    if (['MAINTENANCE', 'REPORTED', 'PLATINUM', 'GOLD'].includes(s)) {
      return 'badge-purple';
    }
    return 'badge-neutral';
  }
}
