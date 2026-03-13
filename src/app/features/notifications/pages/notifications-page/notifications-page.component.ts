import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { AppNotification } from '../../../../shared/models/notification.model';
import { AuthUser } from '../../../auth/store/auth.actions';
import { selectUser } from '../../../auth/store';
import {
  loadNotifications,
  markAsRead,
  markAllAsRead,
  selectAllNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
} from '../../store';

/**
 * NotificationsPageComponent — full-page notification feed.
 *
 * Dispatches loadNotifications on init, displays the list with
 * read/unread styling, and provides mark-as-read functionality.
 */
@Component({
  standalone: false,
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss'],
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  notifications$!: Observable<AppNotification[]>;
  unreadCount$!: Observable<number>;
  loading$!: Observable<boolean>;

  private userId = '';
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Wire up store selectors
    this.notifications$ = this.store.select(selectAllNotifications);
    this.unreadCount$ = this.store.select(selectUnreadCount);
    this.loading$ = this.store.select(selectNotificationsLoading);

    // Subscribe to auth user to get userId, then load notifications
    this.store
      .select(selectUser)
      .pipe(
        filter((user): user is AuthUser => !!user),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        this.userId = user.uid;
        this.store.dispatch(loadNotifications({ userId: user.uid }));
      });
  }

  /** Mark all notifications as read */
  onMarkAllRead(): void {
    if (this.userId) {
      this.store.dispatch(markAllAsRead({ userId: this.userId }));
    }
  }

  /** TrackBy for notification list — improves ngFor performance */
  trackByNotifId(_index: number, notification: AppNotification): string {
    return notification.id;
  }

  /** Handle notification click: mark as read + navigate to the link */
  onNotificationClick(notification: AppNotification): void {
    if (!notification.read && this.userId) {
      this.store.dispatch(
        markAsRead({ userId: this.userId, notificationId: notification.id })
      );
    }
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
