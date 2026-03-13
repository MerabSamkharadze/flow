import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { SettingsRoutingModule } from './settings-routing.module';

// Pages
import { SettingsShellComponent } from './pages/settings-shell/settings-shell.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { AccountSettingsComponent } from './pages/account-settings/account-settings.component';
import { AppearanceSettingsComponent } from './pages/appearance-settings/appearance-settings.component';
import { NotificationPreferencesComponent } from './pages/notification-preferences/notification-preferences.component';

/**
 * SettingsModule — settings feature module.
 *
 * Lazy-loaded under /settings. Contains:
 *   - SettingsShellComponent: layout wrapper with tab navigation
 *   - ProfileSettingsComponent: edit displayName, bio, avatar
 *   - AccountSettingsComponent: change password, danger zone
 *   - AppearanceSettingsComponent: theme and density preferences
 *   - NotificationPreferencesComponent: toggle notification types
 *
 * SharedModule provides CommonModule, FormsModule, ReactiveFormsModule,
 * RouterModule, and shared pipes (TimeAgoPipe).
 */
@NgModule({
  declarations: [
    SettingsShellComponent,
    ProfileSettingsComponent,
    AccountSettingsComponent,
    AppearanceSettingsComponent,
    NotificationPreferencesComponent,
  ],
  imports: [
    SharedModule,
    SettingsRoutingModule,
  ],
})
export class SettingsModule {}
