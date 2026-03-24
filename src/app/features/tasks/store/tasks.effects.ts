import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import { TasksService } from '../services/tasks.service';
import { CommentsService } from '../services/comments.service';
import { NotificationsService } from '@core/services/notifications.service';
import { ToastService } from '@core/services/toast.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { selectAllTasks } from '../../board/store/board.selectors';
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
    private notificationsService: NotificationsService,
    private projectsService: ProjectsService,
    private toastService: ToastService,
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

  /** Show toast on task status update success */
  toastUpdateTaskStatus$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TasksActions.updateTaskStatusSuccess),
        tap(({ status }) => this.toastService.show(`Task marked as ${status}.`, 'success'))
      ),
    { dispatch: false }
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

  /** Show toast when a comment is added */
  toastCommentAdded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TasksActions.addCommentSuccess),
        tap(() => this.toastService.show('Comment added.', 'success'))
      ),
    { dispatch: false }
  );

  /** Notify the task assignee when a new comment is added */
  notifyCommentAdded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TasksActions.addCommentSuccess),
        withLatestFrom(this.store.select(selectAllTasks)),
        tap(([{ taskId, comment }, allTasks]) => {
          const task = allTasks.find((t) => t.id === taskId);
          if (!task?.assigneeId || task.assigneeId === comment.authorId) return;
          this.notificationsService.createNotification(task.assigneeId, {
            userId: task.assigneeId,
            type: 'comment_added',
            title: 'New comment on your task',
            body: `${comment.authorName} commented on "${task.title}".`,
            link: `/projects/${task.projectId}`,
            read: false,
            createdAt: Date.now(),
            actorName: comment.authorName,
            actorAvatar: comment.authorAvatar,
          });
        })
      ),
    { dispatch: false }
  );

  /** Notify @mentioned users when a comment is added */
  notifyMentioned$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TasksActions.addCommentSuccess),
        withLatestFrom(this.store.select(selectAllTasks)),
        tap(([{ taskId, comment }, allTasks]) => {
          // Parse @mentions from comment text
          const mentions = comment.content.match(/@(\w+(?:\s\w+)?)/g);
          if (!mentions || mentions.length === 0) return;

          const task = allTasks.find((t) => t.id === taskId);
          if (!task) return;

          // Load project members to resolve names → userIds
          this.projectsService
            .getMembers(task.projectId)
            .pipe(take(1))
            .subscribe((members) => {
              const mentionedNames = mentions.map((m) => m.substring(1).toLowerCase());

              for (const member of members) {
                // Skip the comment author
                if (member.userId === comment.authorId) continue;

                const nameMatch = mentionedNames.some(
                  (name) => member.displayName.toLowerCase().includes(name)
                );
                if (!nameMatch) continue;

                this.notificationsService.createNotification(member.userId, {
                  userId: member.userId,
                  type: 'mention',
                  title: 'You were mentioned',
                  body: `${comment.authorName} mentioned you in a comment on "${task.title}".`,
                  link: `/projects/${task.projectId}`,
                  read: false,
                  createdAt: Date.now(),
                  actorName: comment.authorName,
                  actorAvatar: comment.authorAvatar,
                });
              }
            });
        })
      ),
    { dispatch: false }
  );

  // ---------------------------------------------------------------------------
  // Load time entries — real-time stream for a specific task
  // ---------------------------------------------------------------------------

  loadTimeEntries$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTimeEntries),
      switchMap(({ projectId, taskId }) =>
        this.tasksService.getTimeEntries(projectId, taskId).pipe(
          map((entries) => TasksActions.loadTimeEntriesSuccess({ taskId, entries })),
          catchError((error) =>
            of(TasksActions.loadTimeEntriesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Log time
  // ---------------------------------------------------------------------------

  logTime$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.logTime),
      exhaustMap(({ projectId, taskId, entry }) =>
        this.tasksService.logTime(projectId, taskId, entry).then(
          (created) => TasksActions.logTimeSuccess({ taskId, entry: created }),
          (error) => TasksActions.logTimeFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Delete time entry
  // ---------------------------------------------------------------------------

  deleteTimeEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTimeEntry),
      exhaustMap(({ projectId, taskId, entryId }) =>
        this.tasksService.deleteTimeEntry(projectId, taskId, entryId).then(
          () => TasksActions.deleteTimeEntrySuccess({ taskId, entryId }),
          (error) => TasksActions.deleteTimeEntryFailure({ error: error.message })
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
