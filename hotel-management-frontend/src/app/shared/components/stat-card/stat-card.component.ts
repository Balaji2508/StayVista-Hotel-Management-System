import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div
      class="stat-card"
      [ngClass]="themeClass"
      [style.border-top-color]="color"
      [style.border-top-width]="color ? '3px' : '1px'"
    >
      <div class="stat-header">
        <span class="stat-title">{{ title }}</span>
        <div class="stat-icon-wrapper" [style.color]="color">
          <ng-container *ngIf="resolvedIconName; else textIcon">
            <app-icon [name]="resolvedIconName" [size]="18"></app-icon>
          </ng-container>
          <ng-template #textIcon>
            <span class="stat-text-icon" *ngIf="icon">{{ icon }}</span>
          </ng-template>
        </div>
      </div>
      <div class="stat-body">
        <span class="stat-value" [style.color]="color || '#0f172a'">{{ value }}</span>
        <span *ngIf="subtext" class="stat-subtext">{{ subtext }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.375rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: var(--shadow-card);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
      position: relative;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-hover);
      border-color: #cbd5e1;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: var(--font-heading);
    }

    .stat-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: var(--slate-50);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }

    .stat-card:hover .stat-icon-wrapper {
      transform: scale(1.05);
    }

    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .stat-subtext {
      font-size: 0.8125rem;
      color: var(--slate-400);
      font-weight: 500;
    }

    /* Modern Elegant Light Themes */
    .theme-blue .stat-icon-wrapper {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #dbeafe;
    }
    .theme-green .stat-icon-wrapper {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .theme-purple .stat-icon-wrapper {
      background: #f5f3ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }
    .theme-amber .stat-icon-wrapper {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .theme-rose .stat-icon-wrapper {
      background: #fff1f2;
      color: #e11d48;
      border: 1px solid #fecdd3;
    }
    .theme-teal .stat-icon-wrapper {
      background: #f0fdfa;
      color: #0d9488;
      border: 1px solid #99f6e4;
    }
  `]
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() set label(val: string) {
    if (val) this.title = val;
  }
  @Input() value: string | number = '';
  @Input() subtext?: string;
  @Input() set hint(val: string) {
    if (val) this.subtext = val;
  }
  @Input() icon?: string;
  @Input() iconName?: string;
  @Input() themeClass: string = 'theme-blue';
  @Input() color?: string;

  get resolvedIconName(): string | null {
    if (this.iconName) return this.iconName;
    if (!this.icon) return null;

    // Map common emoji strings to SVG icon names
    const emojiMap: Record<string, string> = {
      '🏨': 'building',
      '🛏️': 'bed',
      '🧳': 'luggage',
      '💰': 'dollar',
      '👥': 'users',
      '👤': 'user',
      '📅': 'calendar',
      '⏳': 'clock',
      '🧹': 'sparkles',
      '🔧': 'wrench',
      '📦': 'package',
      '🚚': 'truck',
      '🛒': 'shopping-cart',
      '📝': 'file-text',
      '⭐': 'star',
      '💎': 'award',
      '📈': 'bar-chart',
      '📊': 'dashboard',
      '⚠️': 'alert-triangle',
      '💵': 'wallet',
      '💳': 'credit-card',
      '🧾': 'receipt',
      '🔔': 'bell',
      '🛡️': 'shield',
      '👔': 'briefcase'
    };

    if (emojiMap[this.icon]) {
      return emojiMap[this.icon];
    }

    // Check if the icon string is already an icon name
    const validNames = [
      'dashboard', 'users', 'user', 'calendar', 'clock', 'bed', 'tag',
      'dollar', 'receipt', 'credit-card', 'sparkles', 'clipboard',
      'wrench', 'alert-triangle', 'wallet', 'refresh-cw', 'trending-down',
      'trending-up', 'package', 'truck', 'file-text', 'shopping-cart',
      'bell', 'bar-chart', 'message-square', 'alert-circle', 'star',
      'award', 'shield', 'building', 'luggage'
    ];

    if (validNames.includes(this.icon.toLowerCase())) {
      return this.icon.toLowerCase();
    }

    return null;
  }
}
