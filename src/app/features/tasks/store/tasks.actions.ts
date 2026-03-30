import { createAction, props } from '@ngrx/store';
import { Task, TaskStatus } from '@shared/models/task.model';
import { Subtask } from '@shared/models/subtask.model';
import { Project } from '@shared/models/project.model';
import { Comment } from '@shared/models/comment.model';
import { TimeEntry } from '@shared/models/time-entry.model';
import { TaskFilters } from '../models/task-filters.model';

/**
 * Tasks Actions — all actions for the 'tasks' feature state slice.
 *
 * Naming convention:
 *   [My Tasks Page] — triggered from components
 *   [Tasks API]     — triggered from effects after Firestore responds
 */

// ---------------------------------------------------------------------------
// Load my tasks (all tasks assigned to the current user)
// ---------------------------------------------------------------------------

export const loadMyTasks = createAction(
  '[My Tasks Page] Load My Tasks',
  props<{ userId: string }>()
);

export const loadMyTasksSuccess = createAction(
  '[Tasks API] Load My Tasks Success',
  props<{ tasks: Task[] }>()
);

export const loadMyTasksFailure = createAction(
  '[Tasks API] Load My Tasks Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Load user projects (for filter dropdown and project name lookup)
// ---------------------------------------------------------------------------

export const loadUserProjects = createAction(
  '[My Tasks Page] Load User Projects',
  props<{ userId: string }>()
);

export const loadUserProjectsSuccess = createAction(
  '[Tasks API] Load User Projects Success',
  props<{ projects: Project[] }>()
);

// ---------------------------------------------------------------------------
// Update task status (e.g. "Mark as Done")
// ---------------------------------------------------------------------------

export const updateTaskStatus = createAction(
  '[My Tasks Page] Update Task Status',
  props<{ projectId: string; taskId: string; status: TaskStatus }>()
);

export const updateTaskStatusSuccess = createAction(
  '[Tasks API] Update Task Status Success',
  props<{ taskId: string; status: TaskStatus }>()
);

export const updateTaskStatusFailure = createAction(
  '[Tasks API] Update Task Status Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Load subtasks for a specific task
// ---------------------------------------------------------------------------

export const loadSubtasks = createAction(
  '[My Tasks Page] Load Subtasks',
  props<{ projectId: string; taskId: string }>()
);

export const loadSubtasksSuccess = createAction(
  '[Tasks API] Load Subtasks Success',
  props<{ taskId: string; subtasks: Subtask[] }>()
);

export const loadSubtasksFailure = createAction(
  '[Tasks API] Load Subtasks Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Add a new subtask
// ---------------------------------------------------------------------------

export const addSubtask = createAction(
  '[My Tasks Page] Add Subtask',
  props<{ projectId: string; taskId: string; title: string }>()
);

export const addSubtaskSuccess = createAction(
  '[Tasks API] Add Subtask Success',
  props<{ taskId: string; subtask: Subtask }>()
);

export const addSubtaskFailure = createAction(
  '[Tasks API] Add Subtask Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Toggle subtask completed state
// ---------------------------------------------------------------------------

export const toggleSubtask = createAction(
  '[My Tasks Page] Toggle Subtask',
  props<{ projectId: string; taskId: string; subtaskId: string; completed: boolean }>()
);

export const toggleSubtaskSuccess = createAction(
  '[Tasks API] Toggle Subtask Success',
  props<{ taskId: string; subtaskId: string; completed: boolean; completedAt: number | null }>()
);

export const toggleSubtaskFailure = createAction(
  '[Tasks API] Toggle Subtask Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Delete a subtask
// ---------------------------------------------------------------------------

export const deleteSubtask = createAction(
  '[My Tasks Page] Delete Subtask',
  props<{ projectId: string; taskId: string; subtaskId: string }>()
);

export const deleteSubtaskSuccess = createAction(
  '[Tasks API] Delete Subtask Success',
  props<{ taskId: string; subtaskId: string }>()
);

// ---------------------------------------------------------------------------
// Set task filters
// ---------------------------------------------------------------------------

export const setTaskFilters = createAction(
  '[My Tasks Page] Set Task Filters',
  props<{ filters: TaskFilters }>()
);

// ---------------------------------------------------------------------------
// Load comments for a specific task
// ---------------------------------------------------------------------------

export const loadComments = createAction(
  '[Task Detail] Load Comments',
  props<{ projectId: string; taskId: string }>()
);

export const loadCommentsSuccess = createAction(
  '[Tasks API] Load Comments Success',
  props<{ taskId: string; comments: Comment[] }>()
);

export const loadCommentsFailure = createAction(
  '[Tasks API] Load Comments Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Add a comment
// ---------------------------------------------------------------------------

export const addComment = createAction(
  '[Task Detail] Add Comment',
  props<{
    projectId: string;
    taskId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
  }>()
);

export const addCommentSuccess = createAction(
  '[Tasks API] Add Comment Success',
  props<{ projectId: string; taskId: string; comment: Comment }>()
);

export const addCommentFailure = createAction(
  '[Tasks API] Add Comment Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Edit a comment
// ---------------------------------------------------------------------------

export const editComment = createAction(
  '[Task Detail] Edit Comment',
  props<{ projectId: string; taskId: string; commentId: string; content: string }>()
);

export const editCommentSuccess = createAction(
  '[Tasks API] Edit Comment Success',
  props<{ taskId: string; commentId: string; content: string; updatedAt: number }>()
);

export const editCommentFailure = createAction(
  '[Tasks API] Edit Comment Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Delete a comment
// ---------------------------------------------------------------------------

export const deleteComment = createAction(
  '[Task Detail] Delete Comment',
  props<{ projectId: string; taskId: string; commentId: string }>()
);

export const deleteCommentSuccess = createAction(
  '[Tasks API] Delete Comment Success',
  props<{ taskId: string; commentId: string }>()
);

export const deleteCommentFailure = createAction(
  '[Tasks API] Delete Comment Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Load time entries for a specific task
// ---------------------------------------------------------------------------

export const loadTimeEntries = createAction(
  '[Task Detail] Load Time Entries',
  props<{ projectId: string; taskId: string }>()
);

export const loadTimeEntriesSuccess = createAction(
  '[Tasks API] Load Time Entries Success',
  props<{ taskId: string; entries: TimeEntry[] }>()
);

export const loadTimeEntriesFailure = createAction(
  '[Tasks API] Load Time Entries Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Log time
// ---------------------------------------------------------------------------

export const logTime = createAction(
  '[Task Detail] Log Time',
  props<{ projectId: string; taskId: string; entry: Omit<TimeEntry, 'id'> }>()
);

export const logTimeSuccess = createAction(
  '[Tasks API] Log Time Success',
  props<{ taskId: string; entry: TimeEntry }>()
);

export const logTimeFailure = createAction(
  '[Tasks API] Log Time Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Delete time entry
// ---------------------------------------------------------------------------

export const deleteTimeEntry = createAction(
  '[Task Detail] Delete Time Entry',
  props<{ projectId: string; taskId: string; entryId: string }>()
);

export const deleteTimeEntrySuccess = createAction(
  '[Tasks API] Delete Time Entry Success',
  props<{ taskId: string; entryId: string }>()
);

export const deleteTimeEntryFailure = createAction(
  '[Tasks API] Delete Time Entry Failure',
  props<{ error: string }>()
);
