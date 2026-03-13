import { createAction, props } from '@ngrx/store';
import { AppNotification } from '../../../shared/models/notification.model';

/**
 * Notifications Actions — all actions for the notifications state slice.
 *
 * Naming convention:
 *   [Notifications Page] — triggered from components
 *   [Notifications API]  — triggered from effects after Firestore responds
 */

// ---------------------------------------------------------------------------
// Load notifications (real-time stream for the current user)
// ---------------------------------------------------------------------------

export const loadNotifications = createAction(
  '[Notifications Page] Load Notifications',
  props<{ userId: string }>()
);

export const loadNotificationsSuccess = createAction(
  '[Notifications API] Load Notifications Success',
  props<{ notifications: AppNotification[] }>()
);

export const loadNotificationsFailure = createAction(
  '[Notifications API] Load Notifications Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Mark a single notification as read
// ---------------------------------------------------------------------------

export const markAsRead = createAction(
  '[Notifications Page] Mark As Read',
  props<{ userId: string; notificationId: string }>()
);

export const markAsReadSuccess = createAction(
  '[Notifications API] Mark As Read Success',
  props<{ notificationId: string }>()
);

export const markAsReadFailure = createAction(
  '[Notifications API] Mark As Read Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Mark all notifications as read
// ---------------------------------------------------------------------------

export const markAllAsRead = createAction(
  '[Notifications Page] Mark All As Read',
  props<{ userId: string }>()
);

export const markAllAsReadSuccess = createAction(
  '[Notifications API] Mark All As Read Success'
);

export const markAllAsReadFailure = createAction(
  '[Notifications API] Mark All As Read Failure',
  props<{ error: string }>()
);
