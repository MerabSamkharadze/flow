import { createReducer, on } from '@ngrx/store';
import { Column } from '../../../shared/models/column.model';
import { Task } from '../../../shared/models/task.model';
import * as BoardActions from './board.actions';

/**
 * BoardState — shape of the 'board' feature state slice.
 *
 * columns:       array of board columns sorted by order
 * tasks:         dictionary mapping columnId → Task[] for fast column lookups
 * activeTaskId:  currently selected/editing task (for detail panel)
 * loading:       true while a Firestore operation is in progress
 * error:         error message from the last failed operation
 */
export interface BoardState {
  columns: Column[];
  tasks: { [columnId: string]: Task[] };
  activeTaskId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialBoardState: BoardState = {
  columns: [],
  tasks: {},
  activeTaskId: null,
  loading: false,
  error: null,
};

/**
 * Helper — groups a flat task array into a dictionary keyed by columnId.
 * Tasks within each column are sorted by their order field.
 */
function groupTasksByColumn(tasks: Task[]): { [columnId: string]: Task[] } {
  const grouped: { [columnId: string]: Task[] } = {};
  for (const task of tasks) {
    if (!grouped[task.columnId]) {
      grouped[task.columnId] = [];
    }
    grouped[task.columnId].push(task);
  }
  // Sort each column's tasks by order
  for (const columnId of Object.keys(grouped)) {
    grouped[columnId].sort((a, b) => a.order - b.order);
  }
  return grouped;
}

export const boardReducer = createReducer(
  initialBoardState,

  // ---------------------------------------------------------------------------
  // Load board (columns + tasks)
  // ---------------------------------------------------------------------------

  on(BoardActions.loadBoard, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BoardActions.loadBoardSuccess, (state, { columns, tasks }) => ({
    ...state,
    columns: [...columns].sort((a, b) => a.order - b.order),
    tasks: groupTasksByColumn(tasks),
    loading: false,
    error: null,
  })),

  on(BoardActions.loadBoardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Add column
  // ---------------------------------------------------------------------------

  on(BoardActions.addColumn, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BoardActions.addColumnSuccess, (state, { column }) => ({
    ...state,
    columns: [...state.columns, column].sort((a, b) => a.order - b.order),
    tasks: { ...state.tasks, [column.id]: [] },
    loading: false,
    error: null,
  })),

  on(BoardActions.addColumnFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Update column
  // ---------------------------------------------------------------------------

  on(BoardActions.updateColumn, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BoardActions.updateColumnSuccess, (state, { column }) => ({
    ...state,
    columns: state.columns
      .map((c) => (c.id === column.id ? column : c))
      .sort((a, b) => a.order - b.order),
    loading: false,
    error: null,
  })),

  on(BoardActions.updateColumnFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Delete column
  // ---------------------------------------------------------------------------

  on(BoardActions.deleteColumn, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BoardActions.deleteColumnSuccess, (state, { columnId }) => {
    const { [columnId]: _, ...remainingTasks } = state.tasks;
    return {
      ...state,
      columns: state.columns.filter((c) => c.id !== columnId),
      tasks: remainingTasks,
      loading: false,
      error: null,
    };
  }),

  on(BoardActions.deleteColumnFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Add task
  // ---------------------------------------------------------------------------

  on(BoardActions.addTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BoardActions.addTaskSuccess, (state, { task }) => {
    const columnTasks = [...(state.tasks[task.columnId] || []), task]
      .sort((a, b) => a.order - b.order);
    return {
      ...state,
      tasks: { ...state.tasks, [task.columnId]: columnTasks },
      loading: false,
      error: null,
    };
  }),

  on(BoardActions.addTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Update task
  // ---------------------------------------------------------------------------

  on(BoardActions.updateTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BoardActions.updateTaskSuccess, (state, { task }) => {
    const newTasks = { ...state.tasks };
    // Remove task from its previous column (in case columnId changed)
    for (const colId of Object.keys(newTasks)) {
      newTasks[colId] = newTasks[colId].filter((t) => t.id !== task.id);
    }
    // Add updated task to its (possibly new) column
    newTasks[task.columnId] = [...(newTasks[task.columnId] || []), task]
      .sort((a, b) => a.order - b.order);
    return {
      ...state,
      tasks: newTasks,
      loading: false,
      error: null,
    };
  }),

  on(BoardActions.updateTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Delete task
  // ---------------------------------------------------------------------------

  on(BoardActions.deleteTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BoardActions.deleteTaskSuccess, (state, { taskId, columnId }) => ({
    ...state,
    tasks: {
      ...state.tasks,
      [columnId]: (state.tasks[columnId] || []).filter((t) => t.id !== taskId),
    },
    loading: false,
    error: null,
    // Clear active task if it was the deleted one
    activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId,
  })),

  on(BoardActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Move task (drag & drop)
  // ---------------------------------------------------------------------------

  on(BoardActions.moveTask, (state, { taskId, fromColumnId, toColumnId, newOrder }) => {
    // Optimistic update — move the task immediately in the UI
    const task = (state.tasks[fromColumnId] || []).find((t) => t.id === taskId);
    if (!task) return state;

    const movedTask: Task = { ...task, columnId: toColumnId, order: newOrder };

    // Remove from source column
    const fromTasks = (state.tasks[fromColumnId] || []).filter((t) => t.id !== taskId);

    // Insert into target column at the correct position
    const toTasks = fromColumnId === toColumnId
      ? fromTasks // same column — already removed
      : [...(state.tasks[toColumnId] || [])];

    toTasks.push(movedTask);
    toTasks.sort((a, b) => a.order - b.order);

    return {
      ...state,
      tasks: {
        ...state.tasks,
        [fromColumnId]: fromTasks,
        [toColumnId]: toTasks,
      },
    };
  }),

  on(BoardActions.moveTaskFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Set active task
  // ---------------------------------------------------------------------------

  on(BoardActions.setActiveTask, (state, { taskId }) => ({
    ...state,
    activeTaskId: taskId,
  }))
);
