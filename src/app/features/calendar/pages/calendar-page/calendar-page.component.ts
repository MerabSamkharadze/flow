import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Task, TaskPriority, PRIORITY_CONFIG } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';
import * as TasksActions from '../../../tasks/store/tasks.actions';
import {
  selectAllMyTasks,
  selectUserProjects,
  selectTasksLoading,
} from '../../../tasks/store/tasks.selectors';
import { selectUser } from '../../../auth/store';

type CalendarView = 'month' | 'week';

interface CalendarDay {
  date: Date;
  dateStr: string;      // 'YYYY-MM-DD'
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  tasks: Task[];
}

@Component({
  standalone: false,
  selector: 'app-calendar-page',
  templateUrl: './calendar-page.component.html',
  styleUrls: ['./calendar-page.component.scss'],
})
export class CalendarPageComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  viewMode: CalendarView = 'month';
  days: CalendarDay[] = [];
  weekDays: CalendarDay[] = [];
  readonly dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly priorityConfig = PRIORITY_CONFIG;

  /** Filters */
  allTasks: Task[] = [];
  projects: Project[] = [];
  selectedProjectId = '';
  myTasksOnly = false;
  selectedPriority: TaskPriority | '' = '';
  loading = false;

  private userId = '';
  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.select(selectUser).pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.store.dispatch(TasksActions.loadMyTasks({ userId: user.uid }));
        this.store.dispatch(TasksActions.loadUserProjects({ userId: user.uid }));
      }
    });

    this.store.select(selectAllMyTasks).pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      this.allTasks = tasks;
      this.buildCalendar();
    });

    this.store.select(selectUserProjects).pipe(takeUntil(this.destroy$)).subscribe((projects) => {
      this.projects = projects;
    });

    this.store.select(selectTasksLoading).pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.loading = loading;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  get monthLabel(): string {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    const d = new Date(this.currentDate);
    if (this.viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    this.currentDate = d;
    this.buildCalendar();
  }

  nextMonth(): void {
    const d = new Date(this.currentDate);
    if (this.viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    this.currentDate = d;
    this.buildCalendar();
  }

  goToday(): void {
    this.currentDate = new Date();
    this.buildCalendar();
  }

  setView(mode: CalendarView): void {
    this.viewMode = mode;
    this.buildCalendar();
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  onFilterChange(): void {
    this.buildCalendar();
  }

  private getFilteredTasks(): Task[] {
    let tasks = this.allTasks.filter((t) => !!t.deadline);

    if (this.selectedProjectId) {
      tasks = tasks.filter((t) => t.projectId === this.selectedProjectId);
    }
    if (this.myTasksOnly) {
      tasks = tasks.filter((t) => t.assigneeId === this.userId);
    }
    if (this.selectedPriority) {
      tasks = tasks.filter((t) => t.priority === this.selectedPriority);
    }
    return tasks;
  }

  // ---------------------------------------------------------------------------
  // Calendar grid building
  // ---------------------------------------------------------------------------

  private buildCalendar(): void {
    const tasks = this.getFilteredTasks();
    const taskMap = this.groupByDate(tasks);
    const today = new Date();
    const todayStr = this.toDateStr(today);

    if (this.viewMode === 'month') {
      this.days = this.buildMonthDays(taskMap, todayStr, today);
    }
    this.weekDays = this.buildWeekDays(taskMap, todayStr, today);
  }

  private buildMonthDays(taskMap: Map<string, Task[]>, todayStr: string, today: Date): CalendarDay[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based week: 0=Mon, 6=Sun
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.makeDay(d, taskMap, todayStr, today, false));
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.makeDay(date, taskMap, todayStr, today, true));
    }

    // Next month padding to fill 6 rows
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    while (days.length < totalCells) {
      const d = new Date(year, month + 1, nextDay++);
      days.push(this.makeDay(d, taskMap, todayStr, today, false));
    }

    return days;
  }

  private buildWeekDays(taskMap: Map<string, Task[]>, todayStr: string, today: Date): CalendarDay[] {
    const d = new Date(this.currentDate);
    let dayOfWeek = d.getDay() - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;
    d.setDate(d.getDate() - dayOfWeek); // go to Monday

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      days.push(this.makeDay(date, taskMap, todayStr, today, true));
    }
    return days;
  }

  private makeDay(
    date: Date,
    taskMap: Map<string, Task[]>,
    todayStr: string,
    today: Date,
    isCurrentMonth: boolean
  ): CalendarDay {
    const dateStr = this.toDateStr(date);
    return {
      date,
      dateStr,
      dayOfMonth: date.getDate(),
      isCurrentMonth,
      isToday: dateStr === todayStr,
      isPast: date < today && dateStr !== todayStr,
      tasks: taskMap.get(dateStr) || [],
    };
  }

  private groupByDate(tasks: Task[]): Map<string, Task[]> {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.deadline) continue;
      const key = task.deadline.substring(0, 10); // 'YYYY-MM-DD'
      const list = map.get(key) || [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  visibleTasks(day: CalendarDay): Task[] {
    return day.tasks.slice(0, 3);
  }

  extraCount(day: CalendarDay): number {
    return Math.max(0, day.tasks.length - 3);
  }

  getPriorityColor(task: Task): string {
    return PRIORITY_CONFIG[task.priority].color;
  }

  // ---------------------------------------------------------------------------
  // TrackBy
  // ---------------------------------------------------------------------------

  trackByDate(_index: number, day: CalendarDay): string {
    return day.dateStr;
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  trackByProjectId(_index: number, project: Project): string {
    return project.id;
  }
}
