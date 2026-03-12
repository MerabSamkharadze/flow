import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';

/**
 * AuthInterceptor — attaches the Firebase ID token to outgoing HTTP requests.
 *
 * For every request, retrieves the current user's ID token from Firebase
 * and adds it as an Authorization: Bearer <token> header.
 * If no user is signed in, the request passes through without a token.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AngularFireAuth) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.auth.authState.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          // No authenticated user — pass request through unchanged
          return next.handle(req);
        }

        // Get the Firebase ID token and attach it to the request
        return from(user.getIdToken()).pipe(
          switchMap((token) => {
            const authReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            });
            return next.handle(authReq);
          })
        );
      })
    );
  }
}
