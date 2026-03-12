import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Column } from '../../../../shared/models/column.model';
import { Task } from '../../../../shared/models/task.model';

/**
 * BoardColumnComponent — a single vertical column on the Kanban board.
 *
 * Each column acts as a CDK drop list. Task cards within it are cdkDrag items.
 * The cdkDropListGroup on the parent board container connects all columns,
 * allowing tasks to be dragged between them.
 *
 * If the column has a WIP limit, shows a warning when at/over capacity.
 */
@Component({
  selector: 'app-board-column',
  templateUrl: './board-column.component.html',
  styleUrls: ['./board-column.component.scss'],
})
export class BoardColumnComponent {
  @Input() column!: Column;
  @Input() tasks: Task[] = [];

  /** Emits when user clicks "Add Task" */
  @Output() addTask = new EventEmitter<string>();

  /** Emits CDK drop event to the parent kanban-view for dispatch */
  @Output() taskDropped = new EventEmitter<CdkDragDrop<Task[]>>();

  /** Whether the column is at or over its WIP limit */
  get isOverLimit(): boolean {
    return this.column.taskLimit !== null && this.tasks.length >= this.column.taskLimit;
  }

  /** WIP limit display text */
  get limitText(): string {
    if (this.column.taskLimit === null) return '';
    return `/ ${this.column.taskLimit}`;
  }

  onAddTask(): void {
    this.addTask.emit(this.column.id);
  }

  /** Forward the CDK drop event to the parent */
  onDrop(event: CdkDragDrop<Task[]>): void {
    this.taskDropped.emit(event);
  }
}
