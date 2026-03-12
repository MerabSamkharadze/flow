import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Project } from '../../../shared/models/project.model';
import * as ProjectsActions from './projects.actions';

/**
 * ProjectsState — shape of the 'projects' feature state slice.
 *
 * Extends NgRx EntityState which provides:
 *   - ids: string[]           — ordered array of entity IDs
 *   - entities: Dictionary<Project> — lookup map of entities by ID
 *
 * Additional properties:
 *   - selectedProjectId: the currently viewed project
 *   - loading: true while a Firestore operation is in progress
 *   - error: error message from the last failed operation
 */
export interface ProjectsState extends EntityState<Project> {
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Entity adapter — provides helper methods for CRUD operations on
 * the entity collection (addOne, addMany, upsertOne, removeOne, etc.)
 * Sorted by updatedAt descending so newest changes appear first.
 */
export const projectsAdapter: EntityAdapter<Project> = createEntityAdapter<Project>({
  selectId: (project) => project.id,
  sortComparer: (a, b) => b.updatedAt - a.updatedAt,
});

export const initialProjectsState: ProjectsState = projectsAdapter.getInitialState({
  selectedProjectId: null,
  loading: false,
  error: null,
});

export const projectsReducer = createReducer(
  initialProjectsState,

  // ---------------------------------------------------------------------------
  // Load all projects
  // ---------------------------------------------------------------------------

  on(ProjectsActions.loadProjects, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ProjectsActions.loadProjectsSuccess, (state, { projects }) =>
    projectsAdapter.setAll(projects, {
      ...state,
      loading: false,
      error: null,
    })
  ),

  on(ProjectsActions.loadProjectsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Load single project
  // ---------------------------------------------------------------------------

  on(ProjectsActions.loadProject, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ProjectsActions.loadProjectSuccess, (state, { project }) =>
    projectsAdapter.upsertOne(project, {
      ...state,
      loading: false,
      error: null,
    })
  ),

  on(ProjectsActions.loadProjectFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Create project
  // ---------------------------------------------------------------------------

  on(ProjectsActions.createProject, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ProjectsActions.createProjectSuccess, (state, { project }) =>
    projectsAdapter.addOne(project, {
      ...state,
      loading: false,
      error: null,
    })
  ),

  on(ProjectsActions.createProjectFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Update project
  // ---------------------------------------------------------------------------

  on(ProjectsActions.updateProject, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ProjectsActions.updateProjectSuccess, (state, { project }) =>
    projectsAdapter.upsertOne(project, {
      ...state,
      loading: false,
      error: null,
    })
  ),

  on(ProjectsActions.updateProjectFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Delete project
  // ---------------------------------------------------------------------------

  on(ProjectsActions.deleteProject, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ProjectsActions.deleteProjectSuccess, (state, { projectId }) =>
    projectsAdapter.removeOne(projectId, {
      ...state,
      loading: false,
      error: null,
      // Clear selection if the deleted project was selected
      selectedProjectId:
        state.selectedProjectId === projectId ? null : state.selectedProjectId,
    })
  ),

  on(ProjectsActions.deleteProjectFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Set selected project
  // ---------------------------------------------------------------------------

  on(ProjectsActions.setSelectedProject, (state, { projectId }) => ({
    ...state,
    selectedProjectId: projectId,
  })),

  // ---------------------------------------------------------------------------
  // Members
  // ---------------------------------------------------------------------------

  on(ProjectsActions.addMemberSuccess, (state, { projectId, member }) => {
    const project = state.entities[projectId];
    if (!project) return state;
    return projectsAdapter.updateOne(
      {
        id: projectId,
        changes: { memberIds: [...project.memberIds, member.userId] },
      },
      state
    );
  }),

  on(ProjectsActions.removeMemberSuccess, (state, { projectId, userId }) => {
    const project = state.entities[projectId];
    if (!project) return state;
    return projectsAdapter.updateOne(
      {
        id: projectId,
        changes: { memberIds: project.memberIds.filter((id) => id !== userId) },
      },
      state
    );
  }),

  on(ProjectsActions.updateMemberRoleSuccess, (state) => state)
);
