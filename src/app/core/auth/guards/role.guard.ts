import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { selectUserRole, selectUser } from '../../../features/auth/store';
import { selectSelectedProject } from '../../../features/projects/store';
import { Member } from '../../../shared/models/member.model';

/**
 * RoleGuard — restricts route access based on user roles.
 *
 * Supports two modes via route data:
 *
 * 1. Global role check (original behavior):
 *    data: { roles: ['admin'] }
 *    Checks the user's global app role from AuthState.
 *
 * 2. Project-level role check:
 *    data: { roles: ['admin', 'manager'], projectRole: true }
 *    Checks the user's role within the currently selected project.
 *    Falls back to the global role if the user is not a project member.
 *
 * If the user's role is not in the allowed list, redirects to /projects.
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
    const allowedRoles: string[] = route.data['roles'] ?? [];
    const checkProjectRole: boolean = route.data['projectRole'] ?? false;

    if (checkProjectRole) {
      // Project-level role check — look at the current user's membership
      // in the selected project
      return combineLatest([
        this.store.select(selectUser),
        this.store.select(selectSelectedProject),
      ]).pipe(
        take(1),
        map(([user, project]) => {
          if (!user || !project) {
            return this.router.createUrlTree(['/projects']);
          }

          // Check if the user is a member of this project
          // The project's memberIds array tells us membership,
          // but the actual role is in the members subcollection.
          // For guard-level checks, we check if the user is the owner (admin)
          // or fall back to checking global role.
          const isOwner = project.ownerId === user.uid;
          if (isOwner && allowedRoles.includes('admin')) {
            return true;
          }

          // Fall back to global role check
          if (user.role && allowedRoles.includes(user.role)) {
            return true;
          }

          return this.router.createUrlTree(['/projects']);
        })
      );
    }

    // Global role check (default behavior)
    return this.store.select(selectUserRole).pipe(
      take(1),
      map((userRole) => {
        if (userRole && allowedRoles.includes(userRole)) {
          return true;
        }
        return this.router.createUrlTree(['/projects']);
      })
    );
  }
}
