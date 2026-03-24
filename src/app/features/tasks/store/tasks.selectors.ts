import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState, tasksAdapter } from './tasks.reducer';
import { Task, TaskPriority, isTaskCompleted } from '../../../shared/models/task.model';

/**
 * Tasks Selectors — memoized selectors for reading tasks state.
 *
 * Includes filtered views, deadline-based grouping, and subtask selectors.
 */

// Feature selector — grabs the 'tasks' slice from the root state
export const selectTasksState = createFeatureSelector<TasksState>('tasks');

// Adapter-generated selectors
const { selectAll, selectEntities, selectTotal } = tasksAdapter.getSelectors();

/** All tasks as an array */
export const selectAllMyTasks = createSelector(selectTasksState, selectAll);

/** Tasks as a dictionary keyed by ID */
export const selectTaskEntities = createSelector(selectTasksState, selectEntities);

/** Total number of tasks */
export const selectTasksTotal = createSelector(selectTasksState, selectTotal);

/** Loading state */
export const selectTasksLoading = createSelector(
  selectTasksState,
  (state) => state.loading
);

/** Error state */
export const selectTasksError = createSelector(
  selectTasksState,
  (state) => state.error
);

/** Current filters */
export const selectTaskFilters = createSelector(
  selectTasksState,
  (state) => state.filters
);

/** User projects for filter dropdown */
export const selectUserProjects = createSelector(
  selectTasksState,
  (state) => state.projects
);

/** Project lookup map by ID */
export const selectProjectMap = createSelector(
  selectUserProjects,
  (projects) => {
    const map: { [id: string]: typeof projects[0] } = {};
    for (const p of projects) {
      map[p.id] = p;
    }
    return map;
  }
);

// ---------------------------------------------------------------------------
// Priority weight for sorting
// ---------------------------------------------------------------------------

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// ---------------------------------------------------------------------------
// Filtered tasks — applies active TaskFilters
// ---------------------------------------------------------------------------

/** All tasks with current filters applied */
export const selectFilteredTasks = createSelector(
  selectAllMyTasks,
  selectTaskFilters,
  (tasks, filters) => {
    let result = [...tasks];

    // Search filter
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(term));
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter((t) => filters.status.includes(t.status));
    }

    // Priority filter
    if (filters.priority.length > 0) {
      result = result.filter((t) => filters.priority.includes(t.priority));
    }

    // Project filter
    if (filters.projectId) {
      result = result.filter((t) => t.projectId === filters.projectId);
    }

    // Sort
    const dir = filters.sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return (new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) * dir;
        case 'priority':
          return (PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]) * dir;
        case 'createdAt':
          return (a.createdAt - b.createdAt) * dir;
        default:
          return 0;
      }
    });

    return result;
  }
);

// ---------------------------------------------------------------------------
// Tasks by status
// ---------------------------------------------------------------------------

/** Factory selector: tasks filtered by a specific status */
export const selectTasksByStatus = (status: string) =>
  createSelector(selectFilteredTasks, (tasks) =>
    tasks.filter((t) => t.status === status)
  );

// ---------------------------------------------------------------------------
// Deadline-based grouping selectors
// ---------------------------------------------------------------------------

/** Helper: get today's start and end timestamps */
function getTodayBounds(): { todayStart: number; todayEnd: number; weekEnd: number } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;
  return { todayStart, todayEnd, weekEnd };
}

/** Overdue tasks: deadline < today AND not done */
export const selectOverdueTasks = createSelector(selectFilteredTasks, (tasks) => {
  const { todayStart } = getTodayBounds();
  return tasks.filter(
    (t) => t.deadline && !isTaskCompleted(t) && new Date(t.deadline).getTime() < todayStart
  );
});

/** Today's tasks: deadline is today */
export const selectTodayTasks = createSelector(selectFilteredTasks, (tasks) => {
  const { todayStart, todayEnd } = getTodayBounds();
  return tasks.filter((t) => {
    if (!t.deadline) return false;
    const dl = new Date(t.deadline).getTime();
    return dl >= todayStart && dl < todayEnd;
  });
});

