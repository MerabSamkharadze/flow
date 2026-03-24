import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Task, PRIORITY_CONFIG, ISSUE_TYPE_CONFIG, isTaskCompleted } from '../../../../shared/models/task.model';
import { Column } from '../../../../shared/models/column.model';
import { hashLabelColor } from '../../../../shared/components/tag-input/tag-input.component';

/**
 * TaskCardComponent — displays a single task as a card within a board column.
 *
 * Includes a three-dot menu with Edit, Copy, Move, and Delete actions.
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
  @Input() columns: Column[] = [];

  @Output() taskClicked = new EventEmitter<Task>();
  @Output() editTask = new EventEmitter<Task>();
  @Output() copyTask = new EventEmitter<Task>();
  @Output() moveTask = new EventEmitter<{ task: Task; toColumnId: string }>();
  @Output() deleteTask = new EventEmitter<Task>();

  /** Menu state */
  menuOpen = false;
  moveSubmenuOpen = false;
  showDeleteConfirm = false;

  /** Fixed-position dropdown coordinates */
  dropdownTop = 0;
  dropdownLeft = 0;

  @ViewChild('menuBtn') menuBtnRef!: ElementRef<HTMLButtonElement>;

  constructor(private elRef: ElementRef) {}

  get priorityConfig() {
    return PRIORITY_CONFIG[this.task.priority];
  }

  get issueTypeConfig() {
    return ISSUE_TYPE_CONFIG[this.task.issueType || 'task'];
  }

  get formattedDeadline(): string | null {
    if (!this.task.deadline) return null;
    return new Date(this.task.deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  get isOverdue(): boolean {
    if (!this.task.deadline) return false;
    return new Date(this.task.deadline).getTime() < Date.now() && !isTaskCompleted(this.task);
  }

  get completedSubtasks(): number {
    return this.task.subtasks.filter((s) => s.completed).length;
  }

  get totalSubtasks(): number {
    return this.task.subtasks.length;
  }

  get visibleLabels(): string[] {
    return (this.task.labels || []).slice(0, 2);
  }

  get extraLabelCount(): number {
    return Math.max(0, (this.task.labels || []).length - 2);
  }

  /** Other columns (exclude current) for Move submenu */
  get otherColumns(): Column[] {
    return this.columns.filter((c) => c.id !== this.task.columnId);
  }

  getLabelColor(label: string): string {
    return hashLabelColor(label);
  }

  trackByLabel(_index: number, label: string): string {
    return label;
  }

  trackByColumnId(_index: number, col: Column): string {
    return col.id;
  }

  // ---------------------------------------------------------------------------
  // Card click
  // ---------------------------------------------------------------------------

  onCardClick(): void {
    if (!this.menuOpen) {
      this.taskClicked.emit(this.task);
    }
  }

  // ---------------------------------------------------------------------------
  // Menu
  // ---------------------------------------------------------------------------

  toggleMenu(event: Event): void {
    event.stopPropagation();
    if (!this.menuOpen) {
      this.computeDropdownPosition();
    }
    this.menuOpen = !this.menuOpen;
    this.moveSubmenuOpen = false;
  }

  private computeDropdownPosition(): void {
    const btn = this.menuBtnRef?.nativeElement;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dropdownHeight = 200; // approximate max height
    const spaceBelow = window.innerHeight - rect.bottom;

    // Open downward from button, or upward if not enough space
    if (spaceBelow >= dropdownHeight) {
      this.dropdownTop = rect.bottom + 4;
    } else {
      this.dropdownTop = rect.top - dropdownHeight;
    }
    // Align right edge with button right edge
    this.dropdownLeft = rect.right - 180; // 180 ~ dropdown min-width + padding
    // Clamp to viewport
    if (this.dropdownLeft < 8) this.dropdownLeft = 8;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMenu();
  }

  private closeMenu(): void {
    this.menuOpen = false;
    this.moveSubmenuOpen = false;
  }

  // ---------------------------------------------------------------------------
  // Menu actions
  // ---------------------------------------------------------------------------

  onEdit(event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    this.editTask.emit(this.task);
  }

  onCopy(event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    this.copyTask.emit(this.task);
  }

  onToggleMoveSubmenu(event: Event): void {
    event.stopPropagation();
    this.moveSubmenuOpen = !this.moveSubmenuOpen;
  }

  onMoveToColumn(event: Event, columnId: string): void {
    event.stopPropagation();
    this.closeMenu();
    this.moveTask.emit({ task: this.task, toColumnId: columnId });
  }

  onRequestDelete(event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    this.showDeleteConfirm = true;
  }

  onConfirmDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTask.emit(this.task);
  }

  onCancelDelete(): void {
    this.showDeleteConfirm = false;
  }
}
