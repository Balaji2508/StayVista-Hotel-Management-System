import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // Public Auth Routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },

  // Protected Routes within Main Application Shell
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // Guests
      {
        path: 'guests',
        loadComponent: () => import('./features/guests/guest-list.component').then(m => m.GuestListComponent)
      },

      // Rooms & Rates
      {
        path: 'rooms',
        loadComponent: () => import('./features/rooms/room-list.component').then(m => m.RoomListComponent)
      },
      {
        path: 'room-categories',
        loadComponent: () => import('./features/rooms/room-categories.component').then(m => m.RoomCategoriesComponent)
      },
      {
        path: 'rates',
        loadComponent: () => import('./features/rates/rates.component').then(m => m.RatesComponent)
      },

      // Reservations & Waitlist
      {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservation-list.component').then(m => m.ReservationListComponent)
      },
      {
        path: 'reservations/new',
        loadComponent: () => import('./features/reservations/reservation-form.component').then(m => m.ReservationFormComponent)
      },
      {
        path: 'reservations/:id',
        loadComponent: () => import('./features/reservations/reservation-detail.component').then(m => m.ReservationDetailComponent)
      },
      {
        path: 'waitlist',
        loadComponent: () => import('./features/reservations/waitlist.component').then(m => m.WaitlistComponent)
      },

      // Financials
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/payment-list.component').then(m => m.PaymentListComponent)
      },
      {
        path: 'billing',
        loadComponent: () => import('./features/billing/bill-detail.component').then(m => m.BillDetailComponent)
      },

      // Staff & HR
      {
        path: 'staff',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'OWNER', 'MANAGER'] },
        loadComponent: () => import('./features/staff/staff-list.component').then(m => m.StaffListComponent)
      },
      {
        path: 'staff/attendance',
        loadComponent: () => import('./features/staff/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'staff/shifts',
        loadComponent: () => import('./features/staff/shifts.component').then(m => m.ShiftsComponent)
      },
      {
        path: 'staff/leave',
        loadComponent: () => import('./features/staff/leave.component').then(m => m.LeaveComponent)
      },

      // Inventory & Procurement
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory-list.component').then(m => m.InventoryListComponent)
      },
      {
        path: 'purchase/suppliers',
        loadComponent: () => import('./features/purchase/suppliers.component').then(m => m.SuppliersComponent)
      },
      {
        path: 'purchase/requests',
        loadComponent: () => import('./features/purchase/purchase-requests.component').then(m => m.PurchaseRequestsComponent)
      },
      {
        path: 'purchase/orders',
        loadComponent: () => import('./features/purchase/purchase-orders.component').then(m => m.PurchaseOrdersComponent)
      },

      // Guest Experience
      {
        path: 'guest-experience/requests',
        loadComponent: () => import('./features/guest-experience/service-requests.component').then(m => m.ServiceRequestsComponent)
      },
      {
        path: 'guest-experience/complaints',
        loadComponent: () => import('./features/guest-experience/complaints.component').then(m => m.ComplaintsComponent)
      },
      {
        path: 'guest-experience/feedback',
        loadComponent: () => import('./features/guest-experience/feedback.component').then(m => m.FeedbackComponent)
      },
      {
        path: 'guest-experience/loyalty',
        loadComponent: () => import('./features/guest-experience/loyalty.component').then(m => m.LoyaltyComponent)
      },

      // Operations
      {
        path: 'operations/housekeeping',
        loadComponent: () => import('./features/operations/housekeeping.component').then(m => m.HousekeepingComponent)
      },
      {
        path: 'operations/assignments',
        loadComponent: () => import('./features/operations/room-assignments.component').then(m => m.RoomAssignmentsComponent)
      },
      {
        path: 'operations/maintenance',
        loadComponent: () => import('./features/operations/maintenance.component').then(m => m.MaintenanceComponent)
      },
      {
        path: 'operations/breakage',
        loadComponent: () => import('./features/operations/breakage.component').then(m => m.BreakageComponent)
      },
      {
        path: 'operations/cash-drawer',
        loadComponent: () => import('./features/operations/cash-drawer.component').then(m => m.CashDrawerComponent)
      },
      {
        path: 'operations/handover',
        loadComponent: () => import('./features/operations/shift-handover.component').then(m => m.ShiftHandoverComponent)
      },
      {
        path: 'operations/expenses',
        loadComponent: () => import('./features/operations/expenses.component').then(m => m.ExpensesComponent)
      },

      // Executive Reporting
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'OWNER', 'MANAGER'] },
        loadComponent: () => import('./features/reporting/reports.component').then(m => m.ReportsComponent)
      },

      // Notifications
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notification-list.component').then(m => m.NotificationListComponent)
      },

      // Security & System Users
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'OWNER'] },
        loadComponent: () => import('./features/users/user-list.component').then(m => m.UserListComponent)
      },

      // User Profile & Preferences (Template-Driven Form)
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },

  // Fallback Route
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
