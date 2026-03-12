import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';

/**
 * TasksRoutingModule — routes for the tasks feature.
 *
 * Lazy-loaded under /tasks:
 *   /tasks → MyTasksComponent
 */
const routes: Routes = [
  { path: '', component: MyTasksComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
