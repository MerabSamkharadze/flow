import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { TasksRoutingModule } from './tasks-routing.module';

// Pages
import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';

// Components
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskFiltersComponent } from './components/task-filters/task-filters.component';

/**
 * TasksModule — personal task management feature module.
 *
 * Lazy-loaded under /tasks. Shows all tasks assigned to the current user
 * across all projects with filtering, grouping, and quick actions.
 */
@NgModule({
  declarations: [
    MyTasksComponent,
    TaskListComponent,
    TaskFiltersComponent,
  ],
  imports: [
    SharedModule,
    TasksRoutingModule,
  ],
})
export class TasksModule {}
