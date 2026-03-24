import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { forkJoin, of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import { BoardService } from '../services/board.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { Column } from '../../../shared/models/column.model';
import { Task, isTaskCompleted } from '../../../shared/models/task.model';
import { selectUser } from '../../auth/store';
import * as BoardActions from './board.actions';
import { selectTasksMap, selectColumns } from './board.selectors';

/**
 * BoardEffects — side effects for board actions.
 *
 * - loadBoard$ uses forkJoin to load columns AND tasks in parallel
 * - Mutations use exhaustMap to prevent duplicate requests
 * - moveTask$ reads the optimistically-updated state to batch-write all affected orders
 */
@Injectable()
export class BoardEffects {
  constructor(
    private actions$: Actions,
    private boardService: BoardService,
    private notificationsService: NotificationsService,
    private store: Store
  ) {}

  // ---------------------------------------------------------------------------
  // Load board — columns + tasks in parallel
  // ---------------------------------------------------------------------------

  /** Loads both columns and tasks for a project using forkJoin */
  loadBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.loadBoard),
      switchMap(({ projectId }) =>
        forkJoin({
          columns: this.boardService.getColumns(projectId).pipe(take(1)),
          tasks: this.boardService.getTasks(projectId).pipe(take(1)),
        }).pipe(
          map(({ columns, tasks }) =>
            BoardActions.loadBoardSuccess({ columns, tasks })
          ),
          catchError((error) =>
            of(BoardActions.loadBoardFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------

  /** Adds a new column document to Firestore */
  addColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.addColumn),
      exhaustMap(({ projectId, column }) =>
        this.boardService.addColumn(projectId, column).then(
          (created) => BoardActions.addColumnSuccess({ column: created }),
          (error) => BoardActions.addColumnFailure({ error: error.message })
        )
      )
    )
  );

  /** Updates an existing column in Firestore. If name changed, cascades to task statuses. */
  updateColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.updateColumn),
      exhaustMap(({ projectId, columnId, changes }) =>
        this.boardService.updateColumn(projectId, columnId, changes).then(
          async () => {
            // If column name changed, update all tasks in this column with new status
            if (changes.name) {
              await this.boardService.updateTasksStatus(projectId, columnId, changes.name);
            }
            return BoardActions.updateColumnSuccess({
              column: { id: columnId, projectId, ...changes } as Column,
            });
          },
          (error) => BoardActions.updateColumnFailure({ error: error.message })
        )
      )
    )
  );

  /** Deletes a column from Firestore */
  deleteColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.deleteColumn),
      exhaustMap(({ projectId, columnId }) =>
        this.boardService.deleteColumn(projectId, columnId).then(
          () => BoardActions.deleteColumnSuccess({ columnId }),
          (error) => BoardActions.deleteColumnFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  /** Adds a new task document to Firestore */
  addTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.addTask),
      exhaustMap(({ projectId, task }) =>
        this.boardService.addTask(projectId, task).then(
          (created) => BoardActions.addTaskSuccess({ task: created }),
          (error) => BoardActions.addTaskFailure({ error: error.message })
        )
      )
    )
  );

  /** Notify the assignee when a new task is created and assigned to them */
  notifyTaskAssigned$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.addTaskSuccess),
        withLatestFrom(this.store.select(selectUser)),
        tap(([{ task }, currentUser]) => {
          if (!task.assigneeId || !currentUser || task.assigneeId === currentUser.uid) return;
          this.notificationsService.createNotification(task.assigneeId, {
            userId: task.assigneeId,
            type: 'task_assigned',
            title: 'New task assigned',
            body: `${currentUser.displayName || currentUser.email} assigned you "${task.title}".`,
            link: `/projects/${task.projectId}`,
            read: false,
            createdAt: Date.now(),
            actorName: currentUser.displayName || currentUser.email || 'Someone',
            actorAvatar: currentUser.photoURL || null,
          });
        })
      ),
    { dispatch: false }
  );

  /** Updates an existing task in Firestore. Auto-sets completedAt when status becomes 'done'. */
  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.updateTask),
      exhaustMap(({ projectId, taskId, changes }) => {
        // Auto-set completedAt when task is marked as completed
        const enriched = { ...changes };
        if (enriched.status && isTaskCompleted({ status: enriched.status }) && !enriched.completedAt) {
          enriched.completedAt = Date.now();
        } else if (enriched.status && !isTaskCompleted({ status: enriched.status })) {
          enriched.completedAt = null;
        }

        return this.boardService.updateTask(projectId, taskId, enriched).then(
          () =>
            BoardActions.updateTaskSuccess({
              task: { id: taskId, projectId, ...enriched } as Task,
            }),
          (error) => BoardActions.updateTaskFailure({ error: error.message })
        );
      })
    )
  );

  /** Deletes a task from Firestore */
  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.deleteTask),
      exhaustMap(({ projectId, taskId, columnId }) =>
        this.boardService.deleteTask(projectId, taskId).then(
          () => BoardActions.deleteTaskSuccess({ taskId, columnId }),
          (error) => BoardActions.deleteTaskFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Move task (drag & drop) — batch update with optimistic state
  // ---------------------------------------------------------------------------

  /**
   * After the reducer has optimistically updated the local state,
   * this effect reads the new task order from the store and
   * batch-writes all affected task orders to Firestore.
   */
  moveTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.moveTask),
      withLatestFrom(this.store.select(selectTasksMap), this.store.select(selectColumns)),
      exhaustMap(([{ projectId, taskId, fromColumnId, toColumnId, newOrder }, tasksMap, columns]) => {
        // Resolve destination column name for status update
        const destColumn = columns.find((c) => c.id === toColumnId);
        const newStatus = destColumn ? destColumn.name : undefined;

        // Collect all tasks in both affected columns (after optimistic update)
        const affectedTasks: { id: string; order: number; columnId: string }[] = [];

        // Add tasks from target column
        const toTasks = tasksMap[toColumnId] || [];
        for (const t of toTasks) {
          affectedTasks.push({ id: t.id, order: t.order, columnId: t.columnId });
        }

        // Add tasks from source column (if cross-column move)
        if (fromColumnId !== toColumnId) {
          const fromTasks = tasksMap[fromColumnId] || [];
          for (const t of fromTasks) {
            affectedTasks.push({ id: t.id, order: t.order, columnId: t.columnId });
          }
        }

        return this.boardService
          .moveTask(projectId, taskId, toColumnId, newOrder, affectedTasks, newStatus)
          .then(
            () =>
              BoardActions.moveTaskSuccess({
                taskId,
                fromColumnId,
                toColumnId,
                newOrder,
              }),
            (error) => BoardActions.moveTaskFailure({ error: error.message })
          );
      })
    )
  );
}
