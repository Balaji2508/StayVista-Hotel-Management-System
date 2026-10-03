import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <span class="copyright">© 2026 StayVista Hotel Management System (HMS) • Enterprise Edition</span>
        <div class="footer-status">
          <span class="status-indicator"></span>
          <span>API Gateway: Connected (Port 8080)</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: #ffffff;
      border-top: 1px solid var(--slate-200);
      padding: 0.875rem 2rem;
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin-top: auto;
    }

    .footer-content {
      max-width: 1480px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .copyright {
      font-weight: 500;
    }

    .footer-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--accent-emerald);
      font-size: 0.75rem;
      background: var(--accent-emerald-light);
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .status-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
    }

    @media (max-width: 640px) {
      .app-footer {
        padding: 0.875rem 1rem;
      }
      .footer-content {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class FooterComponent {}
