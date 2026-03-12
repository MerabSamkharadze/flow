import { createAction, props } from '@ngrx/store';

/**
 * Auth Actions — all actions for the authentication state slice.
 *
 * Naming convention: [Source] Description
 *   [Login Page]  — triggered from the login component
 *   [Register Page] — triggered from the register component
 *   [Auth API]    — triggered from effects after Firebase responds
 *   [Auth]        — general auth actions
 */

// User model passed through actions
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const login = createAction(
  '[Login Page] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth API] Login Success',
  props<{ user: AuthUser }>()
);

export const loginFailure = createAction(
  '[Auth API] Login Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export const register = createAction(
  '[Register Page] Register',
  props<{ name: string; email: string; password: string }>()
);

export const registerSuccess = createAction(
  '[Auth API] Register Success',
  props<{ user: AuthUser }>()
);

export const registerFailure = createAction(
  '[Auth API] Register Failure',
  props<{ error: string }>()
);

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth API] Logout Success');

// ---------------------------------------------------------------------------
// Load User — check if a user session already exists on app start
// ---------------------------------------------------------------------------

export const loadUser = createAction('[Auth] Load User');

export const loadUserSuccess = createAction(
  '[Auth API] Load User Success',
  props<{ user: AuthUser | null }>()
);
