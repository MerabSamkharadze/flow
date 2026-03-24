/**
 * AppNotification — represents a single notification for a user.
 *
 * Named AppNotification (not Notification) to avoid conflict
 * with the browser's built-in Notification API.
 *
 * Stored in Firestore at: users/{userId}/notifications/{id}
 */
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;           // route to navigate to on click
  read: boolean;
  createdAt: number;      // timestamp in milliseconds
  actorName: string;      // who triggered the notification
  actorAvatar: string | null;
}

/** Supported notification event types */
export type NotificationType =
  | 'task_assigned'
  | 'comment_added'
  | 'task_updated'
  | 'member_added'
  | 'mention';
