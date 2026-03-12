import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, take } from 'rxjs/operators';

import { BoardService } from '../services/board.service';
import * as BoardActions from './board.actions';

/**
 * BoardEffects — side effects for board actions.
 *
 * - loadBoard$ uses forkJoin to load columns AND tasks in parallel
 * - Mutations use exhaustMap to prevent duplicate requests
 * - Read operations use switchMap to cancel stale requests
 */
@Injectable()
export class BoardEffects {
  constructor(
    private actions$: Actions,
    private boardService: BoardService
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

  /** Updates an existing column in Firestore */
  updateColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.updateColumn),
      exhaustMap(({ projectId, columnId, changes }) =>
        this.boardService.updateColumn(projectId, columnId, changes).then(
          () =>
            BoardActions.updateColumnSuccess({
              column: { id: columnId, projectId, ...changes } as any,
            }),
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

  /** Updates an existing task in Firestore */
  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.updateTask),
      exhaustMap(({ projectId, taskId, changes }) =>
        this.boardService.updateTask(projectId, taskId, changes).then(
          () =>
            BoardActions.updateTaskSuccess({
              task: { id: taskId, projectId, ...changes } as any,
            }),
          (error) => BoardActions.updateTaskFailure({ error: error.message })
        )
      )
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
  // Move task (drag & drop)
  // ---------------------------------------------------------------------------

  /** Batch-updates task position in Firestore after drag & drop */
  moveTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.moveTask),
      exhaustMap(({ projectId, taskId, fromColumnId, toColumnId, newOrder }) =>
        this.boardService.moveTask(projectId, taskId, toColumnId, newOrder).then(
          () =>
            BoardActions.moveTaskSuccess({
              taskId,
              fromColumnId,
              toColumnId,
              newOrder,
            }),
          (error) => BoardActions.moveTaskFailure({ error: error.message })
        )
      )
    )
  );
}
