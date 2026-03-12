import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { selectUserRole } from '../../../features/auth/store/auth.selectors';

/**
 * RoleGuard — restricts route access based on the user's role.
 *
 * Reads the allowed roles from the route's data property:
 *   { path: 'admin', canActivate: [RoleGuard], data: { roles: ['admin'] } }
 *
 * If the user's role is not in the allowed list, redirects to /dashboard.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private store: Store,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    // Read allowed roles from the route data, e.g. data: { roles: ['admin', 'manager'] }
    const allowedRoles: string[] = route.data['roles'] ?? [];

    return this.store.select(selectUserRole).pipe(
      take(1),
      map((userRole) => {
        if (userRole && allowedRoles.includes(userRole)) {
          return true;
        }
        // User's role is not permitted — redirect to dashboard
        return this.router.createUrlTree(['/dashboard']);
      })
    );
  }
}
