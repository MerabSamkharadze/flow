import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BoardState } from './board.reducer';
import { Task } from '../../../shared/models/task.model';
import { BoardFilters } from '../models/board-filters.model';

/**
 * Board Selectors — memoized selectors for reading board state.
 *
 * Includes selectors for filtered tasks that reactively update
 * when either the task data or filters change.
 */

// Feature selector — grabs the 'board' slice from the root state
export const selectBoardState = createFeatureSelector<BoardState>('board');

/** All columns sorted by order */
export const selectColumns = createSelector(
  selectBoardState,
  (state) => state?.columns ?? []
);

/** Tasks dictionary keyed by columnId */
export const selectTasksMap = createSelector(
  selectBoardState,
  (state) => state?.tasks ?? {}
);

/** Tasks for a specific column (factory selector) */
export const selectTasksByColumn = (columnId: string) =>
  createSelector(
    selectTasksMap,
    (tasks) => tasks[columnId] || []
  );

/** The currently active/selected task ID */
export const selectActiveTaskId = createSelector(
  selectBoardState,
  (state) => state?.activeTaskId ?? null
);

/** The currently active task object (searches all columns) */
export const selectActiveTask = createSelector(
  selectTasksMap,
  selectActiveTaskId,
  (tasksMap, activeId): Task | null => {
    if (!activeId) return null;
    for (const columnTasks of Object.values(tasksMap)) {
      const found = columnTasks.find((t) => t.id === activeId);
      if (found) return found;
    }
    return null;
  }
);

/** Current board filters */
export const selectBoardFilters = createSelector(
  selectBoardState,
  (state) => state?.filters ?? { search: '', priority: [], assigneeId: '' }
);

/** Whether a board operation is in progress */
export const selectBoardLoading = createSelector(
  selectBoardState,
  (state) => state?.loading ?? false
);

/** The last board error message (or null) */
export const selectBoardError = createSelector(
  selectBoardState,
  (state) => state?.error ?? null
);

/** All tasks as a flat array (useful for search, counts, etc.) */
export const selectAllTasks = createSelector(
  selectTasksMap,
  (tasksMap): Task[] => {
    const all: Task[] = [];
    for (const columnTasks of Object.values(tasksMap)) {
      all.push(...columnTasks);
    }
    return all;
  }
);

// ---------------------------------------------------------------------------
// Filtered task selectors
// ---------------------------------------------------------------------------

/**
 * Helper — applies BoardFilters to a task array.
 * Returns only tasks matching ALL active filter criteria.
 */
function applyFilters(tasks: Task[], filters: BoardFilters): Task[] {
  return tasks.filter((task) => {
    // Search filter — match title (case-insensitive)
    if (filters.search) {
      const query = filters.search.toLowerCase();
      if (!task.title.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Priority filter — match any of the selected priorities
    if (filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) {
        return false;
      }
    }

    // Assignee filter — match assigneeId (case-insensitive partial match)
    if (filters.assigneeId) {
      if (!task.assigneeId) return false;
      if (!task.assigneeId.toLowerCase().includes(filters.assigneeId.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filtered tasks map — applies active filters to every column.
 * Re-computes only when tasks or filters change (memoized).
 */
export const selectFilteredTasksMap = createSelector(
  selectTasksMap,
  selectBoardFilters,
  (tasksMap, filters): { [columnId: string]: Task[] } => {
    const filtered: { [columnId: string]: Task[] } = {};
    for (const [columnId, tasks] of Object.entries(tasksMap)) {
      filtered[columnId] = applyFilters(tasks, filters);
    }
    return filtered;
  }
);

/** Filtered tasks for a specific column (factory selector) */
export const selectFilteredTasksByColumn = (columnId: string) =>
  createSelector(
    selectFilteredTasksMap,
    (filteredMap) => filteredMap[columnId] || []
  );

/** All filtered tasks as a flat array — used by the list view */
export const selectFilteredAllTasks = createSelector(
  selectFilteredTasksMap,
  (filteredMap): Task[] => {
    const all: Task[] = [];
    for (const columnTasks of Object.values(filteredMap)) {
      all.push(...columnTasks);
    }
    return all;
  }
);
