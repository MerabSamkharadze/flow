import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProjectsState, projectsAdapter } from './projects.reducer';

/**
 * Projects Selectors — memoized selectors for reading projects state.
 *
 * The entity adapter provides built-in selectors for the entity collection.
 * Custom selectors handle selectedProjectId, loading, and error.
 */

// Feature selector — grabs the 'projects' slice from the root state
export const selectProjectsState = createFeatureSelector<ProjectsState>('projects');

// Adapter-generated selectors for the entity collection
const { selectAll, selectEntities, selectTotal } = projectsAdapter.getSelectors();

/** All projects as an array (sorted by updatedAt descending via adapter) */
export const selectAllProjects = createSelector(
  selectProjectsState,
  selectAll
);

/** Projects as a dictionary keyed by ID */
export const selectProjectEntities = createSelector(
  selectProjectsState,
  selectEntities
);

/** Total number of projects */
export const selectProjectsCount = createSelector(
  selectProjectsState,
  selectTotal
);

/** The currently selected project ID */
export const selectSelectedProjectId = createSelector(
  selectProjectsState,
  (state) => state.selectedProjectId
);

/** The currently selected project entity */
export const selectSelectedProject = createSelector(
  selectProjectEntities,
  selectSelectedProjectId,
  (entities, selectedId) => (selectedId ? entities[selectedId] ?? null : null)
);

/** Whether a projects operation is in progress */
export const selectProjectsLoading = createSelector(
  selectProjectsState,
  (state) => state.loading
);

/** The last projects error message (or null) */
export const selectProjectsError = createSelector(
  selectProjectsState,
  (state) => state.error
);

/** Select a single project by its ID (factory selector) */
export const selectProjectById = (projectId: string) =>
  createSelector(
    selectProjectEntities,
    (entities) => entities[projectId] ?? null
  );
