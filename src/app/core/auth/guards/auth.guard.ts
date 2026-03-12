import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { selectIsLoggedIn } from '../../../features/auth/store/auth.selectors';

/**
 * AuthGuard — prevents unauthenticated users from accessing protected routes.
 *
 * Checks the NgRx store for the current login state.
 * If the user is not logged in, redirects to /auth/login.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private store: Store,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.store.select(selectIsLoggedIn).pipe(
      take(1),
      map((isLoggedIn) => {
        if (isLoggedIn) {
          return true;
        }
        // Redirect unauthenticated users to the login page
        return this.router.createUrlTree(['/auth/login']);
      })
    );
  }
}
