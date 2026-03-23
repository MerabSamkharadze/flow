import { TestBed } from '@angular/core/testing';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';

import { TasksEffects } from './tasks.effects';
import * as TasksActions from './tasks.actions';
import { TasksService } from '../services/tasks.service';
import { CommentsService } from '../services/comments.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { ToastService } from '../../../core/services/toast.service';
import { selectAllTasks } from '../../board/store/board.selectors';
import { Task, TaskStatus } from '../../../shared/models/task.model';
import { Subtask } from '../../../shared/models/subtask.model';
import { Comment } from '../../../shared/models/comment.model';

describe('TasksEffects', () => {
  let effects: TasksEffects;
  let actions$: ReplaySubject<Action>;
  let store: MockStore;

  // --- Mocks ---
  let mockTasksService: jasmine.SpyObj<TasksService>;
  let mockCommentsService: jasmine.SpyObj<CommentsService>;
  let mockNotificationsService: jasmine.SpyObj<NotificationsService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockTasks: Task[] = [
    {
      id: 'task-1', title: 'My Task', description: '', projectId: 'proj-1',
      columnId: 'col-1', assigneeId: 'user-1', priority: 'high', status: 'todo', issueType: 'task',
      createdAt: 1000, updatedAt: 2000, deadline: null, order: 0, labels: [], subtasks: [],
    },
    {
      id: 'task-2', title: 'Other Task', description: '', projectId: 'proj-1',
      columnId: 'col-2', assigneeId: 'user-2', priority: 'low', status: 'in-progress', issueType: 'task',
      createdAt: 1100, updatedAt: 2100, deadline: null, order: 0, labels: [], subtasks: [],
    },
  ];

  const mockSubtask: Subtask = {
    id: 'sub-1', taskId: 'task-1', title: 'Subtask 1',
    completed: false, createdAt: 5000, completedAt: null,
  };

  const mockComment: Comment = {
    id: 'comment-1', taskId: 'task-1', authorId: 'user-1',
    authorName: 'Test User', authorAvatar: null, content: 'Hello',
    createdAt: 6000, updatedAt: null,
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);

    mockTasksService = jasmine.createSpyObj('TasksService', [
      'getMyTasks', 'getUserProjects', 'updateTaskStatus',
      'getSubtasks', 'addSubtask', 'toggleSubtask', 'deleteSubtask',
    ]);

    mockCommentsService = jasmine.createSpyObj('CommentsService', [
      'getComments', 'addComment', 'editComment', 'deleteComment',
    ]);

    mockNotificationsService = jasmine.createSpyObj('NotificationsService', ['createNotification']);
    mockToastService = jasmine.createSpyObj('ToastService', ['show', 'success', 'error', 'info']);

    TestBed.configureTestingModule({
      providers: [
        TasksEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectAllTasks, value: mockTasks },
          ],
        }),
        { provide: TasksService, useValue: mockTasksService },
        { provide: CommentsService, useValue: mockCommentsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    effects = TestBed.inject(TasksEffects);
    store = TestBed.inject(MockStore);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // loadMyTasks$
  // ---------------------------------------------------------------------------

  describe('loadMyTasks$', () => {
    it('should dispatch loadMyTasksSuccess with tasks', (done: DoneFn) => {
      mockTasksService.getMyTasks.and.returnValue(of(mockTasks));

      actions$.next(TasksActions.loadMyTasks({ userId: 'user-1' }));

      effects.loadMyTasks$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.loadMyTasksSuccess.type);
        expect((action as any).tasks).toEqual(mockTasks);
        done();
      });
    });

    it('should call getMyTasks with the userId to filter by assignee', (done: DoneFn) => {
      mockTasksService.getMyTasks.and.returnValue(of([]));

      actions$.next(TasksActions.loadMyTasks({ userId: 'user-1' }));

      effects.loadMyTasks$.subscribe(() => {
        expect(mockTasksService.getMyTasks).toHaveBeenCalledWith('user-1');
        done();
      });
    });

    it('should dispatch loadMyTasksFailure on error', (done: DoneFn) => {
      mockTasksService.getMyTasks.and.returnValue(
        throwError(() => ({ message: 'Load failed' }))
      );

      actions$.next(TasksActions.loadMyTasks({ userId: 'user-1' }));

      effects.loadMyTasks$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.loadMyTasksFailure.type);
        expect((action as any).error).toBe('Load failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateTaskStatus$
  // ---------------------------------------------------------------------------

  describe('updateTaskStatus$', () => {
    it('should dispatch updateTaskStatusSuccess', (done: DoneFn) => {
      mockTasksService.updateTaskStatus.and.returnValue(Promise.resolve());

      actions$.next(TasksActions.updateTaskStatus({
        projectId: 'proj-1', taskId: 'task-1', status: 'done' as TaskStatus,
      }));

      effects.updateTaskStatus$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.updateTaskStatusSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).status).toBe('done');
        done();
      });
    });

    it('should dispatch updateTaskStatusFailure on error', (done: DoneFn) => {
      mockTasksService.updateTaskStatus.and.returnValue(
        Promise.reject({ message: 'Status update failed' })
      );

      actions$.next(TasksActions.updateTaskStatus({
        projectId: 'proj-1', taskId: 'task-1', status: 'done' as TaskStatus,
      }));

      effects.updateTaskStatus$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.updateTaskStatusFailure.type);
        expect((action as any).error).toBe('Status update failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // toastUpdateTaskStatus$ (dispatch: false)
  // ---------------------------------------------------------------------------

  describe('toastUpdateTaskStatus$', () => {
    it('should show success toast with status message', () => {
      actions$.next(TasksActions.updateTaskStatusSuccess({
        taskId: 'task-1', status: 'done' as TaskStatus,
      }));

      effects.toastUpdateTaskStatus$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith('Task marked as done.', 'success');
    });
  });

  // ---------------------------------------------------------------------------
  // loadComments$
  // ---------------------------------------------------------------------------

  describe('loadComments$', () => {
    it('should dispatch loadCommentsSuccess with comments array', (done: DoneFn) => {
      const comments: Comment[] = [mockComment];
      mockCommentsService.getComments.and.returnValue(of(comments));

      actions$.next(TasksActions.loadComments({ projectId: 'proj-1', taskId: 'task-1' }));

      effects.loadComments$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.loadCommentsSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).comments).toEqual(comments);
        done();
      });
    });

    it('should dispatch loadCommentsFailure on error', (done: DoneFn) => {
      mockCommentsService.getComments.and.returnValue(
        throwError(() => ({ message: 'Comments load failed' }))
      );

      actions$.next(TasksActions.loadComments({ projectId: 'proj-1', taskId: 'task-1' }));

      effects.loadComments$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.loadCommentsFailure.type);
        expect((action as any).error).toBe('Comments load failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addComment$
  // ---------------------------------------------------------------------------

  describe('addComment$', () => {
    it('should dispatch addCommentSuccess with the created comment', (done: DoneFn) => {
      mockCommentsService.addComment.and.returnValue(Promise.resolve(mockComment));

      actions$.next(TasksActions.addComment({
        projectId: 'proj-1', taskId: 'task-1',
        authorId: 'user-1', authorName: 'Test User',
        authorAvatar: null, content: 'Hello',
      }));

      effects.addComment$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.addCommentSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).comment).toEqual(mockComment);
        done();
      });
    });

    it('should dispatch addCommentFailure on error', (done: DoneFn) => {
      mockCommentsService.addComment.and.returnValue(
        Promise.reject({ message: 'Comment add failed' })
      );

      actions$.next(TasksActions.addComment({
        projectId: 'proj-1', taskId: 'task-1',
        authorId: 'user-1', authorName: 'Test User',
        authorAvatar: null, content: 'Fail',
      }));

      effects.addComment$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.addCommentFailure.type);
        expect((action as any).error).toBe('Comment add failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // toastCommentAdded$ (dispatch: false)
  // ---------------------------------------------------------------------------

  describe('toastCommentAdded$', () => {
    it('should show success toast when comment is added', () => {
      actions$.next(TasksActions.addCommentSuccess({ taskId: 'task-1', comment: mockComment }));

      effects.toastCommentAdded$.subscribe();
      expect(mockToastService.show).toHaveBeenCalledWith('Comment added.', 'success');
    });
  });

  // ---------------------------------------------------------------------------
  // editComment$
  // ---------------------------------------------------------------------------

  describe('editComment$', () => {
    it('should dispatch editCommentSuccess with updated content', (done: DoneFn) => {
      mockCommentsService.editComment.and.returnValue(Promise.resolve());

      actions$.next(TasksActions.editComment({
        projectId: 'proj-1', taskId: 'task-1',
        commentId: 'comment-1', content: 'Updated content',
      }));

      effects.editComment$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.editCommentSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).commentId).toBe('comment-1');
        expect((action as any).content).toBe('Updated content');
        expect((action as any).updatedAt).toBeDefined();
        done();
      });
    });

    it('should dispatch editCommentFailure on error', (done: DoneFn) => {
      mockCommentsService.editComment.and.returnValue(
        Promise.reject({ message: 'Edit failed' })
      );

      actions$.next(TasksActions.editComment({
        projectId: 'proj-1', taskId: 'task-1',
        commentId: 'comment-1', content: 'Fail',
      }));

      effects.editComment$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.editCommentFailure.type);
        expect((action as any).error).toBe('Edit failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteComment$
  // ---------------------------------------------------------------------------

  describe('deleteComment$', () => {
    it('should dispatch deleteCommentSuccess', (done: DoneFn) => {
      mockCommentsService.deleteComment.and.returnValue(Promise.resolve());

      actions$.next(TasksActions.deleteComment({
        projectId: 'proj-1', taskId: 'task-1', commentId: 'comment-1',
      }));

      effects.deleteComment$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.deleteCommentSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).commentId).toBe('comment-1');
        done();
      });
    });

    it('should dispatch deleteCommentFailure on error', (done: DoneFn) => {
      mockCommentsService.deleteComment.and.returnValue(
        Promise.reject({ message: 'Delete comment failed' })
      );

      actions$.next(TasksActions.deleteComment({
        projectId: 'proj-1', taskId: 'task-1', commentId: 'comment-1',
      }));

      effects.deleteComment$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.deleteCommentFailure.type);
        expect((action as any).error).toBe('Delete comment failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addSubtask$
  // ---------------------------------------------------------------------------

  describe('addSubtask$', () => {
    it('should dispatch addSubtaskSuccess with the created subtask', (done: DoneFn) => {
      mockTasksService.addSubtask.and.returnValue(Promise.resolve(mockSubtask));

      actions$.next(TasksActions.addSubtask({
        projectId: 'proj-1', taskId: 'task-1', title: 'Subtask 1',
      }));

      effects.addSubtask$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.addSubtaskSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).subtask).toEqual(mockSubtask);
        done();
      });
    });

    it('should dispatch addSubtaskFailure on error', (done: DoneFn) => {
      mockTasksService.addSubtask.and.returnValue(
        Promise.reject({ message: 'Subtask add failed' })
      );

      actions$.next(TasksActions.addSubtask({
        projectId: 'proj-1', taskId: 'task-1', title: 'Fail',
      }));

      effects.addSubtask$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.addSubtaskFailure.type);
        expect((action as any).error).toBe('Subtask add failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // toggleSubtask$
  // ---------------------------------------------------------------------------

  describe('toggleSubtask$', () => {
    it('should dispatch toggleSubtaskSuccess with completed=true', (done: DoneFn) => {
      mockTasksService.toggleSubtask.and.returnValue(Promise.resolve());

      actions$.next(TasksActions.toggleSubtask({
        projectId: 'proj-1', taskId: 'task-1',
        subtaskId: 'sub-1', completed: true,
      }));

      effects.toggleSubtask$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.toggleSubtaskSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).subtaskId).toBe('sub-1');
        expect((action as any).completed).toBe(true);
        expect((action as any).completedAt).toBeGreaterThan(0);
        done();
      });
    });

    it('should dispatch toggleSubtaskSuccess with completed=false and null completedAt', (done: DoneFn) => {
      mockTasksService.toggleSubtask.and.returnValue(Promise.resolve());

      actions$.next(TasksActions.toggleSubtask({
        projectId: 'proj-1', taskId: 'task-1',
        subtaskId: 'sub-1', completed: false,
      }));

      effects.toggleSubtask$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.toggleSubtaskSuccess.type);
        expect((action as any).completed).toBe(false);
        expect((action as any).completedAt).toBeNull();
        done();
      });
    });

    it('should dispatch toggleSubtaskFailure on error', (done: DoneFn) => {
      mockTasksService.toggleSubtask.and.returnValue(
        Promise.reject({ message: 'Toggle failed' })
      );

      actions$.next(TasksActions.toggleSubtask({
        projectId: 'proj-1', taskId: 'task-1',
        subtaskId: 'sub-1', completed: true,
      }));

      effects.toggleSubtask$.subscribe((action) => {
        expect(action.type).toBe(TasksActions.toggleSubtaskFailure.type);
        expect((action as any).error).toBe('Toggle failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // notifyCommentAdded$ (dispatch: false)
  // ---------------------------------------------------------------------------

  describe('notifyCommentAdded$', () => {
    it('should notify the task assignee when a different user comments', () => {
      const comment: Comment = {
        id: 'c-1', taskId: 'task-1', authorId: 'user-other',
        authorName: 'Other User', authorAvatar: null, content: 'Hi',
        createdAt: 7000, updatedAt: null,
      };

      actions$.next(TasksActions.addCommentSuccess({ taskId: 'task-1', comment }));

      effects.notifyCommentAdded$.subscribe();
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        'user-1', // task-1 assigneeId
        jasmine.objectContaining({
          userId: 'user-1',
          type: 'comment_added',
          title: 'New comment on your task',
        })
      );
    });

    it('should NOT notify when author is the assignee', () => {
      const comment: Comment = {
        id: 'c-2', taskId: 'task-1', authorId: 'user-1',
        authorName: 'Self', authorAvatar: null, content: 'My own comment',
        createdAt: 7000, updatedAt: null,
      };

      actions$.next(TasksActions.addCommentSuccess({ taskId: 'task-1', comment }));

      effects.notifyCommentAdded$.subscribe();
      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
    });
  });
});
