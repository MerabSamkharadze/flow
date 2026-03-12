import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Task, TaskPriority } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';
import { selectUser } from '../../../auth/store';
import { TasksService } from '../../services/tasks.service';
import { TaskFilters, EMPTY_TASK_FILTERS } from '../../models/task-filters.model';

/** Priority sort weight — higher number = more urgent */
const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/**
 * Grouped tasks by deadline proximity.
 */
export interface TaskGroups {
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
  upcoming: Task[];
  noDueDate: Task[];
}

/**
 * MyTasksComponent — shows all tasks assigned to the current user
 * across every project they belong to.
 *
 * Tasks are grouped by deadline: Overdue / Today / This Week / Upcoming / No Due Date.
 * Supports filtering, sorting, and a "Mark as Done" quick action.
 */
@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss'],
})
export class MyTasksComponent implements OnInit, OnDestroy {
  /** All tasks assigned to the current user */
  allTasks: Task[] = [];

  /** Filtered + sorted tasks */
  filteredTasks: Task[] = [];

  /** Tasks grouped by deadline proximity */
  taskGroups: TaskGroups = { overdue: [], today: [], thisWeek: [], upcoming: [], noDueDate: [] };

  /** Projects the user belongs to (for filter dropdown) */
  projects: Project[] = [];

  /** Project lookup map by ID */
  projectMap: { [id: string]: Project } = {};

  /** Current view mode */
  viewMode: 'grouped' | 'list' = 'grouped';

  /** Loading state */
  loading = true;

  /** Current filter state */
  filters: TaskFilters = { ...EMPTY_TASK_FILTERS };

  private currentUserId = '';
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private tasksService: TasksService
  ) {}

  ngOnInit(): void {
    // Get current user, then load their tasks and projects
    this.store
      .select(selectUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user && user.uid !== this.currentUserId) {
          this.currentUserId = user.uid;
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Toggle between grouped and flat list views */
  setViewMode(mode: 'grouped' | 'list'): void {
    this.viewMode = mode;
  }

  /** Handle filter changes from TaskFiltersComponent */
  onFiltersChanged(filters: TaskFilters): void {
    this.filters = filters;
    this.applyFiltersAndGroup();
  }

  /** Mark a task as done via Firestore */
  onMarkDone(task: Task): void {
    this.tasksService.markTaskDone(task.projectId, task.id).then(() => {
      // Optimistically update local state
      const idx = this.allTasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        this.allTasks = [
          ...this.allTasks.slice(0, idx),
          { ...this.allTasks[idx], status: 'done', updatedAt: Date.now() },
          ...this.allTasks.slice(idx + 1),
        ];
        this.applyFiltersAndGroup();
      }
    });
  }

  /** Total count of non-done tasks */
  get activeTasks(): number {
    return this.allTasks.filter((t) => t.status !== 'done').length;
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /** Load projects and tasks from Firestore */
  private loadData(): void {
    this.loading = true;

    // Load user projects for filter dropdown
    this.tasksService
      .getUserProjects(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((projects) => {
        this.projects = projects;
        this.projectMap = {};
        for (const p of projects) {
          this.projectMap[p.id] = p;
        }
      });

    // Load all tasks assigned to the user
    this.tasksService
      .getUserTasks(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks) => {
        this.allTasks = tasks;
        this.loading = false;
        this.applyFiltersAndGroup();
      });
  }

  /** Apply current filters, sort, and group tasks */
  private applyFiltersAndGroup(): void {
    let tasks = [...this.allTasks];

    // Apply search filter
    if (this.filters.search) {
      const term = this.filters.search.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(term));
    }

    // Apply status filter
    if (this.filters.status.length > 0) {
      tasks = tasks.filter((t) => this.filters.status.includes(t.status));
    }

    // Apply priority filter
    if (this.filters.priority.length > 0) {
      tasks = tasks.filter((t) => this.filters.priority.includes(t.priority));
    }

    // Apply project filter
    if (this.filters.projectId) {
      tasks = tasks.filter((t) => t.projectId === this.filters.projectId);
    }

    // Apply sort
    tasks = this.sortTasks(tasks);

    this.filteredTasks = tasks;
    this.taskGroups = this.groupByDeadline(tasks);
  }

  /** Sort tasks by the selected field and direction */
  private sortTasks(tasks: Task[]): Task[] {
    const dir = this.filters.sortDir === 'asc' ? 1 : -1;

    return tasks.sort((a, b) => {
      switch (this.filters.sortBy) {
        case 'deadline': {
          // Tasks without deadline go to the end
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return (new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) * dir;
        }
        case 'priority':
          return (PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]) * dir;
        case 'createdAt':
          return (a.createdAt - b.createdAt) * dir;
        default:
          return 0;
      }
    });
  }

  /** Group tasks by deadline proximity */
  private groupByDeadline(tasks: Task[]): TaskGroups {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const groups: TaskGroups = {
      overdue: [],
      today: [],
      thisWeek: [],
      upcoming: [],
      noDueDate: [],
    };

    for (const task of tasks) {
      if (!task.deadline) {
        groups.noDueDate.push(task);
        continue;
      }

      const deadline = new Date(task.deadline);

      if (task.status !== 'done' && deadline.getTime() < todayStart.getTime()) {
        groups.overdue.push(task);
      } else if (deadline.getTime() >= todayStart.getTime() && deadline.getTime() < todayEnd.getTime()) {
        groups.today.push(task);
      } else if (deadline.getTime() >= todayEnd.getTime() && deadline.getTime() < weekEnd.getTime()) {
        groups.thisWeek.push(task);
      } else {
        groups.upcoming.push(task);
      }
    }

    return groups;
  }
}
