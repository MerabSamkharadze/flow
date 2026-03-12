import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TeamComponent } from './pages/team/team.component';

/**
 * TeamRoutingModule — routes for the team feature.
 *
 * Lazy-loaded under /team:
 *   /team → TeamComponent
 */
const routes: Routes = [
  { path: '', component: TeamComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {}
