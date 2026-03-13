import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationsState } from './notifications.reducer';

/**
 * Notifications Selectors — memoized selectors for reading notifications state.
 */

// Feature selector — grabs the 'notifications' slice from the root state
export const selectNotificationsState =
  createFeatureSelector<NotificationsState>('notifications');

/** All notifications sorted by createdAt descending */
export const selectAllNotifications = createSelector(
  selectNotificationsState,
  (state) => state.notifications
);

/** Count of unread notifications */
export const selectUnreadCount = createSelector(
  selectNotificationsState,
  (state) => state.unreadCount
);

/** Only unread notifications */
export const selectUnreadNotifications = createSelector(
  selectAllNotifications,
  (notifications) => notifications.filter((n) => !n.read)
);

/** Whether a notifications operation is in progress */
export const selectNotificationsLoading = createSelector(
  selectNotificationsState,
  (state) => state.loading
);

/** The last notifications error message (or null) */
export const selectNotificationsError = createSelector(
  selectNotificationsState,
  (state) => state.error
);
