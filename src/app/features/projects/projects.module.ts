import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

// Shared module provides CommonModule, FormsModule, ReactiveFormsModule, RouterModule
import { SharedModule } from '../../shared/shared.module';

import { ProjectsRoutingModule } from './projects-routing.module';

// Page components
import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { ProjectFormComponent } from './pages/project-form/project-form.component';
import { ProjectSettingsComponent } from './pages/project-settings/project-settings.component';

// Shared components within this feature
import { ProjectCardComponent } from './components/project-card/project-card.component';

// NgRx projects state
import { projectsReducer } from './store/projects.reducer';
import { ProjectsEffects } from './store/projects.effects';

/**
 * ProjectsModule — project management feature module.
 *
 * Lazy-loaded under /projects. Contains project list, detail,
 * creation form, and settings pages.
 * Registers the 'projects' NgRx feature state slice and effects.
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

    // NgRx — register the projects feature state and side effects
    StoreModule.forFeature('projects', projectsReducer),
    EffectsModule.forFeature([ProjectsEffects]),
  ],
})
export class ProjectsModule {}
