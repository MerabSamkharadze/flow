import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task, TaskPriority, IssueType, ISSUE_TYPE_CONFIG } from '../../../../shared/models/task.model';

/**
 * TaskFormComponent — inline quick-create form shown inside a board column.
 *
 * Provides a compact form with issue type selector, title (required),
 * priority selector, and assignee input. Emits the partial Task data
 * on submit, or emits cancelled when the user dismisses the form.
 */
@Component({
  standalone: false,
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
})
export class TaskFormComponent implements OnInit {
  /** The column ID where this task will be created */
  @Input() columnId = '';

  @Output() taskCreated = new EventEmitter<Partial<Task>>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;

  /** Available priorities for the dropdown */
  readonly priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

  /** Available issue types */
  readonly issueTypes: IssueType[] = ['task', 'bug', 'story', 'epic'];
  readonly issueTypeConfig = ISSUE_TYPE_CONFIG;

  /** Currently selected issue type */
  selectedIssueType: IssueType = 'task';

  trackByPriority(_index: number, p: TaskPriority): string {
    return p;
  }

  trackByIssueType(_index: number, t: IssueType): string {
    return t;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      priority: ['medium'],
      assigneeId: [''],
    });
  }

  /** Select an issue type */
  selectIssueType(type: IssueType): void {
    this.selectedIssueType = type;
  }

  /** Submit the form and emit the partial task data */
  onSubmit(): void {
    if (this.form.invalid) return;

    const { title, priority, assigneeId } = this.form.value;

    this.taskCreated.emit({
      title: title.trim(),
      priority,
      issueType: this.selectedIssueType,
      assigneeId: assigneeId?.trim() || null,
      columnId: this.columnId,
    });

    // Reset form after submission
    this.form.reset({ title: '', priority: 'medium', assigneeId: '' });
    this.selectedIssueType = 'task';
  }

  /** Cancel and hide the form */
  onCancel(): void {
    this.cancelled.emit();
  }
}
