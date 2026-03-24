import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { AppNotification, NotificationType } from '../../../../shared/models/notification.model';

/**
 * NotificationItemComponent — single row in the notification feed.
 *
 * Displays actor avatar, notification title/body, relative timestamp,
 * and a type-specific icon. Unread items have a visual emphasis
 * (left border + bold title).
 */
@Component({
  standalone: false,
  selector: 'app-notification-item',
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      mention: 'Mentioned you',
    };
    return labels[this.notification.type] || 'Notification';
  }
}
