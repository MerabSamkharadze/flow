import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap } from 'rxjs/operators';

import { ProjectsService } from '../services/projects.service';
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
    private router: Router
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

  /** On successful creation, navigate to the project list */
  createProjectSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectsActions.createProjectSuccess),
        tap(() => this.router.navigate(['/projects']))
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
          (error) => ProjectsActions.removeMemberFailure({ error: error.message })
        )
      )
    )
  );
}
