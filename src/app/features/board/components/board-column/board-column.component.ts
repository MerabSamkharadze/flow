import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Column } from '../../../../shared/models/column.model';
import { Task } from '../../../../shared/models/task.model';

@Component({
  selector: 'app-board-column',
  templateUrl: './board-column.component.html',
  styleUrls: ['./board-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardColumnComponent {
  @Input() column!: Column;
  @Input() tasks: Task[] = [];
  @Input() commentCounts: { [taskId: string]: number } = {};

  @Output() addTask = new EventEmitter<{ columnId: string; taskData: Partial<Task> }>();
  @Output() taskDropped = new EventEmitter<CdkDragDrop<Task[]>>();
  @Output() taskClicked = new EventEmitter<Task>();
  @Output() renameColumn = new EventEmitter<{ columnId: string; name: string }>();
  @Output() deleteColumnRequest = new EventEmitter<string>(); // columnId

  @ViewChild('renameInput') renameInput!: ElementRef<HTMLInputElement>;

  showTaskForm = false;

  /** Column header menu state */
  isMenuOpen = false;
  isRenaming = false;
  editName = '';
  showDeleteConfirm = false;

  get isOverLimit(): boolean {
    return this.column.taskLimit !== null && this.tasks.length >= this.column.taskLimit;
  }

  get limitText(): string {
    if (this.column.taskLimit === null) return '';
    return `/ ${this.column.taskLimit}`;
  }

  // ── Menu ─────────────────────────────────────────────────────────

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.board-column__menu')) {
      this.isMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
    if (this.isRenaming) {
      this.cancelRename();
    }
  }

  // ── Rename ───────────────────────────────────────────────────────

  startRename(): void {
    this.isMenuOpen = false;
    this.isRenaming = true;
    this.editName = this.column.name;

    // Auto-focus after Angular renders the input
    setTimeout(() => {
      this.renameInput?.nativeElement?.focus();
      this.renameInput?.nativeElement?.select();
    });
  }

  confirmRename(): void {
    const name = this.editName.trim();
    if (name && name !== this.column.name) {
      this.renameColumn.emit({ columnId: this.column.id, name });
    }
    this.isRenaming = false;
  }

  cancelRename(): void {
    this.isRenaming = false;
    this.editName = '';
  }

  // ── Delete ───────────────────────────────────────────────────────

  requestDelete(): void {
    this.isMenuOpen = false;
    this.showDeleteConfirm = true;
  }

  onConfirmDelete(): void {
    this.deleteColumnRequest.emit(this.column.id);
    this.showDeleteConfirm = false;
  }

  onCancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  // ── Task form ────────────────────────────────────────────────────

  onShowTaskForm(): void {
    this.showTaskForm = true;
  }

  onTaskCreated(taskData: Partial<Task>): void {
    this.addTask.emit({ columnId: this.column.id, taskData });
    this.showTaskForm = false;
  }

  onTaskFormCancelled(): void {
    this.showTaskForm = false;
  }

  onTaskClicked(task: Task): void {
    this.taskClicked.emit(task);
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    this.taskDropped.emit(event);
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }
}
