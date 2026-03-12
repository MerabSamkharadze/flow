import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../../shared/shared.module';
import { TasksRoutingModule } from './tasks-routing.module';
import { tasksReducer } from './store/tasks.reducer';
import { TasksEffects } from './store/tasks.effects';

// Pages
import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';

// Components
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskFiltersComponent } from './components/task-filters/task-filters.component';

/**
 * TasksModule — personal task management feature module.
 *
 * Lazy-loaded under /tasks and /my-tasks. Shows all tasks assigned to
 * the current user across all projects with filtering, grouping,
 * subtask management, and quick actions.
 *
 * Registers the 'tasks' NgRx feature state slice and effects.
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
    StoreModule.forFeature('tasks', tasksReducer),
    EffectsModule.forFeature([TasksEffects]),
  ],
})
export class TasksModule {}
