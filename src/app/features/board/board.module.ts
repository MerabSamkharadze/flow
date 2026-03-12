import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../shared/shared.module';
import { BoardRoutingModule } from './board-routing.module';
import { boardReducer } from './store/board.reducer';
import { BoardEffects } from './store/board.effects';
import { TasksModule } from '../tasks/tasks.module';

// Pages
import { KanbanViewComponent } from './pages/kanban-view/kanban-view.component';
import { ListViewComponent } from './pages/list-view/list-view.component';

// Components
import { BoardColumnComponent } from './components/board-column/board-column.component';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { BoardFiltersComponent } from './components/board-filters/board-filters.component';
import { TaskDetailModalComponent } from './components/task-detail-modal/task-detail-modal.component';
import { TaskFormComponent } from './components/task-form/task-form.component';

@NgModule({
  declarations: [
    KanbanViewComponent,
    ListViewComponent,
    BoardColumnComponent,
    TaskCardComponent,
    BoardFiltersComponent,
    TaskDetailModalComponent,
    TaskFormComponent,
  ],
  imports: [
    SharedModule,
    BoardRoutingModule,
    DragDropModule,
    TasksModule,
    StoreModule.forFeature('board', boardReducer),
    EffectsModule.forFeature([BoardEffects]),
  ],
})
export class BoardModule {}
