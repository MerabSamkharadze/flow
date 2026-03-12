import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Task, Subtask, TaskPriority, TaskStatus, PRIORITY_CONFIG } from '../../../../shared/models/task.model';
import { Comment } from '../../../../shared/models/comment.model';
import * as TasksActions from '../../../tasks/store/tasks.actions';
import { selectCommentsByTask } from '../../../tasks/store/tasks.selectors';
import { selectUser } from '../../../auth/store';

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
export class TaskDetailModalComponent implements OnInit, OnChanges, OnDestroy {
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

  /** Comments */
  comments$!: Observable<Comment[]>;
  currentUserId = '';
  currentUserName = '';
  currentUserAvatar: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private store: Store) {}

  ngOnInit(): void {
    this.initForm();
    this.loadComments();

    this.store
      .select(selectUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.currentUserId = user.uid;
          this.currentUserName = user.displayName || user.email || 'User';
          this.currentUserAvatar = user.photoURL || null;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && !changes['task'].firstChange) {
      this.initForm();
      this.loadComments();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  /** Load comments from the store */
  private loadComments(): void {
    this.comments$ = this.store.select(selectCommentsByTask(this.task.id));
    this.store.dispatch(
      TasksActions.loadComments({
        projectId: this.task.projectId,
        taskId: this.task.id,
      })
    );
  }

  /** Subtask completion progress (e.g., "2 / 5") */
  get subtaskProgress(): string {
    const done = this.subtasks.filter((s) => s.completed).length;
    return `${done} / ${this.subtasks.length}`;
  }

  /** Subtask completion percentage for progress bar */
  get subtaskPercent(): number {
    if (this.subtasks.length === 0) return 0;
    return Math.round(
      (this.subtasks.filter((s) => s.completed).length / this.subtasks.length) * 100
    );
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

  /** Handle new comment from comment-input */
  onCommentSubmitted(content: string): void {
    this.store.dispatch(
      TasksActions.addComment({
        projectId: this.task.projectId,
        taskId: this.task.id,
        authorId: this.currentUserId,
        authorName: this.currentUserName,
        authorAvatar: this.currentUserAvatar,
        content,
      })
    );
  }

  /** Handle comment edit */
  onEditComment(event: { commentId: string; content: string }): void {
    this.store.dispatch(
      TasksActions.editComment({
        projectId: this.task.projectId,
        taskId: this.task.id,
        commentId: event.commentId,
        content: event.content,
      })
    );
  }

  /** Handle comment delete */
  onDeleteComment(commentId: string): void {
    this.store.dispatch(
      TasksActions.deleteComment({
        projectId: this.task.projectId,
        taskId: this.task.id,
        commentId,
      })
    );
  }
}
