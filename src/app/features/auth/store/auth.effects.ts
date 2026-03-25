import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, take, tap } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FirebaseService } from '../../../core/services/firebase.service';
import { ToastService } from '../../../core/services/toast.service';
import * as AuthActions from './auth.actions';
import { AuthUser } from './auth.actions';

/** localStorage key for post-login redirect */
const REDIRECT_URL_KEY = 'flow_redirect_url';

/**
 * AuthEffects — side effects for authentication actions.
 *
 * Each effect listens for a specific action, calls FirebaseService,
 * and dispatches a success or failure action with the result.
 */
@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private firebaseService: FirebaseService,
    private firestore: AngularFirestore,
    private toastService: ToastService,
    private router: Router
  ) {}

  /** Ensure a users/{uid} document exists in Firestore for user lookups */
  private async ensureUserDocument(user: AuthUser): Promise<void> {
    if (!user.uid) return;
    await this.firestore.doc(`users/${user.uid}`).set(
      {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  /**
   * Helper — converts a Firebase User object to our serializable AuthUser.
   * NgRx store requires plain serializable objects (no class instances).
   */
  private toAuthUser(fbUser: firebase.default.User, role: string = 'member'): AuthUser {
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      role,
    };
  }

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  /** Calls Firebase signIn, maps result to loginSuccess or loginFailure */
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.firebaseService.signIn(email, password).then(
          async (credential) => {
            const user = this.toAuthUser(credential.user!);
            await this.ensureUserDocument(user);
            return AuthActions.loginSuccess({ user });
          },
          (error) => AuthActions.loginFailure({ error: error.message })
        )
      )
    )
  );

  /**
   * On successful login, check for a saved redirect URL.
   * If one exists, navigate there and clear it. Otherwise go to dashboard.
   */
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          const redirectUrl = localStorage.getItem(REDIRECT_URL_KEY);
          if (redirectUrl) {
            localStorage.removeItem(REDIRECT_URL_KEY);
            this.router.navigateByUrl(redirectUrl);
          } else {
            this.router.navigate(['/']);
          }
        })
      ),
    { dispatch: false }
  );

  /** Show toast on login failure */
  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap(() => this.toastService.show('Invalid email or password.', 'error', 5000))
      ),
    { dispatch: false }
  );

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  /** Calls Firebase createUser, updates displayName, maps to success/failure */
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ name, email, password }) =>
        this.firebaseService
          .signUp(email, password)
          .then(async (credential) => {
            // Set the display name on the newly created user
            await credential.user!.updateProfile({ displayName: name });

            const user: AuthUser = {
              uid: credential.user!.uid,
              email: credential.user!.email,
              displayName: name,
              photoURL: null,
              role: 'member',
            };
            await this.ensureUserDocument(user);
            return AuthActions.registerSuccess({ user });
          })
          .catch((error) =>
            AuthActions.registerFailure({ error: error.message })
          )
      )
    )
  );

  /** Show toast on registration failure */
  registerFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerFailure),
        tap(({ error }) => this.toastService.show(error || 'Registration failed.', 'error', 5000))
      ),
    { dispatch: false }
  );

  /** On successful registration, navigate to the dashboard */
  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => this.router.navigate(['/']))
      ),
    { dispatch: false }
  );

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  /** Calls Firebase signOut, then dispatches logoutSuccess */
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.firebaseService.signOut().then(
          () => AuthActions.logoutSuccess(),
          // Even if signOut fails, clear local state
          () => AuthActions.logoutSuccess()
        )
      )
    )
  );

  /** On successful logout, navigate to the login page */
  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigate(['/auth/login']))
      ),
    { dispatch: false }
  );

  // ---------------------------------------------------------------------------
  // Load User — restores session on app startup
  // ---------------------------------------------------------------------------

  /**
   * Listens to Firebase authState to check if a user is already signed in.
   * Takes only the first emission (the initial auth state check).
   */
  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      exhaustMap(() =>
        this.firebaseService.currentUser$.pipe(
          take(1),
          map((fbUser) => {
            const user = fbUser ? this.toAuthUser(fbUser) : null;
            return AuthActions.loadUserSuccess({ user });
          }),
          catchError(() => of(AuthActions.loadUserSuccess({ user: null })))
        )
      )
    )
  );
}
