import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Task, PRIORITY_CONFIG, ISSUE_TYPE_CONFIG } from '../../../../shared/models/task.model';
import { hashLabelColor } from '../../../../shared/components/tag-input/tag-input.component';

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
  standalone: false,
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() commentCount: number = 0;
  @Input() loggedHours: number = 0;

  /** Emits the task when the card is clicked (opens detail modal) */
  @Output() taskClicked = new EventEmitter<Task>();

  /** Get display config for the task's priority */
  get priorityConfig() {
    return PRIORITY_CONFIG[this.task.priority];
  }

  /** Get display config for the task's issue type */
  get issueTypeConfig() {
    return ISSUE_TYPE_CONFIG[this.task.issueType || 'task'];
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

  /** Max 2 visible labels, rest collapsed into "+N" */
  get visibleLabels(): string[] {
    return (this.task.labels || []).slice(0, 2);
  }

  get extraLabelCount(): number {
    return Math.max(0, (this.task.labels || []).length - 2);
  }

  /** Get consistent color for a label */
  getLabelColor(label: string): string {
    return hashLabelColor(label);
  }

  trackByLabel(_index: number, label: string): string {
    return label;
  }

  /** Handle card click — emit task for detail modal */
  onCardClick(): void {
    this.taskClicked.emit(this.task);
  }
}
