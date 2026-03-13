import { createAction, props } from '@ngrx/store';
import { Column } from '@shared/models/column.model';
import { Task } from '@shared/models/task.model';
import { BoardFilters } from '../models/board-filters.model';

/**
 * Board Actions — all actions for the board state slice.
 *
 * Naming convention: [Source] Description
 *   [Board Page] — triggered from components
 *   [Board API]  — triggered from effects after Firestore responds
 */

// ---------------------------------------------------------------------------
// Load board (columns + tasks for a project)
// ---------------------------------------------------------------------------

export const loadBoard = createAction(
  '[Board Page] Load Board',
  props<{ projectId: string }>()
);

export const loadBoardSuccess = createAction(
  '[Board API] Load Board Success',
  props<{ columns: Column[]; tasks: Task[] }>()
);

export const loadBoardFailure = createAction(
  '[Board API] Load Board Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Columns — add, update, delete
// ---------------------------------------------------------------------------

export const addColumn = createAction(
  '[Board Page] Add Column',
  props<{ projectId: string; column: Omit<Column, 'id'> }>()
);

export const addColumnSuccess = createAction(
  '[Board API] Add Column Success',
  props<{ column: Column }>()
);

export const addColumnFailure = createAction(
  '[Board API] Add Column Failure',
  props<{ error: string }>()
);

export const updateColumn = createAction(
  '[Board Page] Update Column',
  props<{ projectId: string; columnId: string; changes: Partial<Column> }>()
);

export const updateColumnSuccess = createAction(
  '[Board API] Update Column Success',
  props<{ column: Column }>()
);

export const updateColumnFailure = createAction(
  '[Board API] Update Column Failure',
  props<{ error: string }>()
);

export const deleteColumn = createAction(
  '[Board Page] Delete Column',
  props<{ projectId: string; columnId: string }>()
);

export const deleteColumnSuccess = createAction(
  '[Board API] Delete Column Success',
  props<{ columnId: string }>()
);

export const deleteColumnFailure = createAction(
  '[Board API] Delete Column Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Tasks — add, update, delete
// ---------------------------------------------------------------------------

export const addTask = createAction(
  '[Board Page] Add Task',
  props<{ projectId: string; task: Omit<Task, 'id'> }>()
);

export const addTaskSuccess = createAction(
  '[Board API] Add Task Success',
  props<{ task: Task }>()
);

export const addTaskFailure = createAction(
  '[Board API] Add Task Failure',
  props<{ error: string }>()
);

export const updateTask = createAction(
  '[Board Page] Update Task',
  props<{ projectId: string; taskId: string; changes: Partial<Task> }>()
);

export const updateTaskSuccess = createAction(
  '[Board API] Update Task Success',
  props<{ task: Task }>()
);

export const updateTaskFailure = createAction(
  '[Board API] Update Task Failure',
  props<{ error: string }>()
);

export const deleteTask = createAction(
  '[Board Page] Delete Task',
  props<{ projectId: string; taskId: string; columnId: string }>()
);

export const deleteTaskSuccess = createAction(
  '[Board API] Delete Task Success',
  props<{ taskId: string; columnId: string }>()
);

export const deleteTaskFailure = createAction(
  '[Board API] Delete Task Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Move task (drag & drop) — changes column and/or order
// ---------------------------------------------------------------------------

export const moveTask = createAction(
  '[Board Page] Move Task',
  props<{
    projectId: string;
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newOrder: number;
  }>()
);

export const moveTaskSuccess = createAction(
  '[Board API] Move Task Success',
  props<{
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newOrder: number;
  }>()
);

export const moveTaskFailure = createAction(
  '[Board API] Move Task Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Set active task (for detail panel / editing)
// ---------------------------------------------------------------------------

export const setActiveTask = createAction(
  '[Board Page] Set Active Task',
  props<{ taskId: string | null }>()
);

// ---------------------------------------------------------------------------
// Set filters (search, priority, assignee)
// ---------------------------------------------------------------------------

export const setFilters = createAction(
  '[Board Page] Set Filters',
  props<{ filters: BoardFilters }>()
);
