import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { selectAuthState } from '../../../features/auth/store';

/** localStorage key for saving the attempted URL before redirect */
const REDIRECT_URL_KEY = 'flow_redirect_url';

/**
 * AuthGuard — prevents unauthenticated users from accessing protected routes.
 *
 * Waits for the auth state to finish loading (e.g. loadUser on app start),
 * then checks if the user is logged in. If not, saves the attempted URL
 * to localStorage and redirects to /auth/login.
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

        // Save the attempted URL so we can redirect back after login
        const currentUrl = this.router.getCurrentNavigation()?.extractedUrl?.toString();
        if (currentUrl && currentUrl !== '/' && currentUrl !== '/auth/login') {
          localStorage.setItem(REDIRECT_URL_KEY, currentUrl);
        }

        return this.router.createUrlTree(['/auth/login']);
      })
    );
  }
}
