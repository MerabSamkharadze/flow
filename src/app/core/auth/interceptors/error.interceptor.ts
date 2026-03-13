import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { logout } from '../../../features/auth/store';
import { ToastService } from '../../services/toast.service';

/**
 * ErrorInterceptor — global HTTP error handler with toast notifications.
 *
 * - 401: toast "Session expired" + dispatch logout
 * - 403: toast "Permission denied"
 * - 404: handled silently (no toast)
 * - 500+: toast "Server error"
 * - Network error (status 0): toast "No internet connection"
 *
 * All errors are re-thrown so individual callers can still handle them.
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private store: Store,
    private toastService: ToastService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Network error — no connection
        if (error.status === 0) {
          this.toastService.show('No internet connection.', 'error', 5000);
          return throwError(() => error);
        }

        // 401 — session expired
        if (error.status === 401) {
          this.toastService.show('Session expired, please sign in.', 'warning');
          this.store.dispatch(logout());
        }

        // 403 — forbidden
        if (error.status === 403) {
          this.toastService.show("You don't have permission to do that.", 'error');
        }

        // 500+ — server error
        if (error.status >= 500) {
          this.toastService.show('Server error. Please try again.', 'error', 5000);
          console.error(`[ErrorInterceptor] ${error.status} on ${req.method} ${req.url}:`, error.message);
        }

        // 404 — handled silently (no toast)

        return throwError(() => error);
      })
    );
  }
}
