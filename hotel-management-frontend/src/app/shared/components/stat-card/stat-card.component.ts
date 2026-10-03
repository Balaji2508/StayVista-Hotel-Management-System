import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [ngClass]="themeClass" [style.border-top-color]="color" [style.border-top-width]="color ? '4px' : '1px'">
      <div class="stat-header">
        <span class="stat-title">{{ title }}</span>
        <div class="stat-icon" *ngIf="icon" [style.color]="color">{{ icon }}</div>
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
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-icon {
      font-size: 1.25rem;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }

    .stat-subtext {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    /* Themes */
    .theme-blue .stat-icon { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
    .theme-green .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .theme-purple .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .theme-amber .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .theme-rose .stat-icon { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }
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
  @Input() themeClass: string = 'theme-blue';
  @Input() color?: string;
}
