import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Column } from '../../../../shared/models/column.model';
import { Task } from '../../../../shared/models/task.model';
import { BoardFilters } from '../../models/board-filters.model';
import * as BoardActions from '../../store/board.actions';
import {
  selectColumns,
  selectFilteredTasksMap,
  selectBoardLoading,
  selectBoardError,
  selectActiveTask,
} from '../../store/board.selectors';
import { selectCommentCounts } from '../../../tasks/store/tasks.selectors';

/**
 * KanbanViewComponent — main Kanban board page.
 *
 * Orchestrates:
 *   - Board filters at the top (search, priority, assignee)
 *   - Columns with CDK drag & drop
 *   - Inline task creation via TaskFormComponent
 *   - Task detail modal on card click
 *
 * Uses selectFilteredTasksMap to reactively filter displayed tasks
 * whenever the filters or underlying task data changes.
 */
@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  standalone: false
})
export class KanbanViewComponent implements OnInit {
  projectId = '';

  /** Observable streams from NgRx store */
  columns$!: Observable<Column[]>;
  filteredTasksMap$!: Observable<{ [columnId: string]: Task[] }>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  activeTask$!: Observable<Task | null>;

  /** Comment counts keyed by task ID — passed through to board-column → task-card */
  commentCounts$!: Observable<{ [taskId: string]: number }>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    // Get project ID from the parent route (projects/:id/board)
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';

    // Select state from the store — uses filtered tasks map
    this.columns$ = this.store.select(selectColumns);
    this.filteredTasksMap$ = this.store.select(selectFilteredTasksMap);
    this.loading$ = this.store.select(selectBoardLoading);
    this.error$ = this.store.select(selectBoardError);
    this.activeTask$ = this.store.select(selectActiveTask);
    this.commentCounts$ = this.store.select(selectCommentCounts);

    // Dispatch loadBoard to fetch columns + tasks from Firestore
    this.store.dispatch(BoardActions.loadBoard({ projectId: this.projectId }));
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  /** Handle filter changes from the BoardFiltersComponent */
  onFiltersChanged(filters: BoardFilters): void {
    this.store.dispatch(BoardActions.setFilters({ filters }));
  }

  // ---------------------------------------------------------------------------
  // Drag & drop
  // ---------------------------------------------------------------------------

  /** Handles CDK drop event — dispatches moveTask action */
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

  // ---------------------------------------------------------------------------
  // Task detail modal
  // ---------------------------------------------------------------------------

  /** Open task detail modal by setting the active task */
  onTaskClicked(task: Task): void {
    this.store.dispatch(BoardActions.setActiveTask({ taskId: task.id }));
  }

  /** Close the task detail modal */
  onCloseModal(): void {
    this.store.dispatch(BoardActions.setActiveTask({ taskId: null }));
  }

  /** Handle task update from the detail modal */
  onTaskUpdated(task: Task): void {
    this.store.dispatch(
      BoardActions.updateTask({
        projectId: this.projectId,
        taskId: task.id,
        changes: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assigneeId: task.assigneeId,
          deadline: task.deadline,
          labels: task.labels,
          subtasks: task.subtasks,
        },
      })
    );
    // Close the modal after saving
    this.store.dispatch(BoardActions.setActiveTask({ taskId: null }));
  }

  /** Handle task deletion from the detail modal */
  onTaskDeleted(taskId: string): void {
    // Find the task's columnId from the store for the delete action
    this.store.dispatch(BoardActions.setActiveTask({ taskId: null }));
    // Note: We need the columnId; the effect/service handles it by taskId
    this.store.dispatch(
      BoardActions.deleteTask({
        projectId: this.projectId,
        taskId,
        columnId: '', // Will be resolved in the reducer by searching all columns
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Task creation (inline form from column)
  // ---------------------------------------------------------------------------

  /** Handle task creation from the inline TaskFormComponent */
  onAddTask(event: { columnId: string; taskData: Partial<Task> }): void {
    const { columnId, taskData } = event;

    this.store.dispatch(
      BoardActions.addTask({
        projectId: this.projectId,
        task: {
          title: taskData.title || 'Untitled',
          description: '',
          projectId: this.projectId,
          columnId,
          assigneeId: taskData.assigneeId || null,
          priority: taskData.priority || 'medium',
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

  // ---------------------------------------------------------------------------
  // Column actions
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /** Navigate to list view */
  onSwitchToList(): void {
    this.router.navigate(['projects', this.projectId, 'board', 'list']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}
