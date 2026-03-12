/**
 * TaskFilters — filter/sort configuration for the My Tasks view.
 *
 * Used by TaskFiltersComponent to emit the current filter state
 * and by MyTasksComponent to filter the task list.
 */
export interface TaskFilters {
  search: string;
  status: string[];
  priority: string[];
  projectId: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

/** Default empty filter state */
export const EMPTY_TASK_FILTERS: TaskFilters = {
  search: '',
  status: [],
  priority: [],
  projectId: '',
  sortBy: 'deadline',
  sortDir: 'asc',
};
