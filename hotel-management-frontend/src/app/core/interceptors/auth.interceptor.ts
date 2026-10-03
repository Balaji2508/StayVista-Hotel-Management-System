import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationUiService } from '../services/notification-ui.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationUiService);
  const router = inject(Router);

  const token = authService.getToken();
  const isAuthRequest = req.url.includes('/api/auth/login') ||
                        req.url.includes('/api/auth/register') ||
                        req.url.includes('/api/auth/refresh');

  let authReq = req;
  if (token && !isAuthRequest) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest) {
        notificationService.error('Session expired or unauthorized. Please log in again.', 'Unauthorized');
        authService.logout().subscribe();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        notificationService.error('You do not have permission to perform this action.', 'Access Denied');
      } else if (error.status === 0) {
        notificationService.error('Unable to connect to the server. Please verify the API Gateway is running on port 8080.', 'Network Error');
      } else if (error.status >= 500) {
        const errorMsg = error.error?.message || 'An internal server error occurred.';
        notificationService.error(errorMsg, 'Server Error');
      } else if (error.status === 400 || error.status === 409) {
        const errorMsg = error.error?.message || error.error?.error || 'A business validation error occurred.';
        notificationService.warning(errorMsg, error.status === 409 ? 'Conflict' : 'Validation Error');
      }

      return throwError(() => error);
    })
  );
};
