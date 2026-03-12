import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { BoardRoutingModule } from './board-routing.module';

// Pages
import { KanbanViewComponent } from './pages/kanban-view/kanban-view.component';
import { ListViewComponent } from './pages/list-view/list-view.component';

// Components
import { BoardColumnComponent } from './components/board-column/board-column.component';
import { TaskCardComponent } from './components/task-card/task-card.component';

@NgModule({
  declarations: [
    KanbanViewComponent,
    ListViewComponent,
    BoardColumnComponent,
    TaskCardComponent,
  ],
  imports: [
    SharedModule,
    BoardRoutingModule,
  ],
})
export class BoardModule {}
