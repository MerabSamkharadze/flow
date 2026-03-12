import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './pages/settings/settings.component';

/**
 * SettingsRoutingModule — routes for the settings feature.
 *
 * Lazy-loaded under /settings:
 *   /settings → SettingsComponent
 */
const routes: Routes = [
  { path: '', component: SettingsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
