import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthUser } from './auth.actions';

/**
 * AuthState — shape of the 'auth' feature state slice.
 *
 * - user: the currently authenticated user (null when signed out)
 * - loading: true while an auth operation is in progress
 * - error: error message from the last failed operation (null on success)
 */
export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.registerSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
  })),

  // ---------------------------------------------------------------------------
  // Load User (on app start)
  // ---------------------------------------------------------------------------

  on(AuthActions.loadUser, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
  })),

  // ---------------------------------------------------------------------------
  // Update User Photo
  // ---------------------------------------------------------------------------

  on(AuthActions.updateUserPhoto, (state, { photoURL }) => ({
    ...state,
    user: state.user ? { ...state.user, photoURL } : null,
  }))
);
