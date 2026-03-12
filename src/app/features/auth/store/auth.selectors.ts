import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

/**
 * Auth Selectors — memoized selectors for reading auth state.
 *
 * Usage in components:
 *   this.store.select(selectUser)
 *   this.store.select(selectIsLoggedIn)
 */

// Feature selector — grabs the 'auth' slice from the root state
export const selectAuthState = createFeatureSelector<AuthState>('auth');

/** The currently authenticated user object (or null) */
export const selectUser = createSelector(
  selectAuthState,
  (state) => state.user
);

/** Whether a user is currently signed in */
export const selectIsLoggedIn = createSelector(
  selectUser,
  (user) => !!user
);

/** Whether an auth operation is in progress */
export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

/** The last auth error message (or null) */
export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

/** The current user's role (or null if not logged in) */
export const selectUserRole = createSelector(
  selectUser,
  (user) => user?.role ?? null
);
