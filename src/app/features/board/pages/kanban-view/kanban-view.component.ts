import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Column } from '../../../../shared/models/column.model';
import { Task } from '../../../../shared/models/task.model';
import * as BoardActions from '../../store/board.actions';
import {
  selectColumns,
  selectTasksMap,
  selectBoardLoading,
  selectBoardError,
} from '../../store/board.selectors';

/**
 * KanbanViewComponent — main Kanban board page with drag & drop.
 *
 * Uses Angular CDK DragDrop:
 *   - cdkDropListGroup on the board container connects all columns
 *   - Each board-column is a cdkDropList
 *   - Each task-card is a cdkDrag item
 *   - On drop: dispatches moveTask action for optimistic update + Firestore sync
 */
@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
})
export class KanbanViewComponent implements OnInit {
  projectId = '';

  /** Observable streams from NgRx store */
  columns$!: Observable<Column[]>;
  tasksMap$!: Observable<{ [columnId: string]: Task[] }>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    // Get project ID from the parent route (projects/:id/board)
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';

    // Select state from the store
    this.columns$ = this.store.select(selectColumns);
    this.tasksMap$ = this.store.select(selectTasksMap);
    this.loading$ = this.store.select(selectBoardLoading);
    this.error$ = this.store.select(selectBoardError);

    // Dispatch loadBoard to fetch columns + tasks from Firestore
    this.store.dispatch(BoardActions.loadBoard({ projectId: this.projectId }));
  }

  /**
   * Handles CDK drop event — fired when a task card is dropped
   * into a column (same or different).
   * Dispatches moveTask with the source/target column and new index.
   */
  onTaskDropped(event: CdkDragDrop<Task[]>, targetColumnId: string): void {
    const task: Task = event.item.data;
    const fromColumnId = task.columnId;
    const toColumnId = targetColumnId;
    const newOrder = event.currentIndex;

    // Skip if nothing changed (same column, same position)
    if (fromColumnId === toColumnId && event.previousIndex === event.currentIndex) {
      return;
    }

    this.store.dispatch(
      BoardActions.moveTask({
        projectId: this.projectId,
        taskId: task.id,
        fromColumnId,
        toColumnId,
        newOrder,
      })
    );
  }

  onAddColumn(): void {
    const newOrder = 0; // Will be set properly by a dialog
    this.store.dispatch(
      BoardActions.addColumn({
        projectId: this.projectId,
        column: {
          name: 'New Column',
          projectId: this.projectId,
          order: newOrder,
          color: '#6b7280',
          taskLimit: null,
        },
      })
    );
  }

  onAddTask(columnId: string): void {
    this.store.dispatch(
      BoardActions.addTask({
        projectId: this.projectId,
        task: {
          title: 'New Task',
          description: '',
          projectId: this.projectId,
          columnId,
          assigneeId: null,
          priority: 'medium',
          status: 'todo',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deadline: null,
          order: 0,
          labels: [],
          subtasks: [],
        },
      })
    );
  }

  /** Navigate to list view */
  onSwitchToList(): void {
    this.router.navigate(['projects', this.projectId, 'board', 'list']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}
