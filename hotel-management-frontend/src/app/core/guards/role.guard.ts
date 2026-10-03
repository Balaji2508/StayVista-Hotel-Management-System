import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { NotificationUiService } from '../services/notification-ui.service';
import { Role } from '../models/auth.models';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationUiService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const expectedRoles = (route.data?.['roles'] as Role[]) || [];
  if (expectedRoles.length === 0 || authService.hasAnyRole(expectedRoles)) {
    return true;
  }

  notificationService.error('You do not have the required permissions to access this page.', 'Access Denied');
  router.navigate(['/dashboard']);
  return false;
};
