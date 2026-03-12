import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { NotificationsRoutingModule } from './notifications-routing.module';

import { NotificationsComponent } from './pages/notifications/notifications.component';

/**
 * NotificationsModule — notifications feature module.
 *
 * Lazy-loaded under /notifications. Contains the notification feed,
 * read/unread management, and notification preferences.
 */
@NgModule({
  declarations: [NotificationsComponent],
  imports: [SharedModule, NotificationsRoutingModule],
})
export class NotificationsModule {}
