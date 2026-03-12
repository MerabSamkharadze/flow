import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';

import { DashboardComponent } from './pages/dashboard/dashboard.component';

/**
 * DashboardModule — dashboard feature module.
 *
 * Lazy-loaded under /dashboard. Contains the main dashboard page
 * with project stats, recent activity, and overview widgets.
 */
@NgModule({
  declarations: [DashboardComponent],
  imports: [SharedModule, DashboardRoutingModule],
})
export class DashboardModule {}
