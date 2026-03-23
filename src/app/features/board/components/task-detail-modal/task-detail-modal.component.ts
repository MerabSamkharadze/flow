import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  HostListener,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Task, Subtask, TaskPriority, TaskStatus, IssueType, PRIORITY_CONFIG, ISSUE_TYPE_CONFIG } from '../../../../shared/models/task.model';
import { selectAllTasks } from '../../store/board.selectors';
import { Comment } from '../../../../shared/models/comment.model';
import { Member } from '../../../../shared/models/member.model';
import { ProjectsService } from '../../../projects/services/projects.service';
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
  standalone: false,
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
  readonly issueTypes: IssueType[] = ['task', 'bug', 'story', 'epic'];
  readonly priorityConfig = PRIORITY_CONFIG;
  readonly issueTypeConfig = ISSUE_TYPE_CONFIG;

  trackByIndex(index: number): number {
    return index;
  }

  trackBySubtaskId(_index: number, sub: Subtask): string {
    return sub.id;
  }

  /** Local copy of subtasks for manipulation before save */
  subtasks: Subtask[] = [];

  /** Comments */
  comments$!: Observable<Comment[]>;
  currentUserId = '';
  currentUserName = '';
  currentUserAvatar: string | null = null;

  /** Labels (tag chip model) */
  taskLabels: string[] = [];
  labelSuggestions: string[] = [];

  /** Assignee autocomplete */
  members: Member[] = [];
  filteredMembers: Member[] = [];
  assigneeSearchText = '';
  showAssigneeDropdown = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private projectsService: ProjectsService,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadComments();
    this.loadMembers();

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
      issueType: [this.task.issueType || 'task'],
      assigneeId: [this.task.assigneeId || ''],
      deadline: [this.task.deadline || ''],
    });
    this.taskLabels = [...(this.task.labels || [])];
    this.subtasks = this.task.subtasks.map((s) => ({ ...s }));
    this.loadLabelSuggestions();
  }

  /** Load unique labels from all tasks in this project */
  private loadLabelSuggestions(): void {
    this.store
      .select(selectAllTasks)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks) => {
        const labelSet = new Set<string>();
        for (const t of tasks) {
          for (const l of t.labels || []) {
            labelSet.add(l);
          }
        }
        this.labelSuggestions = Array.from(labelSet).sort();
      });
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

  /** Close assignee dropdown when clicking outside it */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.assignee-autocomplete')) {
      this.showAssigneeDropdown = false;
    }
  }

  /** Load project members from Firestore */
  private loadMembers(): void {
    this.projectsService
      .getMembers(this.task.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((members) => {
        this.members = members;
        // Set the display text if assignee is already set
        if (this.task.assigneeId) {
          const assigned = members.find((m) => m.userId === this.task.assigneeId);
          if (assigned) {
            this.assigneeSearchText = assigned.displayName || assigned.email;
          }
        }
      });
  }

  /** Filter members as user types in the assignee field */
  onAssigneeSearch(query: string): void {
    this.assigneeSearchText = query;
    this.showAssigneeDropdown = true;

    const q = query.toLowerCase().trim();
    this.filteredMembers = q
      ? this.members.filter((m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
        )
      : [...this.members];

    // If user clears the field, also clear the form control
    if (!query.trim()) {
      this.form.patchValue({ assigneeId: '' });
    }
  }

  /** Handle focus on assignee input — show full member list */
  onAssigneeFocus(): void {
    this.filteredMembers = [...this.members];
    this.showAssigneeDropdown = true;
  }

  /** Select a member from the dropdown */
  selectAssignee(member: Member): void {
    this.assigneeSearchText = member.displayName || member.email;
    this.form.patchValue({ assigneeId: member.userId });
    this.showAssigneeDropdown = false;
  }

  /** Clear the selected assignee */
  clearAssignee(): void {
    this.assigneeSearchText = '';
    this.form.patchValue({ assigneeId: '' });
    this.showAssigneeDropdown = false;
  }

  /** trackBy for member list */
  trackMember(_index: number, member: Member): string {
    return member.userId;
  }

  /** Get initials from a display name (for avatar fallback) */
  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((p) => p.length > 0)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /** Save changes — build the updated Task object and emit */
  onSave(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;

    const updatedTask: Task = {
      ...this.task,
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      status: formValue.status,
      issueType: formValue.issueType || 'task',
      assigneeId: formValue.assigneeId || null,
      deadline: formValue.deadline || null,
      labels: [...this.taskLabels],
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
