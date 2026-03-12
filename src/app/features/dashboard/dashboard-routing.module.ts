import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';

/**
 * DashboardRoutingModule — routes for the dashboard feature.
 *
 * Lazy-loaded under /dashboard:
 *   /dashboard → DashboardComponent
 */
const routes: Routes = [
  { path: '', component: DashboardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
