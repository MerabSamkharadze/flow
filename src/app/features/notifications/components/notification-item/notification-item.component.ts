import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AppNotification, NotificationType } from '../../../../shared/models/notification.model';

/**
 * NotificationItemComponent — single row in the notification feed.
 *
 * Displays actor avatar, notification title/body, relative timestamp,
 * and a type-specific icon. Unread items have a visual emphasis
 * (left border + bold title).
 */
@Component({
  selector: 'app-notification-item',
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.scss'],
})
export class NotificationItemComponent {
  @Input() notification!: AppNotification;
  @Output() clicked = new EventEmitter<AppNotification>();

  /** Handle click on the notification row */
  onClick(): void {
    this.clicked.emit(this.notification);
  }

  /** Get actor initials for the avatar circle */
  get actorInitial(): string {
    return (this.notification.actorName || '?').charAt(0).toUpperCase();
  }

  /** Compute a human-readable relative timestamp */
  get relativeTime(): string {
    const diff = Date.now() - this.notification.createdAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    // Fallback to formatted date for older notifications
    return new Date(this.notification.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /** Whether to show the actor avatar image or fallback to initials */
  get hasAvatar(): boolean {
    return !!this.notification.actorAvatar;
  }

  /** Get type label for the type icon tooltip */
  get typeLabel(): string {
    const labels: Record<NotificationType, string> = {
      task_assigned: 'Task assigned',
      comment_added: 'New comment',
      task_updated: 'Task updated',
      member_added: 'Member added',
    };
    return labels[this.notification.type] || 'Notification';
  }
}
