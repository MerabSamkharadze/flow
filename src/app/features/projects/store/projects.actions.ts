import { createAction, props } from '@ngrx/store';
import { Project } from '../../../shared/models/project.model';
import { Member, MemberRole } from '../../../shared/models/member.model';

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

// ---------------------------------------------------------------------------
// Members — add, remove, change role
// ---------------------------------------------------------------------------

export const addMember = createAction(
  '[Projects Page] Add Member',
  props<{ projectId: string; member: Member }>()
);

export const addMemberSuccess = createAction(
  '[Projects API] Add Member Success',
  props<{ projectId: string; member: Member }>()
);

export const addMemberFailure = createAction(
  '[Projects API] Add Member Failure',
  props<{ error: string }>()
);

export const removeMember = createAction(
  '[Projects Page] Remove Member',
  props<{ projectId: string; userId: string }>()
);

export const removeMemberSuccess = createAction(
  '[Projects API] Remove Member Success',
  props<{ projectId: string; userId: string }>()
);

export const removeMemberFailure = createAction(
  '[Projects API] Remove Member Failure',
  props<{ error: string }>()
);

export const updateMemberRole = createAction(
  '[Projects Page] Update Member Role',
  props<{ projectId: string; userId: string; newRole: MemberRole }>()
);

export const updateMemberRoleSuccess = createAction(
  '[Projects API] Update Member Role Success',
  props<{ projectId: string; userId: string; newRole: MemberRole }>()
);

export const updateMemberRoleFailure = createAction(
  '[Projects API] Update Member Role Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Project progress (task counts)
// ---------------------------------------------------------------------------

export const loadProjectsProgress = createAction(
  '[Projects Page] Load Projects Progress',
  props<{ projectIds: string[] }>()
);

export const setProjectProgress = createAction(
  '[Projects API] Set Project Progress',
  props<{ projectId: string; total: number; completed: number }>()
);
