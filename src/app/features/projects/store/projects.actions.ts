import { createAction, props } from '@ngrx/store';
import { Project } from '../../../shared/models/project.model';

/**
 * Projects Actions — all actions for the projects state slice.
 *
 * Naming convention: [Source] Description
 *   [Projects Page] — triggered from components
 *   [Projects API]  — triggered from effects after Firestore responds
 */

// ---------------------------------------------------------------------------
// Load all projects
// ---------------------------------------------------------------------------

export const loadProjects = createAction('[Projects Page] Load Projects');

export const loadProjectsSuccess = createAction(
  '[Projects API] Load Projects Success',
  props<{ projects: Project[] }>()
);

export const loadProjectsFailure = createAction(
  '[Projects API] Load Projects Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Load single project by ID
// ---------------------------------------------------------------------------

export const loadProject = createAction(
  '[Projects Page] Load Project',
  props<{ projectId: string }>()
);

export const loadProjectSuccess = createAction(
  '[Projects API] Load Project Success',
  props<{ project: Project }>()
);

export const loadProjectFailure = createAction(
  '[Projects API] Load Project Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Create project
// ---------------------------------------------------------------------------

export const createProject = createAction(
  '[Projects Page] Create Project',
  props<{ project: Omit<Project, 'id'> }>()
);

export const createProjectSuccess = createAction(
  '[Projects API] Create Project Success',
  props<{ project: Project }>()
);

export const createProjectFailure = createAction(
  '[Projects API] Create Project Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Update project
// ---------------------------------------------------------------------------

export const updateProject = createAction(
  '[Projects Page] Update Project',
  props<{ projectId: string; changes: Partial<Project> }>()
);

export const updateProjectSuccess = createAction(
  '[Projects API] Update Project Success',
  props<{ project: Project }>()
);

export const updateProjectFailure = createAction(
  '[Projects API] Update Project Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Delete project
// ---------------------------------------------------------------------------

export const deleteProject = createAction(
  '[Projects Page] Delete Project',
  props<{ projectId: string }>()
);

export const deleteProjectSuccess = createAction(
  '[Projects API] Delete Project Success',
  props<{ projectId: string }>()
);

export const deleteProjectFailure = createAction(
  '[Projects API] Delete Project Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Set selected project (for detail view)
// ---------------------------------------------------------------------------

export const setSelectedProject = createAction(
  '[Projects Page] Set Selected Project',
  props<{ projectId: string | null }>()
);
