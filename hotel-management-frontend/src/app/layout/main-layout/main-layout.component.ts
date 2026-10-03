import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="layout-container">
      <app-toast-container></app-toast-container>
      <app-header (toggleSidebar)="isSidebarOpen = !isSidebarOpen"></app-header>
      <div class="layout-body">
        <app-sidebar [isOpen]="isSidebarOpen" (closeSidebar)="isSidebarOpen = false"></app-sidebar>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--slate-50);
    }

    .layout-body {
      display: flex;
      flex: 1;
      min-height: calc(100vh - var(--header-height));
    }

    .main-content {
      flex: 1;
      background-color: var(--slate-50);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
  `]
})
export class MainLayoutComponent {
  isSidebarOpen = false;
}
