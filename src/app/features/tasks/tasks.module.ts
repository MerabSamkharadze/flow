import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { TasksRoutingModule } from './tasks-routing.module';

import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';

/**
 * TasksModule — tasks feature module.
 *
 * Lazy-loaded under /tasks. Contains the personal task list
 * with filters, status tracking, and task management.
 */
@NgModule({
  declarations: [MyTasksComponent],
  imports: [SharedModule, TasksRoutingModule],
})
export class TasksModule {}
