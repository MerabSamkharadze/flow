import { createReducer, on } from '@ngrx/store';
import { AppNotification } from '../../../shared/models/notification.model';
import * as NotificationsActions from './notifications.actions';

/**
 * NotificationsState — shape of the 'notifications' feature state slice.
 *
 * notifications:  full list of user notifications (most recent first)
 * unreadCount:    count of unread notifications (computed on load/update)
 * loading:        true while fetching from Firestore
 * error:          error message from the last failed operation
 */
export interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const initialNotificationsState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

/** Helper — compute unread count from the notifications array */
function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export const notificationsReducer = createReducer(
  initialNotificationsState,

  // ---------------------------------------------------------------------------
  // Load notifications
  // ---------------------------------------------------------------------------

  on(NotificationsActions.loadNotifications, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(NotificationsActions.loadNotificationsSuccess, (state, { notifications }) => ({
    ...state,
    notifications,
    unreadCount: countUnread(notifications),
    loading: false,
    error: null,
  })),

  on(NotificationsActions.loadNotificationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Mark single notification as read
  // ---------------------------------------------------------------------------

  on(NotificationsActions.markAsReadSuccess, (state, { notificationId }) => {
    const updated = state.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    return {
      ...state,
      notifications: updated,
      unreadCount: countUnread(updated),
    };
  }),

  on(NotificationsActions.markAsReadFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Mark all notifications as read
  // ---------------------------------------------------------------------------

  on(NotificationsActions.markAllAsReadSuccess, (state) => ({
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  on(NotificationsActions.markAllAsReadFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
