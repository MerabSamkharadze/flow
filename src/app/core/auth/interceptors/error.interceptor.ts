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

import { logout } from '../../../features/auth/store/auth.actions';

/**
 * ErrorInterceptor — global HTTP error handler.
 *
 * - 401 Unauthorized: dispatches logout to clear the session
 *   (the token has expired or been revoked).
 * - 500 Internal Server Error: logs the error for debugging.
 * - All errors are re-thrown so individual callers can still handle them.
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private store: Store) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired or invalid — force logout
          this.store.dispatch(logout());
        }

        if (error.status >= 500) {
          // Log server errors for debugging
          console.error(`[ErrorInterceptor] ${error.status} on ${req.method} ${req.url}:`, error.message);
        }

        return throwError(() => error);
      })
    );
  }
}
