import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { ProjectsService } from '../services/projects.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { ToastService } from '../../../core/services/toast.service';
import { selectUser } from '../../auth/store';
import * as ProjectsActions from './projects.actions';

/**
 * ProjectsEffects — side effects for project CRUD actions.
 *
 * Each effect listens for a specific action, calls ProjectsService,
 * and dispatches a success or failure action with the result.
 *
 * - loadProjects$ uses switchMap: cancels previous load if a new one fires
 * - create/update/delete use exhaustMap: ignores new requests while one is in progress
 */
@Injectable()
export class ProjectsEffects {
  constructor(
    private actions$: Actions,
    private projectsService: ProjectsService,
    private notificationsService: NotificationsService,
    private toastService: ToastService,
    private router: Router,
    private store: Store
  ) {}

  // ---------------------------------------------------------------------------
  // Load all projects
  // ---------------------------------------------------------------------------

  /** Subscribes to the Firestore projects collection (real-time updates) */
  loadProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.loadProjects),
      switchMap(() =>
        this.projectsService.getProjects().pipe(
          map((projects) => ProjectsActions.loadProjectsSuccess({ projects })),
          catchError((error) =>
            of(ProjectsActions.loadProjectsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Load single project
  // ---------------------------------------------------------------------------

  /** Subscribes to a single Firestore project document (real-time updates) */
  loadProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.loadProject),
      switchMap(({ projectId }) =>
        this.projectsService.getProject(projectId).pipe(
          map((project) => ProjectsActions.loadProjectSuccess({ project })),
          catchError((error) =>
            of(ProjectsActions.loadProjectFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Create project
  // ---------------------------------------------------------------------------

  /** Calls Firestore add(), then dispatches success with the new project */
  createProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.createProject),
      exhaustMap(({ project }) =>
        this.projectsService.createProject(project).then(
          (created) => ProjectsActions.createProjectSuccess({ project: created }),
          (error) => ProjectsActions.createProjectFailure({ error: error.message })
        )
      )
    )
  );

  /** On successful creation, show toast and navigate to the project list */
  createProjectSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectsActions.createProjectSuccess),
        tap(({ project }) => {
          this.toastService.show(`Project "${project.name}" created!`, 'success');
          this.router.navigate(['/projects']);
        })
      ),
    { dispatch: false }
  );

  /** Show toast on create project failure */
  createProjectFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectsActions.createProjectFailure),
        tap(({ error }) => this.toastService.show(error || 'Failed to create project.', 'error', 5000))
      ),
    { dispatch: false }
  );

  // ---------------------------------------------------------------------------
  // Update project
  // ---------------------------------------------------------------------------

  /** Calls Firestore update(), then dispatches success */
  updateProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.updateProject),
      exhaustMap(({ projectId, changes }) =>
        this.projectsService.updateProject(projectId, changes).then(
          () =>
            ProjectsActions.updateProjectSuccess({
              project: { id: projectId, ...changes } as any,
            }),
          (error) =>
            ProjectsActions.updateProjectFailure({ error: error.message })
        )
      )
    )
  );

  // ---------------------------------------------------------------------------
  // Delete project
  // ---------------------------------------------------------------------------

  /** Calls Firestore delete(), then dispatches success */
  deleteProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.deleteProject),
      exhaustMap(({ projectId }) =>
        this.projectsService.deleteProject(projectId).then(
          () => ProjectsActions.deleteProjectSuccess({ projectId }),
          (error) =>
            ProjectsActions.deleteProjectFailure({ error: error.message })
        )
      )
    )
  );

  /** On successful deletion, navigate back to the project list */
  deleteProjectSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectsActions.deleteProjectSuccess),
        tap(() => this.router.navigate(['/projects']))
      ),
    { dispatch: false }
  );

  // ---------------------------------------------------------------------------
  // Members
  // ---------------------------------------------------------------------------

  /** Adds a member document to Firestore + updates project memberIds array */
  addMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.addMember),
      exhaustMap(({ projectId, member }) =>
        this.projectsService.addMember(projectId, member).then(
          () => ProjectsActions.addMemberSuccess({ projectId, member }),
          (error) => ProjectsActions.addMemberFailure({ error: error.message })
        )
      )
    )
  );

  /** Show toast when a member is added */
  toastMemberAdded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectsActions.addMemberSuccess),
        tap(({ member }) => this.toastService.show(`${member.displayName || member.email} added to project.`, 'success'))
      ),
    { dispatch: false }
  );

  /** Notify the newly added member */
  notifyMemberAdded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectsActions.addMemberSuccess),
        withLatestFrom(this.store.select(selectUser)),
        tap(([{ projectId, member }, currentUser]) => {
          if (!currentUser || member.userId === currentUser.uid) return;
          this.notificationsService.createNotification(member.userId, {
            userId: member.userId,
            type: 'member_added',
            title: 'Added to project',
            body: `${currentUser.displayName || currentUser.email} added you to a project.`,
            link: `/projects/${projectId}`,
            read: false,
            createdAt: Date.now(),
            actorName: currentUser.displayName || currentUser.email || 'Someone',
            actorAvatar: currentUser.photoURL || null,
          });
        })
      ),
    { dispatch: false }
  );

  /** Removes a member document from Firestore + updates project memberIds array */
  removeMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.removeMember),
      exhaustMap(({ projectId, userId }) =>
        this.projectsService.removeMember(projectId, userId).then(
          () => ProjectsActions.removeMemberSuccess({ projectId, userId }),
          (error) => ProjectsActions.removeMemberFailure({ error: error.message })
        )
      )
    )
  );

  /** Updates a member's role in the Firestore subcollection */
  updateMemberRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.updateMemberRole),
      exhaustMap(({ projectId, userId, newRole }) =>
        this.projectsService.updateMemberRole(projectId, userId, newRole).then(
          () => ProjectsActions.updateMemberRoleSuccess({ projectId, userId, newRole }),
          (error) => ProjectsActions.updateMemberRoleFailure({ error: error.message })
        )
      )
    )
  );
}
