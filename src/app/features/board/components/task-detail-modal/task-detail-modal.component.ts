import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task, Subtask, TaskPriority, TaskStatus, PRIORITY_CONFIG } from '../../../../shared/models/task.model';

/**
 * TaskDetailModalComponent — full-screen modal for viewing/editing a task.
 *
 * Displays all task fields in an editable reactive form.
 * Includes a subtasks section with add/toggle/remove functionality.
 *
 * Emits taskUpdated with the full updated Task when user saves,
 * and closeModal when the overlay or close button is clicked.
 */
@Component({
  selector: 'app-task-detail-modal',
  templateUrl: './task-detail-modal.component.html',
  styleUrls: ['./task-detail-modal.component.scss'],
})
export class TaskDetailModalComponent implements OnInit, OnChanges {
  @Input() task!: Task;

  @Output() closeModal = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<string>();

  form!: FormGroup;
  newSubtaskTitle = '';

  /** Available priorities for the dropdown */
  readonly priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
  readonly statuses: TaskStatus[] = ['todo', 'in-progress', 'in-review', 'done'];
  readonly priorityConfig = PRIORITY_CONFIG;

  /** Local copy of subtasks for manipulation before save */
  subtasks: Subtask[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && !changes['task'].firstChange) {
      this.initForm();
    }
  }

  /** Initialize the reactive form from the current task */
  private initForm(): void {
    this.form = this.fb.group({
      title: [this.task.title, Validators.required],
      description: [this.task.description],
      priority: [this.task.priority],
      status: [this.task.status],
      assigneeId: [this.task.assigneeId || ''],
      deadline: [this.task.deadline || ''],
      labels: [this.task.labels.join(', ')],
    });
    this.subtasks = this.task.subtasks.map((s) => ({ ...s }));
  }

  /** Toggle a subtask's completed state */
  toggleSubtask(index: number): void {
    this.subtasks = this.subtasks.map((s, i) =>
      i === index ? { ...s, completed: !s.completed } : s
    );
  }

  /** Remove a subtask by index */
  removeSubtask(index: number): void {
    this.subtasks = this.subtasks.filter((_, i) => i !== index);
  }

  /** Add a new subtask from the input */
  addSubtask(): void {
    const title = this.newSubtaskTitle.trim();
    if (!title) return;

    this.subtasks = [
      ...this.subtasks,
      {
        id: 'sub-' + Date.now(),
        title,
        completed: false,
      },
    ];
    this.newSubtaskTitle = '';
  }

  /** Subtask completion progress (e.g., "2 / 5") */
  get subtaskProgress(): string {
    const done = this.subtasks.filter((s) => s.completed).length;
    return `${done} / ${this.subtasks.length}`;
  }

  /** Save changes — build the updated Task object and emit */
  onSave(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;

    // Parse labels from comma-separated string
    const labels = (formValue.labels as string)
      .split(',')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    const updatedTask: Task = {
      ...this.task,
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      status: formValue.status,
      assigneeId: formValue.assigneeId || null,
      deadline: formValue.deadline || null,
      labels,
      subtasks: this.subtasks,
      updatedAt: Date.now(),
    };

    this.taskUpdated.emit(updatedTask);
  }

  /** Delete task */
  onDelete(): void {
    this.taskDeleted.emit(this.task.id);
  }

  /** Close the modal (overlay click or close button) */
  onClose(): void {
    this.closeModal.emit();
  }

  /** Prevent clicks inside the modal from closing it */
  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}
