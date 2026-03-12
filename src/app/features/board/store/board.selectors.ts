import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BoardState } from './board.reducer';
import { Task } from '../../../shared/models/task.model';

/**
 * Board Selectors — memoized selectors for reading board state.
 *
 * The board state uses a column-grouped task dictionary
 * for efficient per-column rendering, with selectors for
 * both grouped and flat access patterns.
 */

// Feature selector — grabs the 'board' slice from the root state
export const selectBoardState = createFeatureSelector<BoardState>('board');

/** All columns sorted by order */
export const selectColumns = createSelector(
  selectBoardState,
  (state) => state.columns
);

/** Tasks dictionary keyed by columnId */
export const selectTasksMap = createSelector(
  selectBoardState,
  (state) => state.tasks
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
  (state) => state.activeTaskId
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

/** Whether a board operation is in progress */
export const selectBoardLoading = createSelector(
  selectBoardState,
  (state) => state.loading
);

/** The last board error message (or null) */
export const selectBoardError = createSelector(
  selectBoardState,
  (state) => state.error
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
