import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Column } from '../../../../shared/models/column.model';
import { Task } from '../../../../shared/models/task.model';

/**
 * BoardColumnComponent — a single vertical column on the Kanban board.
 *
 * Displays a header with the column name, color accent, and task count.
 * Lists all task cards belonging to this column.
 * Has an "Add Task" button at the bottom to create new tasks.
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
  @Output() addTask = new EventEmitter<string>(); // columnId

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
}
