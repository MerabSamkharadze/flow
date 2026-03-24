import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TaskPriority } from '../../../../shared/models/task.model';
import { Project } from '../../../../shared/models/project.model';
import { TaskFilters } from '../../models/task-filters.model';

@Component({
  standalone: false,
  selector: 'app-task-filters',
  templateUrl: './task-filters.component.html',
  styleUrls: ['./task-filters.component.scss'],
})
export class TaskFiltersComponent implements OnInit, OnDestroy {
  @Input() projects: Project[] = [];
  @Input() availableStatuses: string[] = [];
  @Output() filtersChanged = new EventEmitter<TaskFilters>();

  searchControl = new FormControl('');

  selectedStatuses: string[] = [];
  selectedPriorities: TaskPriority[] = [];
  selectedProjectId = '';
  sortBy = 'deadline';
  sortDir: 'asc' | 'desc' = 'asc';

  /** Dynamic statuses — populated from input or fallback defaults */
  get statuses(): string[] {
    return this.availableStatuses.length > 0
      ? this.availableStatuses
      : ['todo', 'in-progress', 'in-review', 'done'];
  }
  priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
  sortOptions = [
    { value: 'deadline', label: 'Deadline' },
    { value: 'priority', label: 'Priority' },
    { value: 'createdAt', label: 'Created' },
  ];

  /** Which dropdown is currently open */
  openDropdown: 'status' | 'priority' | null = null;

  private destroy$ = new Subject<void>();

  constructor(private elRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.openDropdown = null;
    }
  }

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.emitFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(name: 'status' | 'priority'): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  toggleStatus(status: string): void {
    const idx = this.selectedStatuses.indexOf(status);
    if (idx >= 0) {
      this.selectedStatuses = this.selectedStatuses.filter((s) => s !== status);
    } else {
      this.selectedStatuses = [...this.selectedStatuses, status];
    }
    this.emitFilters();
  }

  togglePriority(priority: TaskPriority): void {
    const idx = this.selectedPriorities.indexOf(priority);
    if (idx >= 0) {
      this.selectedPriorities = this.selectedPriorities.filter((p) => p !== priority);
    } else {
      this.selectedPriorities = [...this.selectedPriorities, priority];
    }
    this.emitFilters();
  }

  onProjectChange(projectId: string): void {
    this.selectedProjectId = projectId;
    this.emitFilters();
  }

  onSortByChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.emitFilters();
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.emitFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      (this.searchControl.value || '') !== '' ||
      this.selectedStatuses.length > 0 ||
      this.selectedPriorities.length > 0 ||
      this.selectedProjectId !== ''
    );
  }

  get statusLabel(): string {
    if (this.selectedStatuses.length === 0) return 'All';
    if (this.selectedStatuses.length === 1) return this.selectedStatuses[0];
    return `${this.selectedStatuses.length} selected`;
  }

  get priorityLabel(): string {
    if (this.selectedPriorities.length === 0) return 'All';
    if (this.selectedPriorities.length === 1) return this.selectedPriorities[0];
    return `${this.selectedPriorities.length} selected`;
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedStatuses = [];
    this.selectedPriorities = [];
    this.selectedProjectId = '';
    this.sortBy = 'deadline';
    this.sortDir = 'asc';
    this.openDropdown = null;
    this.emitFilters();
  }

  isStatusSelected(status: string): boolean {
    return this.selectedStatuses.includes(status);
  }

  isPrioritySelected(priority: TaskPriority): boolean {
    return this.selectedPriorities.includes(priority);
  }

  trackByValue(_index: number, item: string): string {
    return item;
  }

  trackByProjectId(_index: number, project: Project): string {
    return project.id;
  }

  trackBySortValue(_index: number, opt: { value: string }): string {
    return opt.value;
  }

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
