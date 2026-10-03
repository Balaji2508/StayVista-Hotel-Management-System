import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationResponse } from '../../core/models/notification.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    TimeAgoPipe
  ],
  template: `
    <div class="notifications-page">
      <app-page-header
        title="System Event Notifications & Alerts"
        subtitle="Live audit trail of booking lifecycle events, low-stock reorder triggers, payment confirmations, and maintenance requests"
      >
        <button class="btn btn-outline" (click)="loadNotifications()">🔄 Refresh Notifications</button>
      </app-page-header>

      <app-loading-spinner [loading]="loading"></app-loading-spinner>

      <div *ngIf="!loading" class="notifications-list">
        <div
          *ngFor="let n of notifications"
          class="card notification-card"
          [class.unread]="!n.read"
        >
          <div class="notif-indicator">
            <span class="channel-icon" [attr.data-channel]="n.channel">
              {{ n.channel === 'EMAIL' ? '✉️' : (n.channel === 'SMS' ? '📱' : '🔔') }}
            </span>
          </div>

          <div class="notif-content">
            <div class="notif-header">
              <h4>{{ n.title }}</h4>
              <span class="notif-time">{{ n.createdAt | timeAgo }}</span>
            </div>
            <p class="notif-message">{{ n.message }}</p>
            <div class="notif-meta">
              <span class="meta-tag">Recipient: {{ n.recipient }}</span>
              <span class="meta-tag" *ngIf="n.eventType">Event: {{ n.eventType }}</span>
              <span class="meta-tag">Channel: {{ n.channel }}</span>
            </div>
          </div>

          <div class="notif-actions">
            <button
              *ngIf="!n.read"
              class="btn btn-sm btn-outline"
              (click)="markAsRead(n)"
              title="Mark as Read"
            >
              ✓ Mark Read
            </button>
            <span *ngIf="n.read" class="read-indicator">Read</span>
          </div>
        </div>

        <div *ngIf="notifications.length === 0" class="card empty-card">
          <p>No system notifications recorded.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .notification-card {
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      transition: all 0.2s;
    }
    .notification-card.unread {
      border-left: 4px solid var(--primary);
      background: var(--surface);
    }
    .channel-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-hover);
      font-size: 1.2rem;
    }
    .notif-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .notif-header h4 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .notif-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .notif-message {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }
    .notif-meta {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .meta-tag {
      font-size: 0.7rem;
      background: var(--bg-hover);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      color: var(--text-muted);
    }
    .notif-actions {
      display: flex;
      align-items: center;
    }
    .read-indicator {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .empty-card {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);
    }
  `]
})
export class NotificationListComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private notify = inject(NotificationUiService);

  notifications: NotificationResponse[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications(0, 50).subscribe({
      next: (page) => {
        this.notifications = page.content || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error('Failed to load notifications: ' + (err.error?.message || err.message));
      }
    });
  }

  markAsRead(n: NotificationResponse): void {
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        n.read = true;
        this.notify.success('Notification marked as read');
      },
      error: (err) => this.notify.error('Failed: ' + (err.error?.message || err.message))
    });
  }
}
