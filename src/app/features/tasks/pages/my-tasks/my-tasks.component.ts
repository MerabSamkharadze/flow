import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Task } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';
import { selectUser } from '../../../auth/store';
import { TaskFilters } from '../../models/task-filters.model';
import * as TasksActions from '../../store/tasks.actions';
import {
  selectFilteredTasks,
  selectOverdueTasks,
  selectTodayTasks,
  selectThisWeekTasks,
  selectUpcomingTasks,
  selectNoDueDateTasks,
  selectActiveTasksCount,
  selectTasksLoading,
  selectTasksError,
  selectUserProjects,
  selectProjectMap,
} from '../../store/tasks.selectors';

/**
 * MyTasksComponent — shows all tasks assigned to the current user
 * across every project they belong to.
 *
 * Connected to NgRx store:
 *   - Dispatches loadMyTasks + loadUserProjects on init
 *   - Uses memoized selectors for filtered/grouped task views
 *   - Dispatches updateTaskStatus for "Mark as Done" quick action
 */
@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss'],
})
export class MyTasksComponent implements OnInit, OnDestroy {
  /** Filtered + sorted tasks from the store */
  filteredTasks$!: Observable<Task[]>;

  /** Deadline-grouped task observables */
  overdueTasks$!: Observable<Task[]>;
  todayTasks$!: Observable<Task[]>;
  thisWeekTasks$!: Observable<Task[]>;
  upcomingTasks$!: Observable<Task[]>;
  noDueDateTasks$!: Observable<Task[]>;

  /** Active (non-done) task count */
  activeTasksCount$!: Observable<number>;

  /** Loading and error state */
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  /** Projects for filter dropdown */
  projects$!: Observable<Project[]>;

  /** Project lookup map for task-list component */
  projectMap$!: Observable<{ [id: string]: Project }>;

  /** Current view mode */
  viewMode: 'grouped' | 'list' = 'grouped';

  /** Local project map snapshot for template use */
  projectMap: { [id: string]: Project } = {};

  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    // Bind store selectors
    this.filteredTasks$ = this.store.select(selectFilteredTasks);
    this.overdueTasks$ = this.store.select(selectOverdueTasks);
    this.todayTasks$ = this.store.select(selectTodayTasks);
    this.thisWeekTasks$ = this.store.select(selectThisWeekTasks);
    this.upcomingTasks$ = this.store.select(selectUpcomingTasks);
    this.noDueDateTasks$ = this.store.select(selectNoDueDateTasks);
    this.activeTasksCount$ = this.store.select(selectActiveTasksCount);
    this.loading$ = this.store.select(selectTasksLoading);
    this.error$ = this.store.select(selectTasksError);
    this.projects$ = this.store.select(selectUserProjects);
    this.projectMap$ = this.store.select(selectProjectMap);

    // Keep a local snapshot of projectMap for the task-list component
    this.projectMap$
      .pipe(takeUntil(this.destroy$))
      .subscribe((map) => (this.projectMap = map));

    // Get current user, then dispatch load actions
    this.store
      .select(selectUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.store.dispatch(TasksActions.loadMyTasks({ userId: user.uid }));
          this.store.dispatch(TasksActions.loadUserProjects({ userId: user.uid }));
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
    this.store.dispatch(TasksActions.setTaskFilters({ filters }));
  }

  /** TrackBy for task lists — improves ngFor performance */
  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  /** Mark a task as done via NgRx action */
  onMarkDone(task: Task): void {
    this.store.dispatch(
      TasksActions.updateTaskStatus({
        projectId: task.projectId,
        taskId: task.id,
        status: 'done',
      })
    );
  }
}
