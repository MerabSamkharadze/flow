import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Column } from '../../../../shared/models/column.model';
import { Task } from '../../../../shared/models/task.model';

/**
 * BoardColumnComponent — a single vertical column on the Kanban board.
 *
 * Each column acts as a CDK drop list. Task cards within it are cdkDrag items.
 * The cdkDropListGroup on the parent board container connects all columns.
 *
 * Supports inline task creation via TaskFormComponent and forwards
 * task clicks up to the kanban-view for opening the detail modal.
 */
@Component({
  selector: 'app-board-column',
  templateUrl: './board-column.component.html',
  styleUrls: ['./board-column.component.scss'],
})
export class BoardColumnComponent {
  @Input() column!: Column;
  @Input() tasks: Task[] = [];

  /** Emits partial task data from the inline task form */
  @Output() addTask = new EventEmitter<{ columnId: string; taskData: Partial<Task> }>();

  /** Emits CDK drop event to the parent kanban-view for dispatch */
  @Output() taskDropped = new EventEmitter<CdkDragDrop<Task[]>>();

  /** Emits when a task card is clicked (to open detail modal) */
  @Output() taskClicked = new EventEmitter<Task>();

  /** Whether the inline task form is visible */
  showTaskForm = false;

  /** Whether the column is at or over its WIP limit */
  get isOverLimit(): boolean {
    return this.column.taskLimit !== null && this.tasks.length >= this.column.taskLimit;
  }

  /** WIP limit display text */
  get limitText(): string {
    if (this.column.taskLimit === null) return '';
    return `/ ${this.column.taskLimit}`;
  }

  /** Show the inline task form */
  onShowTaskForm(): void {
    this.showTaskForm = true;
  }

  /** Handle task form submission */
  onTaskCreated(taskData: Partial<Task>): void {
    this.addTask.emit({ columnId: this.column.id, taskData });
    this.showTaskForm = false;
  }

  /** Hide the inline task form */
  onTaskFormCancelled(): void {
    this.showTaskForm = false;
  }

  /** Forward task card click to parent */
  onTaskClicked(task: Task): void {
    this.taskClicked.emit(task);
  }

  /** Forward the CDK drop event to the parent */
  onDrop(event: CdkDragDrop<Task[]>): void {
    this.taskDropped.emit(event);
  }
}
