import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map } from 'rxjs';
import { Column } from '../../../../shared/models/column.model';
import {
  Task,
  TaskPriority,
  PRIORITY_CONFIG,
  ISSUE_TYPE_CONFIG,
} from '../../../../shared/models/task.model';
import * as BoardActions from '../../store/board.actions';
import {
  selectColumns,
  selectFilteredTasksMap,
  selectBoardLoading,
  selectBoardError,
  selectActiveTask,
} from '../../store/board.selectors';

type ZoomLevel = 'week' | 'month' | 'quarter';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A column section with tasks for the left panel */
interface RoadmapSection {
  column: Column;
  tasks: Task[];
  expanded: boolean;
}

/** Pre-computed bar position for a task */
interface TaskBar {
  task: Task;
  left: number;   // percentage
  width: number;  // percentage
  hasDeadline: boolean;
}

/** Header column (month or week label) */
interface TimelineColumn {
  label: string;
  sublabel: string;
  widthPercent: number;
}

@Component({
  selector: 'app-roadmap-view',
  templateUrl: './roadmap-view.component.html',
  styleUrls: ['./roadmap-view.component.scss'],
  standalone: false,
})
export class RoadmapViewComponent implements OnInit, AfterViewInit {
  projectId = '';

  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  activeTask$!: Observable<Task | null>;

  sections: RoadmapSection[] = [];
  timelineColumns: TimelineColumn[] = [];
  todayPercent = 0;
  zoomLevel: ZoomLevel = 'month';
  showWithoutDates = true;

  /** Timeline date boundaries */
  private timelineStart = 0;
  private timelineEnd = 0;
  private totalDays = 1;

  /** All tasks (flat) for bar computation */
  private allTasks: Task[] = [];

  readonly priorityConfig = PRIORITY_CONFIG;
  readonly issueTypeConfig = ISSUE_TYPE_CONFIG;

  @ViewChild('timelineScroll') timelineScroll!: ElementRef<HTMLElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';

    this.loading$ = this.store.select(selectBoardLoading);
    this.error$ = this.store.select(selectBoardError);
    this.activeTask$ = this.store.select(selectActiveTask);

    this.store.dispatch(BoardActions.loadBoard({ projectId: this.projectId }));

    combineLatest([
      this.store.select(selectColumns),
      this.store.select(selectFilteredTasksMap),
    ]).subscribe(([columns, tasksMap]) => {
      // Collect all tasks
      this.allTasks = [];
      for (const colTasks of Object.values(tasksMap)) {
        this.allTasks.push(...colTasks);
      }

      // Build sections
      this.sections = columns.map((column, i) => ({
        column,
        tasks: tasksMap[column.id] || [],
        expanded: i < 2,
      }));

      this.computeTimeline();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToToday(), 300);
  }

  // ---------------------------------------------------------------------------
  // Timeline computation
  // ---------------------------------------------------------------------------

  private computeTimeline(): void {
    const now = Date.now();
    const padding = 14 * DAY_MS; // 2 weeks padding

    // Find date range from all tasks
    let minDate = now;
    let maxDate = now;

    for (const task of this.allTasks) {
      const start = this.getTaskStart(task);
      const end = this.getTaskEnd(task);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }

    this.timelineStart = minDate - padding;
    this.timelineEnd = maxDate + padding;
    this.totalDays = Math.max(1, (this.timelineEnd - this.timelineStart) / DAY_MS);

    // Today marker
    this.todayPercent = ((now - this.timelineStart) / (this.timelineEnd - this.timelineStart)) * 100;

    // Build header columns
    this.timelineColumns = this.buildColumns();
  }

