import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task, PRIORITY_CONFIG } from '../../../../shared/models/task.model';

/**
 * TaskCardComponent — displays a single task as a card within a board column.
 *
 * Shows the task title, priority badge, assignee avatar,
 * deadline, label chips, and subtask progress.
 *
 * Emits taskClicked when the card body is clicked (not the drag handle)
 * to open the task detail modal.
 */
@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
})
export class TaskCardComponent {
  @Input() task!: Task;

  /** Emits the task when the card is clicked (opens detail modal) */
  @Output() taskClicked = new EventEmitter<Task>();

  /** Get display config for the task's priority */
  get priorityConfig() {
    return PRIORITY_CONFIG[this.task.priority];
  }

  /** Format deadline for display */
  get formattedDeadline(): string | null {
    if (!this.task.deadline) return null;
    return new Date(this.task.deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /** Whether the deadline is overdue */
  get isOverdue(): boolean {
    if (!this.task.deadline) return false;
    return new Date(this.task.deadline).getTime() < Date.now() && this.task.status !== 'done';
  }

  /** Subtask completion count */
  get completedSubtasks(): number {
    return this.task.subtasks.filter((s) => s.completed).length;
  }

  get totalSubtasks(): number {
    return this.task.subtasks.length;
  }

  /** Handle card click — emit task for detail modal */
  onCardClick(): void {
    this.taskClicked.emit(this.task);
  }
}
