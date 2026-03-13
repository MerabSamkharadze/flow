import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TaskPriority } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';
import { TaskFilters, EMPTY_TASK_FILTERS } from '../../models/task-filters.model';

/**
 * TaskFiltersComponent — filter bar for the My Tasks page.
 *
 * Provides search (debounced), status multi-select, priority multi-select,
 * project dropdown, and sort controls.
 * Emits the full TaskFilters object whenever any filter changes.
 */
@Component({
  standalone: false,
  selector: 'app-task-filters',
  templateUrl: './task-filters.component.html',
  styleUrls: ['./task-filters.component.scss'],
})
export class TaskFiltersComponent implements OnInit, OnDestroy {
  /** Available projects for the project filter dropdown */
  @Input() projects: Project[] = [];

  /** Emits the current filter state whenever it changes */
  @Output() filtersChanged = new EventEmitter<TaskFilters>();

  /** Search input with debounce */
  searchControl = new FormControl('');

  /** Current filter state */
  selectedStatuses: string[] = [];
  selectedPriorities: TaskPriority[] = [];
  selectedProjectId = '';
  sortBy = 'deadline';
  sortDir: 'asc' | 'desc' = 'asc';

  /** Available options */
  statuses = ['todo', 'in-progress', 'in-review', 'done'];
  priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
  sortOptions = [
    { value: 'deadline', label: 'Deadline' },
    { value: 'priority', label: 'Priority' },
    { value: 'createdAt', label: 'Created' },
  ];

  trackByValue(_index: number, item: string): string {
    return item;
  }

  trackByProjectId(_index: number, project: Project): string {
    return project.id;
  }

  trackBySortValue(_index: number, opt: { value: string }): string {
    return opt.value;
  }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Debounce search input to avoid excessive re-renders
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.emitFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Toggle a status in the selected list */
  toggleStatus(status: string): void {
    const idx = this.selectedStatuses.indexOf(status);
    if (idx >= 0) {
      this.selectedStatuses = this.selectedStatuses.filter((s) => s !== status);
    } else {
      this.selectedStatuses = [...this.selectedStatuses, status];
    }
    this.emitFilters();
  }

  /** Toggle a priority in the selected list */
  togglePriority(priority: TaskPriority): void {
    const idx = this.selectedPriorities.indexOf(priority);
    if (idx >= 0) {
      this.selectedPriorities = this.selectedPriorities.filter((p) => p !== priority);
    } else {
      this.selectedPriorities = [...this.selectedPriorities, priority];
    }
    this.emitFilters();
  }

  /** Handle project dropdown change */
  onProjectChange(projectId: string): void {
    this.selectedProjectId = projectId;
    this.emitFilters();
  }

  /** Handle sort field change */
  onSortByChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.emitFilters();
  }

  /** Toggle sort direction */
  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.emitFilters();
  }

  /** Whether any filter is active */
  get hasActiveFilters(): boolean {
    return (
      (this.searchControl.value || '') !== '' ||
      this.selectedStatuses.length > 0 ||
      this.selectedPriorities.length > 0 ||
      this.selectedProjectId !== ''
    );
  }

  /** Reset all filters to empty state */
  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedStatuses = [];
    this.selectedPriorities = [];
    this.selectedProjectId = '';
    this.sortBy = 'deadline';
    this.sortDir = 'asc';
    this.emitFilters();
  }

  /** Check if a status is currently selected */
  isStatusSelected(status: string): boolean {
    return this.selectedStatuses.includes(status);
  }

  /** Check if a priority is currently selected */
  isPrioritySelected(priority: TaskPriority): boolean {
    return this.selectedPriorities.includes(priority);
  }

  /** Build and emit the current filter state */
  private emitFilters(): void {
    const filters: TaskFilters = {
      search: this.searchControl.value || '',
      status: this.selectedStatuses,
      priority: this.selectedPriorities,
      projectId: this.selectedProjectId,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
    };
    this.filtersChanged.emit(filters);
  }
}
