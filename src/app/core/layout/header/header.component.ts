import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, of } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';

import { logout } from '../../../features/auth/store';
import { selectUser } from '../../../features/auth/store';
import { AuthUser } from '../../../features/auth/store/auth.actions';
import { NotificationsService } from '../../services/notifications.service';

/**
 * HeaderComponent — top navigation bar with hamburger toggle,
 * current page title (derived from the active route), user profile,
 * and notification bell with unread badge.
 */
@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  user$ = this.store.select(selectUser);

  /** Current page title derived from the active route */
  pageTitle = 'Dashboard';

  /** Unread notification count — drives the bell badge */
  unreadCount$: Observable<number> = of(0);

  private destroy$ = new Subject<void>();

  /** Route segment → display title mapping */
  private readonly routeTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    'my-tasks': 'My Tasks',
    team: 'Team',
    notifications: 'Notifications',
    settings: 'Settings',
    board: 'Board',
    tasks: 'Tasks',
  };

  constructor(
    private store: Store,
    private router: Router,
    private notificationsService: NotificationsService
  ) {
    // Update page title on every navigation
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
        this.pageTitle = this.extractTitle(url);
      });
  }

  ngOnInit(): void {
    // Subscribe to the authenticated user, then stream unread count
    this.unreadCount$ = this.store.select(selectUser).pipe(
      switchMap((user) => {
        if (!user) return of(0);
        return this.notificationsService.getUnreadCount(user.uid);
      })
    );
  }

  onMenuToggle(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Extract a readable page title from the current URL */
  private extractTitle(url: string): string {
    const segments = url.split('/').filter((s) => s && !s.startsWith('?'));
    for (let i = segments.length - 1; i >= 0; i--) {
      const title = this.routeTitles[segments[i]];
      if (title) return title;
    }
    return 'Dashboard';
  }
}
