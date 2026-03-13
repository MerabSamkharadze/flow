import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil, filter } from 'rxjs/operators';

import { Task } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';
import { AuthUser } from '../../../auth/store/auth.actions';

// Auth store
import { selectUser } from '../../../auth/store';

// Tasks store
import {
  loadMyTasks,
  loadUserProjects,
  selectFilteredTasks,
  selectOverdueTasks,
  selectTodayTasks,
  selectActiveTasksCount,
  selectProjectMap,
  selectTasksLoading,
} from '../../../tasks/store';

// Projects store
import {
  loadProjects,
  selectAllProjects,
} from '../../../projects/store';

/**
 * DashboardComponent — main overview page.
 *
 * Displays stat cards, recent tasks, and a project sidebar.
 * Dispatches data load actions on init and computes derived
 * observables for the template.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  /** Store-backed observables */
  projects$!: Observable<Project[]>;
  myTasks$!: Observable<Task[]>;
  overdueTasks$!: Observable<Task[]>;
  todayTasks$!: Observable<Task[]>;
  activeCount$!: Observable<number>;
  projectMap$!: Observable<{ [id: string]: { id: string; name: string } }>;
  loading$!: Observable<boolean>;

  /** Derived: last 5 tasks sorted by updatedAt */
  recentTasks$!: Observable<Task[]>;

  /** Greeting based on time of day */
  greeting = '';

  /** First name extracted from the authenticated user */
  firstName = '';

  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    // Set time-based greeting
    this.greeting = this.getGreeting();

    // Subscribe to current user → dispatch data loads once we have a uid
    this.store
      .select(selectUser)
      .pipe(
        filter((user): user is AuthUser => !!user),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        this.firstName = this.extractFirstName(user);
        this.store.dispatch(loadMyTasks({ userId: user.uid }));
        this.store.dispatch(loadUserProjects({ userId: user.uid }));
      });

    // Load projects (all projects the user can see)
    this.store.dispatch(loadProjects());

    // Wire up store selectors
    this.projects$ = this.store.select(selectAllProjects);
    this.myTasks$ = this.store.select(selectFilteredTasks);
    this.overdueTasks$ = this.store.select(selectOverdueTasks);
    this.todayTasks$ = this.store.select(selectTodayTasks);
    this.activeCount$ = this.store.select(selectActiveTasksCount);
    this.projectMap$ = this.store.select(selectProjectMap);
    this.loading$ = this.store.select(selectTasksLoading);

    // Recent tasks: sorted by updatedAt desc, take first 5
    this.recentTasks$ = this.myTasks$.pipe(
      map((tasks) =>
        [...tasks]
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 5)
      )
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Returns a time-appropriate greeting string */
  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /** Extracts the first name from the AuthUser displayName or email */
  private extractFirstName(user: AuthUser): string {
    if (user.displayName) {
      return user.displayName.split(' ')[0];
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'there';
  }
}
