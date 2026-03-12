import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { logout } from '../../../features/auth/store';
import { selectUser } from '../../../features/auth/store';

/**
 * HeaderComponent — top navigation bar with hamburger toggle,
 * current page title (derived from the active route), and user profile.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  user$ = this.store.select(selectUser);

  /** Current page title derived from the active route */
  pageTitle = 'Dashboard';

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
    private router: Router
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
    // Split URL and remove empty/query segments
    const segments = url.split('/').filter((s) => s && !s.startsWith('?'));

    // Walk segments from the end to find the first known route title
    for (let i = segments.length - 1; i >= 0; i--) {
      const title = this.routeTitles[segments[i]];
      if (title) return title;
    }

    return 'Dashboard';
  }
}
