import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TasksModule } from '../tasks/tasks.module';

// NgRx — projects store (needed for selectAllProjects on the dashboard;
// NgRx safely deduplicates if ProjectsModule also registers this slice)
import { projectsReducer } from '../projects/store/projects.reducer';
import { ProjectsEffects } from '../projects/store/projects.effects';

// Pages
import { DashboardComponent } from './pages/dashboard/dashboard.component';

// Components
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { RecentTasksComponent } from './components/recent-tasks/recent-tasks.component';
import { MyProjectsComponent } from './components/my-projects/my-projects.component';

/**
 * DashboardModule — dashboard feature module.
 *
 * Lazy-loaded under /dashboard. Contains the main dashboard overview
 * with stat cards, recent tasks table, and project sidebar.
 *
 * Imports TasksModule for the 'tasks' NgRx feature state selectors.
 * Also registers the 'projects' feature state slice + effects so
 * project data is available even if ProjectsModule hasn't loaded yet.
 */
@NgModule({
  declarations: [
    DashboardComponent,
    StatsCardComponent,
    RecentTasksComponent,
    MyProjectsComponent,
  ],
  imports: [
    SharedModule,
    DashboardRoutingModule,
    TasksModule,

    // Register projects store for dashboard use
    StoreModule.forFeature('projects', projectsReducer),
    EffectsModule.forFeature([ProjectsEffects]),
  ],
})
export class DashboardModule {}
