import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';

import { TasksService } from '../services/tasks.service';
import { CommentsService } from '../services/comments.service';
import * as TasksActions from './tasks.actions';

/**
 * TasksEffects — side effects for the tasks feature.
 *
 * - loadMyTasks$ uses switchMap for real-time Firestore streams
 * - Mutations use exhaustMap to prevent duplicate requests
 * - loadSubtasks$ uses switchMap for real-time subtask streams
 */
@Injectable()
export class TasksEffects {
  constructor(
    private actions$: Actions,
    private tasksService: TasksService,
    private commentsService: CommentsService,
    private store: Store
  ) {}

  // ---------------------------------------------------------------------------
  // Load my tasks — real-time stream of all tasks assigned to user
  // ---------------------------------------------------------------------------

  loadMyTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadMyTasks),
      switchMap(({ userId }) =>
        this.tasksService.getMyTasks(userId).pipe(
          map((tasks) => TasksActions.loadMyTasksSuccess({ tasks })),
          catchError((error) =>
            of(TasksActions.loadMyTasksFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Load user projects — for filter dropdown and project name lookup
  // ---------------------------------------------------------------------------

  loadUserProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadUserProjects),
      switchMap(({ userId }) =>
        this.tasksService.getUserProjects(userId).pipe(
          map((projects) => TasksActions.loadUserProjectsSuccess({ projects })),
          catchError(() => of()) // Silently fail — projects are non-critical
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Update task status (e.g. "Mark as Done")
  // ---------------------------------------------------------------------------

  updateTaskStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTaskStatus),
      exhaustMap(({ projectId, taskId, status }) =>
        this.tasksService.updateTaskStatus(projectId, taskId, status).then(
          () => TasksActions.updateTaskStatusSuccess({ taskId, status }),
          (error) => TasksActions.updateTaskStatusFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Load subtasks — real-time stream for a specific task
  // ---------------------------------------------------------------------------

  loadSubtasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadSubtasks),
      switchMap(({ projectId, taskId }) =>
        this.tasksService.getSubtasks(projectId, taskId).pipe(
          map((subtasks) => TasksActions.loadSubtasksSuccess({ taskId, subtasks })),
          catchError((error) =>
            of(TasksActions.loadSubtasksFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Add subtask
  // ---------------------------------------------------------------------------

  addSubtask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.addSubtask),
      exhaustMap(({ projectId, taskId, title }) =>
        this.tasksService.addSubtask(projectId, taskId, title).then(
          (subtask) => TasksActions.addSubtaskSuccess({ taskId, subtask }),
          (error) => TasksActions.addSubtaskFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Toggle subtask completed state
  // ---------------------------------------------------------------------------

  toggleSubtask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.toggleSubtask),
      exhaustMap(({ projectId, taskId, subtaskId, completed }) =>
        this.tasksService.toggleSubtask(projectId, taskId, subtaskId, completed).then(
          () =>
            TasksActions.toggleSubtaskSuccess({
              taskId,
              subtaskId,
              completed,
              completedAt: completed ? Date.now() : null,
            }),
          (error) => TasksActions.toggleSubtaskFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Delete subtask
  // ---------------------------------------------------------------------------

  deleteSubtask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteSubtask),
      exhaustMap(({ projectId, taskId, subtaskId }) =>
        this.tasksService.deleteSubtask(projectId, taskId, subtaskId).then(
          () => TasksActions.deleteSubtaskSuccess({ taskId, subtaskId }),
          (error) => TasksActions.addSubtaskFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Load comments — real-time stream for a specific task
  // ---------------------------------------------------------------------------

  loadComments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadComments),
      switchMap(({ projectId, taskId }) =>
        this.commentsService.getComments(projectId, taskId).pipe(
          map((comments) => TasksActions.loadCommentsSuccess({ taskId, comments })),
          catchError((error) =>
            of(TasksActions.loadCommentsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Add comment
  // ---------------------------------------------------------------------------

  addComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.addComment),
      exhaustMap(({ projectId, taskId, authorId, authorName, authorAvatar, content }) =>
        this.commentsService.addComment(projectId, taskId, authorId, authorName, authorAvatar, content).then(
          (comment) => TasksActions.addCommentSuccess({ taskId, comment }),
          (error) => TasksActions.addCommentFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Edit comment
  // ---------------------------------------------------------------------------

  editComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.editComment),
      exhaustMap(({ projectId, taskId, commentId, content }) =>
        this.commentsService.editComment(projectId, taskId, commentId, content).then(
          () =>
            TasksActions.editCommentSuccess({
              taskId,
              commentId,
              content,
              updatedAt: Date.now(),
            }),
          (error) => TasksActions.editCommentFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Delete comment
  // ---------------------------------------------------------------------------

  deleteComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteComment),
      exhaustMap(({ projectId, taskId, commentId }) =>
        this.commentsService.deleteComment(projectId, taskId, commentId).then(
          () => TasksActions.deleteCommentSuccess({ taskId, commentId }),
          (error) => TasksActions.deleteCommentFailure({ error: error.message })
        )
      )
    )
  );
}
