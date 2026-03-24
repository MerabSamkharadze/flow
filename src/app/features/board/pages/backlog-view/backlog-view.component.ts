import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map, tap } from 'rxjs';
import { Column } from '../../../../shared/models/column.model';
import { isTaskCompleted } from '../../../../shared/models/task.model';
import { Task, TaskPriority, PRIORITY_CONFIG, ISSUE_TYPE_CONFIG } from '../../../../shared/models/task.model';
import { BoardFilters } from '../../models/board-filters.model';
import * as BoardActions from '../../store/board.actions';
import {
  selectColumns,
  selectFilteredTasksMap,
  selectBoardLoading,
  selectBoardError,
  selectActiveTask,
  selectUniqueLabels,
} from '../../store/board.selectors';

/** Priority weight for sorting (critical first) */
const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** A column section with its tasks for the backlog view */
export interface BacklogSection {
  column: Column;
  tasks: Task[];
  expanded: boolean;
}

/**
 * BacklogViewComponent — flat, prioritized list of all tasks grouped by column.
 *
 * Each column is a collapsible section. Tasks within each section are
 * sorted by priority (critical → low), then by order field.
 * Reuses board-filters, task-detail-modal, and task-form.
 */
@Component({
  selector: 'app-backlog-view',
  templateUrl: './backlog-view.component.html',
  styleUrls: ['./backlog-view.component.scss'],
  standalone: false,
})
export class BacklogViewComponent implements OnInit {
  projectId = '';

  columns$!: Observable<Column[]>;
  filteredTasksMap$!: Observable<{ [columnId: string]: Task[] }>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  activeTask$!: Observable<Task | null>;
  uniqueLabels$!: Observable<string[]>;

  /** Backlog sections — columns with their sorted tasks */
  sections$!: Observable<BacklogSection[]>;

  /** Local sections snapshot for status lookups */
  sections: BacklogSection[] = [];

  /** Inline task form state */
  addingInSection: string | null = null;

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
    this.filteredTasksMap$ = this.store.select(selectFilteredTasksMap);
    this.loading$ = this.store.select(selectBoardLoading);
    this.error$ = this.store.select(selectBoardError);
    this.activeTask$ = this.store.select(selectActiveTask);
    this.uniqueLabels$ = this.store.select(selectUniqueLabels);

    this.store.dispatch(BoardActions.loadBoard({ projectId: this.projectId }));

    // Build sections: combine columns + filtered tasks, sort by priority
    this.sections$ = combineLatest([this.columns$, this.filteredTasksMap$]).pipe(
      map(([columns, tasksMap]) =>
        columns.map((column, index) => ({
          column,
          tasks: this.sortByPriority(tasksMap[column.id] || []),
          expanded: this.sections.find((s) => s.column.id === column.id)?.expanded ?? index === 0,
        }))
      ),
      tap((sections) => { this.sections = sections; })
    );
  }

  /** Sort tasks by priority (critical first), then by order */
  private sortByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      return pw !== 0 ? pw : a.order - b.order;
    });
  }

  // ---------------------------------------------------------------------------
  // Section collapse/expand
  // ---------------------------------------------------------------------------

  toggleSection(section: BacklogSection): void {
    section.expanded = !section.expanded;
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
          startDate: task.startDate || null,
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
  // Inline task creation
  // ---------------------------------------------------------------------------

  showAddForm(columnId: string): void {
    this.addingInSection = columnId;
  }

  onTaskCreated(columnId: string, taskData: Partial<Task>): void {
    const section = this.sections.find((s) => s.column.id === columnId);
    const status = section ? section.column.name : 'To Do';
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
          status,
          issueType: taskData.issueType || 'task',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deadline: null,
          startDate: null,
          completedAt: null,
          estimatedHours: null,
          order: 0,
          labels: taskData.labels || [],
          subtasks: [],
        },
      })
    );
    this.addingInSection = null;
  }

  onTaskFormCancelled(): void {
    this.addingInSection = null;
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  formatDeadline(deadline: string | null): string | null {
    if (!deadline) return null;
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  isOverdue(task: Task): boolean {
    if (!task.deadline) return false;
    return new Date(task.deadline).getTime() < Date.now() && !isTaskCompleted(task);
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  onSwitchToBoard(): void {
    this.router.navigate(['projects', this.projectId, 'board']);
  }

  onSwitchToList(): void {
    this.router.navigate(['projects', this.projectId, 'board', 'list']);
  }

  onSwitchToRoadmap(): void {
    this.router.navigate(['projects', this.projectId, 'board', 'roadmap']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  // ---------------------------------------------------------------------------
  // TrackBy
  // ---------------------------------------------------------------------------

  trackByColumnId(_index: number, section: BacklogSection): string {
    return section.column.id;
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }
}
