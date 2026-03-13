import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TaskPriority } from '../../../../shared/models/task.model';
import { BoardFilters, EMPTY_FILTERS } from '../../models/board-filters.model';

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
  @Output() filtersChanged = new EventEmitter<BoardFilters>();

  /** Reactive form controls */
  searchControl = new FormControl('');
  assigneeControl = new FormControl('');

  /** Currently selected priority filters */
  selectedPriorities: TaskPriority[] = [];

  /** All available priorities for the toggle buttons */
  readonly priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

  trackByPriority(_index: number, p: TaskPriority): string {
    return p;
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

  /** Clear all filters and reset to defaults */
  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.assigneeControl.setValue('', { emitEvent: false });
    this.selectedPriorities = [];
    this.emitFilters();
  }

  /** Whether any filter is active */
  get hasActiveFilters(): boolean {
    return (
      !!this.searchControl.value ||
      this.selectedPriorities.length > 0 ||
      !!this.assigneeControl.value
    );
  }

  /** Build and emit the current BoardFilters object */
  private emitFilters(): void {
    const filters: BoardFilters = {
      search: (this.searchControl.value || '').trim(),
      priority: [...this.selectedPriorities],
      assigneeId: (this.assigneeControl.value || '').trim() || null,
    };
    this.filtersChanged.emit(filters);
  }
}
