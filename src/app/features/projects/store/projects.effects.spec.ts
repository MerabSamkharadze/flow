import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';

import { ProjectsEffects } from './projects.effects';
import * as ProjectsActions from './projects.actions';
import { ProjectsService } from '../services/projects.service';
import { BoardService } from '../../board/services/board.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project } from '../../../shared/models/project.model';
import { Member } from '../../../shared/models/member.model';
import { selectUser } from '../../auth/store';

describe('ProjectsEffects', () => {
  let effects: ProjectsEffects;
  let actions$: ReplaySubject<Action>;
  let store: MockStore;

  // --- Mocks ---
  let mockProjectsService: jasmine.SpyObj<any>;
  let mockBoardService: jasmine.SpyObj<any>;
  let mockNotificationsService: jasmine.SpyObj<any>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockProject: Project = {
    id: 'p1',
    name: 'Test Project',
    description: 'A test project',
    ownerId: 'uid1',
    memberIds: ['uid1'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'active',
    color: '#4f46e5',
    deadline: null,
  };

  const mockMember: Member = {
    userId: 'uid2',
    email: 'member@test.com',
    displayName: 'Member User',
    role: 'member',
    joinedAt: Date.now(),
    avatarUrl: null,
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);

    mockProjectsService = {
      getProjects: jasmine.createSpy('getProjects'),
      getProject: jasmine.createSpy('getProject'),
      createProject: jasmine.createSpy('createProject'),
      updateProject: jasmine.createSpy('updateProject'),
      deleteProject: jasmine.createSpy('deleteProject'),
      addMember: jasmine.createSpy('addMember'),
      removeMember: jasmine.createSpy('removeMember'),
      updateMemberRole: jasmine.createSpy('updateMemberRole'),
    };

    mockBoardService = {
      getTasks: jasmine.createSpy('getTasks').and.returnValue(of([])),
    };

    mockNotificationsService = {
      createNotification: jasmine.createSpy('createNotification').and.returnValue(Promise.resolve()),
    };

    mockToastService = jasmine.createSpyObj('ToastService', ['show', 'success', 'error', 'info']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        ProjectsEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectUser, value: { uid: 'uid1', email: 'me@test.com', displayName: 'Me', photoURL: null, role: 'member' } },
          ],
        }),
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: BoardService, useValue: mockBoardService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    effects = TestBed.inject(ProjectsEffects);
    store = TestBed.inject(MockStore);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // loadProjects$
  // ---------------------------------------------------------------------------

  describe('loadProjects$', () => {
    it('should dispatch loadProjectsSuccess on success', (done: DoneFn) => {
      mockProjectsService.getProjects.and.returnValue(of([mockProject]));

      actions$.next(ProjectsActions.loadProjects());

      effects.loadProjects$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.loadProjectsSuccess.type);
        expect((action as any).projects.length).toBe(1);
        done();
      });
    });

    it('should dispatch loadProjectsFailure on error', (done: DoneFn) => {
      mockProjectsService.getProjects.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      actions$.next(ProjectsActions.loadProjects());

      effects.loadProjects$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.loadProjectsFailure.type);
        expect((action as any).error).toBe('Network error');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createProject$
  // ---------------------------------------------------------------------------

  describe('createProject$', () => {
    const { id: _id, ...projectData } = mockProject;

    it('should dispatch createProjectSuccess on success', (done: DoneFn) => {
      mockProjectsService.createProject.and.returnValue(Promise.resolve(mockProject));

      actions$.next(ProjectsActions.createProject({ project: projectData as Omit<Project, 'id'> }));

      effects.createProject$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.createProjectSuccess.type);
        expect((action as any).project.id).toBe('p1');
        done();
      });
    });

    it('should dispatch createProjectFailure on error', (done: DoneFn) => {
      mockProjectsService.createProject.and.returnValue(
        Promise.reject({ message: 'Permission denied' })
      );

      actions$.next(ProjectsActions.createProject({ project: projectData as Omit<Project, 'id'> }));

      effects.createProject$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.createProjectFailure.type);
        expect((action as any).error).toBe('Permission denied');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createProjectSuccess$
  // ---------------------------------------------------------------------------

  describe('createProjectSuccess$', () => {
    it('should show success toast and navigate to /projects', () => {
      actions$.next(ProjectsActions.createProjectSuccess({ project: mockProject }));

      effects.createProjectSuccess$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith(
        `Project "Test Project" created!`, 'success'
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects']);
    });
  });

  // ---------------------------------------------------------------------------
  // updateProject$
  // ---------------------------------------------------------------------------

  describe('updateProject$', () => {
    it('should dispatch updateProjectSuccess on success', (done: DoneFn) => {
      mockProjectsService.updateProject.and.returnValue(Promise.resolve());

      actions$.next(ProjectsActions.updateProject({
        projectId: 'p1',
        changes: { name: 'Updated' },
      }));

      effects.updateProject$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.updateProjectSuccess.type);
        expect((action as any).project.id).toBe('p1');
        expect((action as any).project.name).toBe('Updated');
        done();
      });
    });

    it('should dispatch updateProjectFailure on error', (done: DoneFn) => {
      mockProjectsService.updateProject.and.returnValue(
        Promise.reject({ message: 'Update failed' })
      );

      actions$.next(ProjectsActions.updateProject({
        projectId: 'p1',
        changes: { name: 'Fail' },
      }));

      effects.updateProject$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.updateProjectFailure.type);
        expect((action as any).error).toBe('Update failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateProjectSuccess$
  // ---------------------------------------------------------------------------

  describe('updateProjectSuccess$', () => {
    it('should show "Project saved." toast', () => {
      actions$.next(ProjectsActions.updateProjectSuccess({ project: mockProject }));

      effects.updateProjectSuccess$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith('Project saved.', 'success');
    });
  });

  // ---------------------------------------------------------------------------
  // deleteProject$
  // ---------------------------------------------------------------------------

  describe('deleteProject$', () => {
    it('should dispatch deleteProjectSuccess on success', (done: DoneFn) => {
      mockProjectsService.deleteProject.and.returnValue(Promise.resolve());

      actions$.next(ProjectsActions.deleteProject({ projectId: 'p1' }));

      effects.deleteProject$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.deleteProjectSuccess.type);
        expect((action as any).projectId).toBe('p1');
        done();
      });
    });

    it('should dispatch deleteProjectFailure on error', (done: DoneFn) => {
      mockProjectsService.deleteProject.and.returnValue(
        Promise.reject({ message: 'Delete failed' })
      );

      actions$.next(ProjectsActions.deleteProject({ projectId: 'p1' }));

      effects.deleteProject$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.deleteProjectFailure.type);
        expect((action as any).error).toBe('Delete failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteProjectSuccess$
  // ---------------------------------------------------------------------------

  describe('deleteProjectSuccess$', () => {
    it('should show "Project deleted." toast and navigate to /projects', () => {
      actions$.next(ProjectsActions.deleteProjectSuccess({ projectId: 'p1' }));

      effects.deleteProjectSuccess$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith('Project deleted.', 'success');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects']);
    });
  });

  // ---------------------------------------------------------------------------
  // addMember$
  // ---------------------------------------------------------------------------

  describe('addMember$', () => {
    it('should dispatch addMemberSuccess on success', (done: DoneFn) => {
      mockProjectsService.addMember.and.returnValue(Promise.resolve());

      actions$.next(ProjectsActions.addMember({ projectId: 'p1', member: mockMember }));

      effects.addMember$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.addMemberSuccess.type);
        expect((action as any).projectId).toBe('p1');
        expect((action as any).member.userId).toBe('uid2');
        done();
      });
    });

    it('should dispatch addMemberFailure on error', (done: DoneFn) => {
      mockProjectsService.addMember.and.returnValue(
        Promise.reject({ message: 'Add member failed' })
      );

      actions$.next(ProjectsActions.addMember({ projectId: 'p1', member: mockMember }));

      effects.addMember$.subscribe((action) => {
        expect(action.type).toBe(ProjectsActions.addMemberFailure.type);
        expect((action as any).error).toBe('Add member failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // toastMemberAdded$
  // ---------------------------------------------------------------------------

  describe('toastMemberAdded$', () => {
    it('should show toast with member name', () => {
      actions$.next(ProjectsActions.addMemberSuccess({ projectId: 'p1', member: mockMember }));

      effects.toastMemberAdded$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Member User added to project.', 'success'
      );
    });

    it('should fall back to email when displayName is empty', () => {
      const memberNoName = { ...mockMember, displayName: '' };
      actions$.next(ProjectsActions.addMemberSuccess({ projectId: 'p1', member: memberNoName }));

      effects.toastMemberAdded$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'member@test.com added to project.', 'success'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // notifyMemberAdded$
  // ---------------------------------------------------------------------------

  describe('notifyMemberAdded$', () => {
    it('should create notification for the added member', () => {
      actions$.next(ProjectsActions.addMemberSuccess({ projectId: 'p1', member: mockMember }));

      effects.notifyMemberAdded$.subscribe();
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        'uid2',
        jasmine.objectContaining({
          userId: 'uid2',
          type: 'member_added',
          title: 'Added to project',
          link: '/projects/p1',
          read: false,
        })
      );
    });

    it('should not notify if member is the current user', () => {
      const selfMember = { ...mockMember, userId: 'uid1' };
      actions$.next(ProjectsActions.addMemberSuccess({ projectId: 'p1', member: selfMember }));

      effects.notifyMemberAdded$.subscribe();
      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
    });
  });
});
