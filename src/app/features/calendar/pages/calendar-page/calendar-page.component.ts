import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, of } from 'rxjs';
import { switchMap, map, takeUntil, take } from 'rxjs/operators';
import { Task, TaskPriority, PRIORITY_CONFIG } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';
import { selectUser } from '../../../auth/store';
import { TasksService } from '../../../tasks/services/tasks.service';

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

  /** All tasks from all user projects */
  allTasks: Task[] = [];
  projects: Project[] = [];
  selectedProjectId = '';
  myTasksOnly = false;
  selectedPriority: TaskPriority | '' = '';
  loading = true;

  private userId = '';
  private tasksLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private tasksService: TasksService
  ) {}

  ngOnInit(): void {
    // Load ALL tasks from ALL user projects (not just assigned ones)
    this.store.select(selectUser).pipe(
      takeUntil(this.destroy$),
    ).subscribe((user) => {
      if (!user || this.tasksLoaded) return;
      this.userId = user.uid;
      this.tasksLoaded = true;
      this.loadAllTasks(user.uid);
    });
  }

  private loadAllTasks(userId: string): void {
    // Get projects once (take(1)), then keep task streams alive for real-time updates
    this.tasksService.getUserProjects(userId).pipe(
      take(1),
      switchMap((projects) => {
        this.projects = projects;
        if (projects.length === 0) return of([] as Task[]);

        const streams = projects.map((p) => this.tasksService.getAllProjectTasks(p.id));
        return combineLatest(streams).pipe(
          map((arrays) => ([] as Task[]).concat(...arrays))
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe((tasks) => {
      this.allTasks = tasks;
      this.loading = false;
      this.buildCalendar();
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
    let tasks = this.allTasks.filter((t) => !!this.getDeadlineStr(t));

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

    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: CalendarDay[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.makeDay(d, taskMap, todayStr, today, false));
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.makeDay(date, taskMap, todayStr, today, true));
    }

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
    d.setDate(d.getDate() - dayOfWeek);

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

  /**
   * Group tasks by deadline date string (YYYY-MM-DD).
   * Handles both ISO date strings and Firestore Timestamps.
   */
  private groupByDate(tasks: Task[]): Map<string, Task[]> {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = this.getDeadlineStr(task);
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }

  /**
   * Safely extract a YYYY-MM-DD string from a task's deadline.
   * Handles: ISO string, Firestore Timestamp, Date object, or null.
   */
  private getDeadlineStr(task: Task): string | null {
    const dl = task.deadline;
    if (!dl) return null;

    // Firestore Timestamp object (has toDate method)
    if (typeof dl === 'object' && 'toDate' in (dl as any)) {
      return this.toDateStr((dl as any).toDate());
    }
    // Already a string like '2026-03-25' or '2026-03-25T00:00:00.000Z'
    if (typeof dl === 'string') {
      // Validate it's parseable
      const parsed = new Date(dl);
      if (!isNaN(parsed.getTime())) {
        return this.toDateStr(parsed);
      }
      // Try direct substring (already YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}/.test(dl)) {
        return dl.substring(0, 10);
      }
    }
    // Number (timestamp)
    if (typeof dl === 'number') {
      return this.toDateStr(new Date(dl));
    }
    return null;
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
