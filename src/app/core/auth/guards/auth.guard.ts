import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { selectAuthState } from '../../../features/auth/store';

/**
 * AuthGuard — prevents unauthenticated users from accessing protected routes.
 *
 * Waits for the auth state to finish loading (e.g. loadUser on app start),
 * then checks if the user is logged in. If not, redirects to /auth/login.
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
    return this.store.select(selectAuthState).pipe(
      // Wait until loading is complete (loadUser has finished)
      filter((authState) => !authState.loading),
      take(1),
      map((authState) => {
        if (authState.user) {
          return true;
        }
        return this.router.createUrlTree(['/auth/login']);
      })
    );
  }
}
