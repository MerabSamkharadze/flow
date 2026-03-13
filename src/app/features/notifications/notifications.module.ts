import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../../shared/shared.module';
import { NotificationsRoutingModule } from './notifications-routing.module';

// NgRx store
import { notificationsReducer } from './store/notifications.reducer';
import { NotificationsEffects } from './store/notifications.effects';

// Pages
import { NotificationsPageComponent } from './pages/notifications-page/notifications-page.component';

// Components
import { NotificationItemComponent } from './components/notification-item/notification-item.component';

/**
 * NotificationsModule — notifications feature module.
 *
 * Lazy-loaded under /notifications. Contains the notification feed page,
 * individual notification item component, and NgRx state management
 * for real-time notification loading and read/unread tracking.
 */
@NgModule({
  declarations: [
    NotificationsPageComponent,
    NotificationItemComponent,
  ],
  imports: [
    SharedModule,
    NotificationsRoutingModule,

    // NgRx — register the notifications feature state and effects
    StoreModule.forFeature('notifications', notificationsReducer),
    EffectsModule.forFeature([NotificationsEffects]),
  ],
})
export class NotificationsModule {}
