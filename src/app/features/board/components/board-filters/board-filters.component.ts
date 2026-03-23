import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TaskPriority, IssueType, ISSUE_TYPE_CONFIG } from '../../../../shared/models/task.model';
import { BoardFilters, EMPTY_FILTERS } from '../../models/board-filters.model';
import { hashLabelColor } from '../../../../shared/components/tag-input/tag-input.component';

/**
 * BoardFiltersComponent — filter bar above the Kanban board.
 *
 * Provides:
 *   - Search input with RxJS debounceTime(300) + distinctUntilChanged
 *   - Priority multi-select toggle buttons
 *   - Assignee text filter
 *
 * Emits the combined BoardFilters object whenever any filter changes.
 */
@Component({
  standalone: false,
  selector: 'app-board-filters',
  templateUrl: './board-filters.component.html',
  styleUrls: ['./board-filters.component.scss'],
})
export class BoardFiltersComponent implements OnInit, OnDestroy {
  /** Unique labels from all board tasks — provided by parent */
  @Input() availableLabels: string[] = [];

  @Output() filtersChanged = new EventEmitter<BoardFilters>();

  /** Reactive form controls */
  searchControl = new FormControl('');
  assigneeControl = new FormControl('');

  /** Currently selected priority filters */
  selectedPriorities: TaskPriority[] = [];

  /** Currently selected issue type filters */
  selectedIssueTypes: IssueType[] = [];

  /** Currently selected label filters */
  selectedLabels: string[] = [];
  showLabelDropdown = false;

  /** All available priorities for the toggle buttons */
  readonly priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

  /** All available issue types */
  readonly issueTypes: IssueType[] = ['task', 'bug', 'story', 'epic'];
  readonly issueTypeConfig = ISSUE_TYPE_CONFIG;

  trackByPriority(_index: number, p: TaskPriority): string {
    return p;
  }

  trackByIssueType(_index: number, t: IssueType): string {
    return t;
  }

  trackByLabel(_index: number, l: string): string {
    return l;
  }

  /** Whether the filter panel is expanded (for mobile / compact view) */
  isExpanded = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Debounce search input to avoid excessive re-renders
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.emitFilters());

    // Debounce assignee input similarly
    this.assigneeControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.emitFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Toggle a priority filter on/off */
  togglePriority(priority: TaskPriority): void {
    const index = this.selectedPriorities.indexOf(priority);
    if (index === -1) {
      this.selectedPriorities = [...this.selectedPriorities, priority];
    } else {
      this.selectedPriorities = this.selectedPriorities.filter((p) => p !== priority);
    }
    this.emitFilters();
  }

  /** Check if a priority is currently selected */
  isPrioritySelected(priority: TaskPriority): boolean {
    return this.selectedPriorities.includes(priority);
  }

  /** Toggle an issue type filter on/off */
  toggleIssueType(type: IssueType): void {
    const index = this.selectedIssueTypes.indexOf(type);
    if (index === -1) {
      this.selectedIssueTypes = [...this.selectedIssueTypes, type];
    } else {
      this.selectedIssueTypes = this.selectedIssueTypes.filter((t) => t !== type);
    }
    this.emitFilters();
  }

  /** Check if an issue type is currently selected */
  isIssueTypeSelected(type: IssueType): boolean {
    return this.selectedIssueTypes.includes(type);
  }

  /** Toggle a label filter on/off */
  toggleLabel(label: string): void {
    const index = this.selectedLabels.indexOf(label);
    if (index === -1) {
      this.selectedLabels = [...this.selectedLabels, label];
    } else {
      this.selectedLabels = this.selectedLabels.filter((l) => l !== label);
    }
    this.emitFilters();
  }

  /** Check if a label is currently selected */
  isLabelSelected(label: string): boolean {
    return this.selectedLabels.includes(label);
  }

  /** Get consistent color for a label */
  getLabelColor(label: string): string {
    return hashLabelColor(label);
  }

  /** Toggle label dropdown visibility */
  toggleLabelDropdown(): void {
    this.showLabelDropdown = !this.showLabelDropdown;
  }

  /** Clear all filters and reset to defaults */
  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.assigneeControl.setValue('', { emitEvent: false });
    this.selectedPriorities = [];
    this.selectedIssueTypes = [];
    this.selectedLabels = [];
    this.showLabelDropdown = false;
    this.emitFilters();
  }

  /** Whether any filter is active */
  get hasActiveFilters(): boolean {
    return (
      !!this.searchControl.value ||
      this.selectedPriorities.length > 0 ||
      this.selectedIssueTypes.length > 0 ||
      this.selectedLabels.length > 0 ||
      !!this.assigneeControl.value
    );
  }

  /** Build and emit the current BoardFilters object */
  private emitFilters(): void {
    const filters: BoardFilters = {
      search: (this.searchControl.value || '').trim(),
      priority: [...this.selectedPriorities],
      assigneeId: (this.assigneeControl.value || '').trim() || null,
      issueType: [...this.selectedIssueTypes],
      labels: [...this.selectedLabels],
    };
    this.filtersChanged.emit(filters);
  }
}
