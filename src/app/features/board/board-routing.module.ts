import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KanbanViewComponent } from './pages/kanban-view/kanban-view.component';
import { ListViewComponent } from './pages/list-view/list-view.component';
import { BacklogViewComponent } from './pages/backlog-view/backlog-view.component';

const routes: Routes = [
  { path: '', component: KanbanViewComponent },
  { path: 'list', component: ListViewComponent },
  { path: 'backlog', component: BacklogViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BoardRoutingModule {}
