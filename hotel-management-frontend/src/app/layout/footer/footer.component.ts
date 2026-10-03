import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <span class="copyright">© 2026 Grand Horizon Hotel Management System (HMS). All rights reserved.</span>
        <div class="footer-status">
          <span class="status-indicator"></span>
          <span>Gateway: Connected (port 8080)</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      padding: 1rem 2rem;
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .footer-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      color: #059669;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
  `]
})
export class FooterComponent {}
