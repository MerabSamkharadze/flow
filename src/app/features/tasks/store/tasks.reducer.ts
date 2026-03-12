import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Task } from '../../../shared/models/task.model';
import { Subtask } from '../../../shared/models/subtask.model';
import { Project } from '../../../shared/models/project.model';
import { TaskFilters, EMPTY_TASK_FILTERS } from '../models/task-filters.model';
import * as TasksActions from './tasks.actions';

/**
 * TasksState — shape of the 'tasks' feature state slice.
 *
 * Uses NgRx Entity for the tasks collection.
 * Subtasks are stored in a dictionary keyed by taskId.
 * Projects are stored for filter dropdown and project name lookup.
 */
export interface TasksState extends EntityState<Task> {
  subtasks: { [taskId: string]: Subtask[] };
  projects: Project[];
  filters: TaskFilters;
  loading: boolean;
  error: string | null;
}

/**
 * Entity adapter — provides CRUD helpers for the task entity collection.
 * Sorted by updatedAt descending so recently changed tasks appear first.
 */
export const tasksAdapter: EntityAdapter<Task> = createEntityAdapter<Task>({
  selectId: (task) => task.id,
  sortComparer: (a, b) => b.updatedAt - a.updatedAt,
});

export const initialTasksState: TasksState = tasksAdapter.getInitialState({
  subtasks: {},
  projects: [],
  filters: { ...EMPTY_TASK_FILTERS },
  loading: false,
  error: null,
});

export const tasksReducer = createReducer(
  initialTasksState,

  // ---------------------------------------------------------------------------
  // Load my tasks
  // ---------------------------------------------------------------------------

  on(TasksActions.loadMyTasks, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TasksActions.loadMyTasksSuccess, (state, { tasks }) =>
    tasksAdapter.setAll(tasks, {
      ...state,
      loading: false,
      error: null,
    })
  ),

  on(TasksActions.loadMyTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Load user projects
  // ---------------------------------------------------------------------------

  on(TasksActions.loadUserProjectsSuccess, (state, { projects }) => ({
    ...state,
    projects,
  })),

  // ---------------------------------------------------------------------------
  // Update task status
  // ---------------------------------------------------------------------------

  on(TasksActions.updateTaskStatusSuccess, (state, { taskId, status }) =>
    tasksAdapter.updateOne(
      { id: taskId, changes: { status, updatedAt: Date.now() } },
      state
    )
  ),

  on(TasksActions.updateTaskStatusFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Load subtasks
  // ---------------------------------------------------------------------------

  on(TasksActions.loadSubtasksSuccess, (state, { taskId, subtasks }) => ({
    ...state,
    subtasks: { ...state.subtasks, [taskId]: subtasks },
  })),

  on(TasksActions.loadSubtasksFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Add subtask
  // ---------------------------------------------------------------------------

  on(TasksActions.addSubtaskSuccess, (state, { taskId, subtask }) => ({
    ...state,
    subtasks: {
      ...state.subtasks,
      [taskId]: [...(state.subtasks[taskId] || []), subtask],
    },
  })),

  on(TasksActions.addSubtaskFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Toggle subtask
  // ---------------------------------------------------------------------------

  on(TasksActions.toggleSubtaskSuccess, (state, { taskId, subtaskId, completed, completedAt }) => ({
    ...state,
    subtasks: {
      ...state.subtasks,
      [taskId]: (state.subtasks[taskId] || []).map((s) =>
        s.id === subtaskId ? { ...s, completed, completedAt } : s
      ),
    },
  })),

  on(TasksActions.toggleSubtaskFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Delete subtask
  // ---------------------------------------------------------------------------

  on(TasksActions.deleteSubtaskSuccess, (state, { taskId, subtaskId }) => ({
    ...state,
    subtasks: {
      ...state.subtasks,
      [taskId]: (state.subtasks[taskId] || []).filter((s) => s.id !== subtaskId),
    },
  })),

  // ---------------------------------------------------------------------------
  // Set filters
  // ---------------------------------------------------------------------------

  on(TasksActions.setTaskFilters, (state, { filters }) => ({
    ...state,
    filters,
  }))
);
