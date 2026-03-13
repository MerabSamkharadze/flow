import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsShellComponent } from './pages/settings-shell/settings-shell.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { AccountSettingsComponent } from './pages/account-settings/account-settings.component';
import { AppearanceSettingsComponent } from './pages/appearance-settings/appearance-settings.component';
import { NotificationPreferencesComponent } from './pages/notification-preferences/notification-preferences.component';

/**
 * SettingsRoutingModule — routes for the settings feature.
 *
 * Lazy-loaded under /settings.
 * SettingsShellComponent acts as the layout wrapper with tab navigation.
 * Child routes render into the shell's <router-outlet>.
 */
const routes: Routes = [
  {
    path: '',
    component: SettingsShellComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileSettingsComponent },
      { path: 'account', component: AccountSettingsComponent },
      { path: 'appearance', component: AppearanceSettingsComponent },
      { path: 'notifications', component: NotificationPreferencesComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
