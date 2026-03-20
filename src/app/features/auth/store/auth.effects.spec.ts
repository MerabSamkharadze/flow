import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject, of } from 'rxjs';
import { Action } from '@ngrx/store';

import { AuthEffects } from './auth.effects';
import * as AuthActions from './auth.actions';
import { AuthUser } from './auth.actions';
import { FirebaseService } from '../../../core/services/firebase.service';
import { ToastService } from '../../../core/services/toast.service';

describe('AuthEffects', () => {
  let effects: AuthEffects;
  let actions$: ReplaySubject<Action>;

  // --- Mocks ---
  let mockFirebaseService: jasmine.SpyObj<any>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: AuthUser = {
    uid: 'uid1',
    email: 'test@test.com',
    displayName: 'Test User',
    photoURL: null,
    role: 'member',
  };

  const mockFirebaseUser = {
    uid: 'uid1',
    email: 'test@test.com',
    displayName: 'Test User',
    photoURL: null,
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);

    mockFirebaseService = {
      signIn: jasmine.createSpy('signIn'),
      signUp: jasmine.createSpy('signUp'),
      signOut: jasmine.createSpy('signOut'),
      currentUser$: of(null),
    };

    mockToastService = jasmine.createSpyObj('ToastService', ['show', 'success', 'error', 'info']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    effects = TestBed.inject(AuthEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // login$
  // ---------------------------------------------------------------------------

  describe('login$', () => {
    it('should dispatch loginSuccess on successful sign in', (done: DoneFn) => {
      const credential = {
        user: { ...mockFirebaseUser, updateProfile: jasmine.createSpy() },
      };
      mockFirebaseService.signIn.and.returnValue(Promise.resolve(credential));

      actions$.next(AuthActions.login({ email: 'test@test.com', password: 'pass123' }));

      effects.login$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.loginSuccess.type);
        expect((action as any).user.uid).toBe('uid1');
        done();
      });
    });

    it('should dispatch loginFailure on sign in error', (done: DoneFn) => {
      mockFirebaseService.signIn.and.returnValue(
        Promise.reject({ message: 'Invalid credentials' })
      );

      actions$.next(AuthActions.login({ email: 'bad@test.com', password: 'wrong' }));

      effects.login$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.loginFailure.type);
        expect((action as any).error).toBe('Invalid credentials');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // loginSuccess$
  // ---------------------------------------------------------------------------

  describe('loginSuccess$', () => {
    it('should navigate to dashboard on login success', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      actions$.next(AuthActions.loginSuccess({ user: mockUser }));

      effects.loginSuccess$.subscribe();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to saved redirect URL if present', () => {
      spyOn(localStorage, 'getItem').and.returnValue('/projects/abc');
      spyOn(localStorage, 'removeItem');

      actions$.next(AuthActions.loginSuccess({ user: mockUser }));

      effects.loginSuccess$.subscribe();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/projects/abc');
      expect(localStorage.removeItem).toHaveBeenCalledWith('flow_redirect_url');
    });
  });

  // ---------------------------------------------------------------------------
  // loginFailure$
  // ---------------------------------------------------------------------------

  describe('loginFailure$', () => {
    it('should show error toast on login failure', () => {
      actions$.next(AuthActions.loginFailure({ error: 'Bad creds' }));

      effects.loginFailure$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Invalid email or password.', 'error', 5000
      );
    });
  });

  // ---------------------------------------------------------------------------
  // register$
  // ---------------------------------------------------------------------------

  describe('register$', () => {
    it('should dispatch registerSuccess on successful sign up', (done: DoneFn) => {
      const credential = {
        user: {
          uid: 'uid2',
          email: 'new@test.com',
          displayName: null,
          photoURL: null,
          updateProfile: jasmine.createSpy('updateProfile').and.returnValue(Promise.resolve()),
        },
      };
      mockFirebaseService.signUp.and.returnValue(Promise.resolve(credential));

      actions$.next(AuthActions.register({ name: 'New User', email: 'new@test.com', password: 'pass456' }));

      effects.register$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.registerSuccess.type);
        expect((action as any).user.uid).toBe('uid2');
        expect((action as any).user.displayName).toBe('New User');
        done();
      });
    });

    it('should dispatch registerFailure on sign up error', (done: DoneFn) => {
      mockFirebaseService.signUp.and.returnValue(
        Promise.reject({ message: 'Email already in use' })
      );

      actions$.next(AuthActions.register({ name: 'X', email: 'dup@test.com', password: 'pass' }));

      effects.register$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.registerFailure.type);
        expect((action as any).error).toBe('Email already in use');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // registerFailure$
  // ---------------------------------------------------------------------------

  describe('registerFailure$', () => {
    it('should show error toast with the error message', () => {
      actions$.next(AuthActions.registerFailure({ error: 'Email taken' }));

      effects.registerFailure$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith('Email taken', 'error', 5000);
    });
  });

  // ---------------------------------------------------------------------------
  // registerSuccess$
  // ---------------------------------------------------------------------------

  describe('registerSuccess$', () => {
    it('should navigate to dashboard on register success', () => {
      actions$.next(AuthActions.registerSuccess({ user: mockUser }));

      effects.registerSuccess$.subscribe();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  // ---------------------------------------------------------------------------
  // logout$
  // ---------------------------------------------------------------------------

  describe('logout$', () => {
    it('should dispatch logoutSuccess after signing out', (done: DoneFn) => {
      mockFirebaseService.signOut.and.returnValue(Promise.resolve());

      actions$.next(AuthActions.logout());

      effects.logout$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.logoutSuccess.type);
        done();
      });
    });

    it('should dispatch logoutSuccess even if signOut fails', (done: DoneFn) => {
      mockFirebaseService.signOut.and.returnValue(Promise.reject('error'));

      actions$.next(AuthActions.logout());

      effects.logout$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.logoutSuccess.type);
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // logoutSuccess$
  // ---------------------------------------------------------------------------

  describe('logoutSuccess$', () => {
    it('should navigate to /auth/login', () => {
      actions$.next(AuthActions.logoutSuccess());

      effects.logoutSuccess$.subscribe();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ---------------------------------------------------------------------------
  // loadUser$
  // ---------------------------------------------------------------------------

  describe('loadUser$', () => {
    it('should dispatch loadUserSuccess with user when logged in', (done: DoneFn) => {
      mockFirebaseService.currentUser$ = of(mockFirebaseUser);

      // Recreate effects to pick up new currentUser$
      effects = TestBed.inject(AuthEffects);

      actions$.next(AuthActions.loadUser());

      effects.loadUser$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.loadUserSuccess.type);
        expect((action as any).user).toBeTruthy();
        expect((action as any).user.uid).toBe('uid1');
        done();
      });
    });

    it('should dispatch loadUserSuccess with null when not logged in', (done: DoneFn) => {
      mockFirebaseService.currentUser$ = of(null);

      effects = TestBed.inject(AuthEffects);

      actions$.next(AuthActions.loadUser());

      effects.loadUser$.subscribe((action) => {
        expect(action.type).toBe(AuthActions.loadUserSuccess.type);
        expect((action as any).user).toBeNull();
        done();
      });
    });
  });
});
