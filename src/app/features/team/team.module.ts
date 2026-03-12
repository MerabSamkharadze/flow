import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { TeamRoutingModule } from './team-routing.module';

import { TeamComponent } from './pages/team/team.component';

/**
 * TeamModule — team feature module.
 *
 * Lazy-loaded under /team. Contains team member management,
 * roles, and invitation workflows.
 */
@NgModule({
  declarations: [TeamComponent],
  imports: [SharedModule, TeamRoutingModule],
})
export class TeamModule {}