  private buildColumns(): TimelineColumn[] {
    const cols: TimelineColumn[] = [];
    const start = new Date(this.timelineStart);
    const end = new Date(this.timelineEnd);
    const totalMs = this.timelineEnd - this.timelineStart;

    if (this.zoomLevel === 'week') {
      // Weekly columns
      const d = new Date(start);
      d.setDate(d.getDate() - d.getDay()); // start of week
      while (d.getTime() < end.getTime()) {
        const weekEnd = new Date(d);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const colStart = Math.max(d.getTime(), this.timelineStart);
        const colEnd = Math.min(weekEnd.getTime(), this.timelineEnd);
        const w = ((colEnd - colStart) / totalMs) * 100;
        if (w > 0) {
          cols.push({
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sublabel: '',
            widthPercent: w,
          });
        }
        d.setDate(d.getDate() + 7);
      }
    } else if (this.zoomLevel === 'month') {
      // Monthly columns
      const d = new Date(start.getFullYear(), start.getMonth(), 1);
      while (d.getTime() < end.getTime()) {
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const colStart = Math.max(d.getTime(), this.timelineStart);
        const colEnd = Math.min(monthEnd.getTime(), this.timelineEnd);
        const w = ((colEnd - colStart) / totalMs) * 100;
        if (w > 0) {
          cols.push({
            label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            sublabel: '',
            widthPercent: w,
          });
        }
        d.setMonth(d.getMonth() + 1);
      }
    } else {
      // Quarterly columns
      const d = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
      while (d.getTime() < end.getTime()) {
        const qEnd = new Date(d.getFullYear(), d.getMonth() + 3, 1);
        const colStart = Math.max(d.getTime(), this.timelineStart);
        const colEnd = Math.min(qEnd.getTime(), this.timelineEnd);
        const w = ((colEnd - colStart) / totalMs) * 100;
        if (w > 0) {
          cols.push({
            label: `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`,
            sublabel: '',
            widthPercent: w,
          });
        }
        d.setMonth(d.getMonth() + 3);
      }
    }

    return cols;
  }

  // ---------------------------------------------------------------------------
  // Task bar positioning
  // ---------------------------------------------------------------------------

  getTaskBar(task: Task): TaskBar {
    const start = this.getTaskStart(task);
    const end = this.getTaskEnd(task);
    const totalMs = this.timelineEnd - this.timelineStart;

    const left = ((start - this.timelineStart) / totalMs) * 100;
    const width = Math.max(0.5, ((end - start) / totalMs) * 100);

    return {
      task,
      left: Math.max(0, left),
      width: Math.min(width, 100 - Math.max(0, left)),
      hasDeadline: !!task.deadline,
    };
  }

  private getTaskStart(task: Task): number {
    if (task.startDate) return new Date(task.startDate).getTime();
    return task.createdAt;
  }

  private getTaskEnd(task: Task): number {
    if (task.deadline) return new Date(task.deadline).getTime();
    // No deadline — show a 7-day placeholder bar
    return this.getTaskStart(task) + 7 * DAY_MS;
  }

  shouldShowTask(task: Task): boolean {
    if (this.showWithoutDates) return true;
    return !!task.deadline;
  }

  // ---------------------------------------------------------------------------
  // Section toggle
  // ---------------------------------------------------------------------------

  toggleSection(section: RoadmapSection): void {
    section.expanded = !section.expanded;
  }

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------

  setZoom(level: ZoomLevel): void {
    this.zoomLevel = level;
    this.computeTimeline();
  }

  scrollToToday(): void {
    if (!this.timelineScroll?.nativeElement) return;
    const container = this.timelineScroll.nativeElement;
    const scrollTarget = (this.todayPercent / 100) * container.scrollWidth - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, scrollTarget);
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
      BoardActions.deleteTask({ projectId: this.projectId, taskId, columnId: '' })
    );
  }

  // ---------------------------------------------------------------------------
  // Tooltip helpers
  // ---------------------------------------------------------------------------

  formatDate(date: string | number | null): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  onSwitchToBacklog(): void {
    this.router.navigate(['projects', this.projectId, 'board', 'backlog']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  trackByColumnId(_index: number, section: RoadmapSection): string {
    return section.column.id;
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  trackByColLabel(_index: number, col: TimelineColumn): string {
    return col.label;
  }
}
