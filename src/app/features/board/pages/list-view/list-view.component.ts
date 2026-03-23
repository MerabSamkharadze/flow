import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map } from 'rxjs';
import { Column } from '../../../../shared/models/column.model';
import { Task, TaskPriority, TaskStatus, PRIORITY_CONFIG, ISSUE_TYPE_CONFIG } from '../../../../shared/models/task.model';
import { hashLabelColor } from '../../../../shared/components/tag-input/tag-input.component';
import { BoardFilters } from '../../models/board-filters.model';
import * as BoardActions from '../../store/board.actions';
import {
  selectColumns,
  selectFilteredAllTasks,
  selectBoardLoading,
  selectBoardError,
  selectActiveTask,
  selectUniqueLabels,
} from '../../store/board.selectors';

type SortField = 'title' | 'issueType' | 'status' | 'priority' | 'assigneeId' | 'deadline' | 'columnId';
type SortDirection = 'asc' | 'desc';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_ORDER: Record<TaskStatus, number> = {
  'todo': 0,
  'in-progress': 1,
  'in-review': 2,
  'done': 3,
};

/**
 * ListViewComponent — table-based view of board tasks.
 *
 * Shows all tasks in a sortable table with columns for
 * title, status, priority, assignee, deadline, and board column.
 * Shares the same NgRx filters as the Kanban board view.
 */
@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss'],
  standalone: false
})
export class ListViewComponent implements OnInit {
  projectId = '';

  columns$!: Observable<Column[]>;
  tasks$!: Observable<Task[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  activeTask$!: Observable<Task | null>;

  /** Column lookup map for displaying column names */
  columnMap$!: Observable<Record<string, Column>>;

  /** Unique labels from all tasks — passed to board-filters */
  uniqueLabels$!: Observable<string[]>;

  /** Sorted tasks — combines store tasks with local sort state */
  sortedTasks$!: Observable<Task[]>;

  sortField: SortField = 'title';
  sortDirection: SortDirection = 'asc';

  readonly priorityConfig = PRIORITY_CONFIG;
  readonly issueTypeConfig = ISSUE_TYPE_CONFIG;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';

    this.columns$ = this.store.select(selectColumns);
    this.tasks$ = this.store.select(selectFilteredAllTasks);
    this.loading$ = this.store.select(selectBoardLoading);
    this.error$ = this.store.select(selectBoardError);
    this.activeTask$ = this.store.select(selectActiveTask);
    this.uniqueLabels$ = this.store.select(selectUniqueLabels);

    this.columnMap$ = this.columns$.pipe(
      map(cols => {
        const m: Record<string, Column> = {};
        for (const c of cols) { m[c.id] = c; }
        return m;
      })
    );

    // Load board data (columns + tasks) — same as kanban view
    this.store.dispatch(BoardActions.loadBoard({ projectId: this.projectId }));

    this.sortedTasks$ = this.tasks$.pipe(
      map(tasks => this.sortTasks(tasks))
    );
  }

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------

  onSort(field: SortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    // Re-trigger sort by re-selecting
    this.sortedTasks$ = this.tasks$.pipe(
      map(tasks => this.sortTasks(tasks))
    );
  }

  private sortTasks(tasks: Task[]): Task[] {
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...tasks].sort((a, b) => {
      switch (this.sortField) {
        case 'title':
          return dir * a.title.localeCompare(b.title);
        case 'issueType':
          return dir * (a.issueType || 'task').localeCompare(b.issueType || 'task');
        case 'status':
          return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
        case 'priority':
          return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
        case 'assigneeId':
          return dir * (a.assigneeId || '').localeCompare(b.assigneeId || '');
        case 'deadline': {
          const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return dir * (da - db);
        }
        case 'columnId':
          return dir * a.columnId.localeCompare(b.columnId);
        default:
          return 0;
      }
    });
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) return '';
    return this.sortDirection === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  onFiltersChanged(filters: BoardFilters): void {
    this.store.dispatch(BoardActions.setFilters({ filters }));
  }

  // ---------------------------------------------------------------------------
  // Task detail modal
  // ---------------------------------------------------------------------------

  onTaskClicked(task: Task): void {
    this.store.dispatch(BoardActions.setActiveTask({ taskId: task.id }));
  }

  onCloseModal(): void {
    this.store.dispatch(BoardActions.setActiveTask({ taskId: null }));
  }

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
          issueType: task.issueType || 'task',
          assigneeId: task.assigneeId,
          deadline: task.deadline,
          labels: task.labels,
          subtasks: task.subtasks,
        },
      })
    );
    this.store.dispatch(BoardActions.setActiveTask({ taskId: null }));
  }

  onTaskDeleted(taskId: string): void {
    this.store.dispatch(BoardActions.setActiveTask({ taskId: null }));
    this.store.dispatch(
      BoardActions.deleteTask({
        projectId: this.projectId,
        taskId,
        columnId: '',
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'in-review': return 'In Review';
      case 'done': return 'Done';
    }
  }

  formatDeadline(deadline: string | null): string {
    if (!deadline) return '\u2014';
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  isOverdue(task: Task): boolean {
    if (!task.deadline) return false;
    return new Date(task.deadline).getTime() < Date.now() && task.status !== 'done';
  }

  getInitials(assigneeId: string | null): string {
    if (!assigneeId) return '';
    return assigneeId.charAt(0).toUpperCase();
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  onSwitchToBoard(): void {
    this.router.navigate(['projects', this.projectId, 'board']);
  }

  onSwitchToBacklog(): void {
    this.router.navigate(['projects', this.projectId, 'board', 'backlog']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  getLabelColor(label: string): string {
    return hashLabelColor(label);
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }
}
