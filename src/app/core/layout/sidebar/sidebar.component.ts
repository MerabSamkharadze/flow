import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { AuthUser, logout, selectUser } from '../../../features/auth/store';
import { NotificationsService } from '../../services/notifications.service';

/**
 * SidebarComponent — left navigation panel.
 *
 * Displays nav links with icons, a Notifications item with unread badge,
 * and a collapse toggle. Subscribes to the auth user and notifications
 * service for the real-time unread count.
 */
@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  /** Unread notification count for badge display */
  unreadCount$: Observable<number> = of(0);

  /** Current authenticated user for profile section */
  user: AuthUser | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    // Keep local user reference for profile section
    this.store.select(selectUser).pipe(
      takeUntil(this.destroy$)
    ).subscribe((user) => {
      this.user = user;
    });

    // Stream unread count from the notifications service based on current user
    this.unreadCount$ = this.store.select(selectUser).pipe(
      switchMap((user) => {
        if (!user) return of(0);
        return this.notificationsService.getUnreadCount(user.uid);
      }),
      takeUntil(this.destroy$)
    );
  }

  onToggle(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }

  getInitials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
