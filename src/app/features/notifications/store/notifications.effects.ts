import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap } from 'rxjs/operators';

import { NotificationsService } from '../../../core/services/notifications.service';
import { ToastService } from '../../../core/services/toast.service';
import * as NotificationsActions from './notifications.actions';

/**
 * NotificationsEffects — side effects for the notifications feature.
 *
 * - loadNotifications$ uses switchMap for real-time Firestore stream
 * - Mutations (markAsRead, markAllAsRead) use exhaustMap to prevent duplicates
 */
@Injectable()
export class NotificationsEffects {
  constructor(
    private actions$: Actions,
    private notificationsService: NotificationsService,
    private toastService: ToastService
  ) {}

  // ---------------------------------------------------------------------------
  // Load notifications — real-time stream via switchMap
  // ---------------------------------------------------------------------------

  loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.loadNotifications),
      switchMap(({ userId }) =>
        this.notificationsService.getNotifications(userId).pipe(
          map((notifications) =>
            NotificationsActions.loadNotificationsSuccess({ notifications })
          ),
          catchError((error) =>
            of(NotificationsActions.loadNotificationsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Mark single notification as read
  // ---------------------------------------------------------------------------

  markAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markAsRead),
      exhaustMap(({ userId, notificationId }) =>
        this.notificationsService.markAsRead(userId, notificationId).then(
          () => NotificationsActions.markAsReadSuccess({ notificationId })
        ).catch(
          (error) => NotificationsActions.markAsReadFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Mark all notifications as read
  // ---------------------------------------------------------------------------

  markAllAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markAllAsRead),
      exhaustMap(({ userId }) =>
        this.notificationsService.markAllAsRead(userId).then(
          () => NotificationsActions.markAllAsReadSuccess()
        ).catch(
          (error) => NotificationsActions.markAllAsReadFailure({ error: error.message })
        )
      )
    )
  );

  /** Show toast when all notifications are marked as read */
  toastMarkAllAsRead$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(NotificationsActions.markAllAsReadSuccess),
        tap(() => this.toastService.show('All notifications marked as read.', 'success'))
      ),
    { dispatch: false }
  );
}
