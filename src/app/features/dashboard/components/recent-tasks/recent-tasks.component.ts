import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Task, PRIORITY_CONFIG, TaskPriority } from '../../../../shared/models/task.model';

/**
 * RecentTasksComponent — displays the 5 most recently updated tasks
 * in a compact table format.
 *
 * Clicking a task row navigates to that task's project board.
 */
@Component({
  standalone: false,
  selector: 'app-recent-tasks',
  templateUrl: './recent-tasks.component.html',
  styleUrls: ['./recent-tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentTasksComponent {
  /** Tasks to display (max 5, pre-sorted by parent) */
  @Input() tasks: Task[] = [];

  /** Project name lookup by ID */
  @Input() projectMap: { [id: string]: { id: string; name: string } } = {};

  constructor(private router: Router) {}

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  /** Navigate to the task's project board */
  onClick(task: Task): void {
    this.router.navigate(['/projects', task.projectId, 'board']);
  }

  /** Get the project name for a task */
  getProjectName(task: Task): string {
    return this.projectMap[task.projectId]?.name || 'Unknown';
  }

  /** Get priority display config */
  getPriorityConfig(priority: TaskPriority): { label: string; color: string } {
    return PRIORITY_CONFIG[priority];
  }

  /** Format a status string for display (e.g. 'in-progress' → 'In Progress') */
  formatStatus(status: string): string {
    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /** Format deadline for display */
  formatDeadline(deadline: string | null): string {
    if (!deadline) return '\u2014';
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /** Check if a deadline is overdue */
  isOverdue(task: Task): boolean {
    if (!task.deadline || task.status === 'done') return false;
    return new Date(task.deadline).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  /** Check if a deadline is today */
  isToday(task: Task): boolean {
    if (!task.deadline) return false;
    const dl = new Date(task.deadline);
    const now = new Date();
    return (
      dl.getFullYear() === now.getFullYear() &&
      dl.getMonth() === now.getMonth() &&
      dl.getDate() === now.getDate()
    );
  }
}