/** This week's tasks: deadline is between tomorrow and end of week */
export const selectThisWeekTasks = createSelector(selectFilteredTasks, (tasks) => {
  const { todayEnd, weekEnd } = getTodayBounds();
  return tasks.filter((t) => {
    if (!t.deadline) return false;
    const dl = new Date(t.deadline).getTime();
    return dl >= todayEnd && dl < weekEnd;
  });
});

/** Upcoming tasks: deadline is after this week */
export const selectUpcomingTasks = createSelector(selectFilteredTasks, (tasks) => {
  const { weekEnd } = getTodayBounds();
  return tasks.filter((t) => {
    if (!t.deadline) return false;
    return new Date(t.deadline).getTime() >= weekEnd;
  });
});

/** Tasks with no due date */
export const selectNoDueDateTasks = createSelector(selectFilteredTasks, (tasks) =>
  tasks.filter((t) => !t.deadline)
);

/** Unique status values from all tasks — for dynamic filter dropdowns */
export const selectUniqueStatuses = createSelector(selectAllMyTasks, (tasks): string[] => {
  const set = new Set<string>();
  for (const t of tasks) {
    if (t.status) set.add(t.status);
  }
  return Array.from(set).sort();
});

/** Count of active (non-done) tasks */
export const selectActiveTasksCount = createSelector(selectAllMyTasks, (tasks) =>
  tasks.filter((t) => !isTaskCompleted(t)).length
);

// ---------------------------------------------------------------------------
// Subtask selectors
// ---------------------------------------------------------------------------

/** All subtasks dictionary */
export const selectAllSubtasks = createSelector(
  selectTasksState,
  (state) => state.subtasks
);

/** Factory selector: subtasks for a specific task */
export const selectSubtasksByTask = (taskId: string) =>
  createSelector(selectAllSubtasks, (subtasks) => subtasks[taskId] || []);

/** Factory selector: completion percentage for a task's subtasks */
export const selectTaskCompletionPercent = (taskId: string) =>
  createSelector(selectSubtasksByTask(taskId), (subtasks) => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter((s) => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  });

// ---------------------------------------------------------------------------
// Comment selectors
// ---------------------------------------------------------------------------

/** All comments dictionary */
export const selectAllComments = createSelector(
  selectTasksState,
  (state) => state.comments
);

/** Factory selector: comments for a specific task */
export const selectCommentsByTask = (taskId: string) =>
  createSelector(selectAllComments, (comments) => comments[taskId] || []);

/** Factory selector: comment count for a specific task */
export const selectCommentCountByTask = (taskId: string) =>
  createSelector(selectCommentsByTask(taskId), (comments) => comments.length);

// ---------------------------------------------------------------------------
// Time entry selectors
// ---------------------------------------------------------------------------

/** All time entries dictionary */
export const selectAllTimeEntries = createSelector(
  selectTasksState,
  (state) => state.timeEntries
);

/** Factory selector: time entries for a specific task */
export const selectTimeEntriesByTask = (taskId: string) =>
  createSelector(selectAllTimeEntries, (entries) => entries[taskId] || []);

/** Factory selector: total logged hours for a specific task */
export const selectTotalLoggedByTask = (taskId: string) =>
  createSelector(selectTimeEntriesByTask(taskId), (entries) => {
    let totalMinutes = 0;
    for (const e of entries) {
      totalMinutes += e.hours * 60 + e.minutes;
    }
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  });

/** All comment counts as a dictionary keyed by task ID */
export const selectCommentCounts = createSelector(
  selectAllComments,
  (comments): { [taskId: string]: number } => {
    const counts: { [taskId: string]: number } = {};
    for (const [taskId, taskComments] of Object.entries(comments)) {
      counts[taskId] = taskComments.length;
    }
    return counts;
  }
);
