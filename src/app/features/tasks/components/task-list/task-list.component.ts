import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task, PRIORITY_CONFIG, TaskPriority } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';

/**
 * TaskListComponent — renders tasks in a sortable table/list.
 *
 * Columns: Title | Project | Priority | Deadline | Status | Actions
 * Supports "Mark as Done" quick action per task row.
 */
@Component({
  standalone: false,
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent {
  /** Tasks to display */
  @Input() tasks: Task[] = [];

  /** Project lookup map for displaying project names */
  @Input() projectMap: { [id: string]: Project } = {};

  /** Grouping mode */
  @Input() groupBy: 'status' | 'priority' | 'project' = 'status';

  /** Emitted when the user clicks "Mark as Done" */
  @Output() markDone = new EventEmitter<Task>();

  /** Emitted when the user clicks a task row */
  @Output() taskClicked = new EventEmitter<Task>();

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  /** Get the project name for a task */
  getProjectName(task: Task): string {
    return this.projectMap[task.projectId]?.name || 'Unknown';
  }

  /** Get the project color for a task */
  getProjectColor(task: Task): string {
    return this.projectMap[task.projectId]?.color || '#6b7280';
  }

  /** Get priority display config */
  getPriorityConfig(priority: TaskPriority) {
    return PRIORITY_CONFIG[priority];
  }

  /** Format deadline for display */
  formatDeadline(deadline: string | null): string {
    if (!deadline) return '-';
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /** Whether a task's deadline is overdue */
  isOverdue(task: Task): boolean {
    if (!task.deadline || task.status === 'done') return false;
    return new Date(task.deadline).getTime() < Date.now();
  }

  /** Handle mark-as-done click */
  onMarkDone(event: Event, task: Task): void {
    event.stopPropagation();
    this.markDone.emit(task);
  }

  /** Handle row click */
  onRowClick(task: Task): void {
    this.taskClicked.emit(task);
  }
}
