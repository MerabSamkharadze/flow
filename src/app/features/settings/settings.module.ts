import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { SettingsRoutingModule } from './settings-routing.module';

import { SettingsComponent } from './pages/settings/settings.component';

/**
 * SettingsModule — settings feature module.
 *
 * Lazy-loaded under /settings. Contains user preferences,
 * notification settings, and account management.
 */
@NgModule({
  declarations: [SettingsComponent],
  imports: [SharedModule, SettingsRoutingModule],
})
export class SettingsModule {}
