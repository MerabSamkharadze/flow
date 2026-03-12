import { NgModule } from '@angular/core';

// Shared module provides CommonModule, FormsModule, ReactiveFormsModule
import { SharedModule } from '../../shared/shared.module';

import { ProjectsRoutingModule } from './projects-routing.module';

// Page components
import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { ProjectFormComponent } from './pages/project-form/project-form.component';
import { ProjectSettingsComponent } from './pages/project-settings/project-settings.component';

// Shared components within this feature
import { ProjectCardComponent } from './components/project-card/project-card.component';

/**
 * ProjectsModule — project management feature module.
 *
 * Lazy-loaded under /projects. Contains project list, detail,
 * creation form, and settings pages.
 */
@NgModule({
  declarations: [
    ProjectListComponent,
    ProjectDetailComponent,
    ProjectFormComponent,
    ProjectSettingsComponent,
    ProjectCardComponent,
  ],
  imports: [
    SharedModule,
    ProjectsRoutingModule,
  ],
})
export class ProjectsModule {}
