import { TestBed } from '@angular/core/testing';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';

import { BoardEffects } from './board.effects';
import * as BoardActions from './board.actions';
import { BoardService } from '../services/board.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { selectTasksMap } from './board.selectors';
import { selectUser } from '../../auth/store';
import { Column } from '../../../shared/models/column.model';
import { Task } from '../../../shared/models/task.model';

describe('BoardEffects', () => {
  let effects: BoardEffects;
  let actions$: ReplaySubject<Action>;
  let store: MockStore;

  // --- Mocks ---
  let mockBoardService: jasmine.SpyObj<BoardService>;
  let mockNotificationsService: jasmine.SpyObj<NotificationsService>;

  const mockColumns: Column[] = [
    { id: 'col-1', name: 'To Do', projectId: 'proj-1', order: 0, color: '#ccc', taskLimit: null },
    { id: 'col-2', name: 'In Progress', projectId: 'proj-1', order: 1, color: '#0af', taskLimit: 5 },
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-1', title: 'Task One', description: '', projectId: 'proj-1',
      columnId: 'col-1', assigneeId: 'user-1', priority: 'medium', status: 'todo', issueType: 'task',
      createdAt: 1000, updatedAt: 2000, deadline: null, startDate: null, order: 0, labels: [], subtasks: [],
    },
    {
      id: 'task-2', title: 'Task Two', description: '', projectId: 'proj-1',
      columnId: 'col-1', assigneeId: null, priority: 'high', status: 'todo', issueType: 'task',
      createdAt: 1100, updatedAt: 2100, deadline: null, startDate: null, order: 1, labels: [], subtasks: [],
    },
    {
      id: 'task-3', title: 'Task Three', description: '', projectId: 'proj-1',
      columnId: 'col-2', assigneeId: 'user-2', priority: 'low', status: 'in-progress', issueType: 'task',
      createdAt: 1200, updatedAt: 2200, deadline: null, startDate: null, order: 0, labels: [], subtasks: [],
    },
  ];

  const mockTasksMap: { [columnId: string]: Task[] } = {
    'col-1': [mockTasks[0], mockTasks[1]],
    'col-2': [mockTasks[2]],
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);

    mockBoardService = jasmine.createSpyObj('BoardService', [
      'getColumns', 'getTasks',
      'addColumn', 'updateColumn', 'deleteColumn',
      'addTask', 'updateTask', 'deleteTask',
      'moveTask',
    ]);

    mockNotificationsService = jasmine.createSpyObj('NotificationsService', ['createNotification']);

    TestBed.configureTestingModule({
      providers: [
        BoardEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectTasksMap, value: mockTasksMap },
            { selector: selectUser, value: { uid: 'current-user', email: 'me@test.com', displayName: 'Me', photoURL: null } },
          ],
        }),
        { provide: BoardService, useValue: mockBoardService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    });

    effects = TestBed.inject(BoardEffects);
    store = TestBed.inject(MockStore);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // loadBoard$
  // ---------------------------------------------------------------------------

  describe('loadBoard$', () => {
    it('should dispatch loadBoardSuccess with columns and tasks', (done: DoneFn) => {
      mockBoardService.getColumns.and.returnValue(of(mockColumns));
      mockBoardService.getTasks.and.returnValue(of(mockTasks));

      actions$.next(BoardActions.loadBoard({ projectId: 'proj-1' }));

      effects.loadBoard$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.loadBoardSuccess.type);
        const result = action as ReturnType<typeof BoardActions.loadBoardSuccess>;
        expect(result.columns).toEqual(mockColumns);
        expect(result.tasks).toEqual(mockTasks);
        done();
      });
    });

    it('should dispatch loadBoardFailure on error', (done: DoneFn) => {
      mockBoardService.getColumns.and.returnValue(throwError(() => ({ message: 'Network error' })));
      mockBoardService.getTasks.and.returnValue(of(mockTasks));

      actions$.next(BoardActions.loadBoard({ projectId: 'proj-1' }));

      effects.loadBoard$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.loadBoardFailure.type);
        expect((action as any).error).toBe('Network error');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addTask$
  // ---------------------------------------------------------------------------

  describe('addTask$', () => {
    const newTaskInput: Omit<Task, 'id'> = {
      title: 'New Task', description: '', projectId: 'proj-1', columnId: 'col-1',
      assigneeId: null, priority: 'medium', status: 'todo', issueType: 'task',
      createdAt: 3000, updatedAt: 3000, deadline: null, startDate: null, order: 2, labels: [], subtasks: [],
    };

    const createdTask: Task = { ...newTaskInput, id: 'task-new' } as Task;

    it('should dispatch addTaskSuccess with the created task', (done: DoneFn) => {
      mockBoardService.addTask.and.returnValue(Promise.resolve(createdTask));

      actions$.next(BoardActions.addTask({ projectId: 'proj-1', task: newTaskInput }));

      effects.addTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.addTaskSuccess.type);
        expect((action as any).task).toEqual(createdTask);
        done();
      });
    });

    it('should dispatch addTaskFailure on error', (done: DoneFn) => {
      mockBoardService.addTask.and.returnValue(Promise.reject({ message: 'Add failed' }));

      actions$.next(BoardActions.addTask({ projectId: 'proj-1', task: newTaskInput }));

      effects.addTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.addTaskFailure.type);
        expect((action as any).error).toBe('Add failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateTask$
  // ---------------------------------------------------------------------------

  describe('updateTask$', () => {
    it('should dispatch updateTaskSuccess with updated task', (done: DoneFn) => {
      mockBoardService.updateTask.and.returnValue(Promise.resolve());

      const changes: Partial<Task> = { title: 'Updated Title', columnId: 'col-1' };
      actions$.next(BoardActions.updateTask({ projectId: 'proj-1', taskId: 'task-1', changes }));

      effects.updateTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.updateTaskSuccess.type);
        const result = action as ReturnType<typeof BoardActions.updateTaskSuccess>;
        expect(result.task.id).toBe('task-1');
        expect(result.task.title).toBe('Updated Title');
        done();
      });
    });

    it('should dispatch updateTaskFailure on error', (done: DoneFn) => {
      mockBoardService.updateTask.and.returnValue(Promise.reject({ message: 'Update failed' }));

      actions$.next(BoardActions.updateTask({
        projectId: 'proj-1', taskId: 'task-1', changes: { title: 'X' },
      }));

      effects.updateTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.updateTaskFailure.type);
        expect((action as any).error).toBe('Update failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // moveTask$
  // ---------------------------------------------------------------------------

  describe('moveTask$', () => {
    it('should dispatch moveTaskSuccess after calling boardService.moveTask', (done: DoneFn) => {
      mockBoardService.moveTask.and.returnValue(Promise.resolve());

      actions$.next(BoardActions.moveTask({
        projectId: 'proj-1', taskId: 'task-1',
        fromColumnId: 'col-1', toColumnId: 'col-2', newOrder: 0,
      }));

      effects.moveTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.moveTaskSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).toColumnId).toBe('col-2');
        done();
      });
    });

    it('should call BoardService.moveTask with correct params including affected tasks', (done: DoneFn) => {
      mockBoardService.moveTask.and.returnValue(Promise.resolve());

      actions$.next(BoardActions.moveTask({
        projectId: 'proj-1', taskId: 'task-1',
        fromColumnId: 'col-1', toColumnId: 'col-2', newOrder: 1,
      }));

      effects.moveTask$.subscribe(() => {
        expect(mockBoardService.moveTask).toHaveBeenCalled();
        const args = mockBoardService.moveTask.calls.mostRecent().args;
        expect(args[0]).toBe('proj-1');   // projectId
        expect(args[1]).toBe('task-1');   // taskId
        expect(args[2]).toBe('col-2');    // toColumnId
        expect(args[3]).toBe(1);          // newOrder
        // affectedTasks should include tasks from both columns (cross-column move)
        expect(args[4].length).toBeGreaterThan(0);
        done();
      });
    });

    it('should dispatch moveTaskFailure on error', (done: DoneFn) => {
      mockBoardService.moveTask.and.returnValue(Promise.reject({ message: 'Move failed' }));

      actions$.next(BoardActions.moveTask({
        projectId: 'proj-1', taskId: 'task-1',
        fromColumnId: 'col-1', toColumnId: 'col-2', newOrder: 0,
      }));

      effects.moveTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.moveTaskFailure.type);
        expect((action as any).error).toBe('Move failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteTask$
  // ---------------------------------------------------------------------------

  describe('deleteTask$', () => {
    it('should dispatch deleteTaskSuccess with taskId and columnId', (done: DoneFn) => {
      mockBoardService.deleteTask.and.returnValue(Promise.resolve());

      actions$.next(BoardActions.deleteTask({ projectId: 'proj-1', taskId: 'task-1', columnId: 'col-1' }));

      effects.deleteTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.deleteTaskSuccess.type);
        expect((action as any).taskId).toBe('task-1');
        expect((action as any).columnId).toBe('col-1');
        done();
      });
    });

    it('should dispatch deleteTaskFailure on error', (done: DoneFn) => {
      mockBoardService.deleteTask.and.returnValue(Promise.reject({ message: 'Delete failed' }));

      actions$.next(BoardActions.deleteTask({ projectId: 'proj-1', taskId: 'task-1', columnId: 'col-1' }));

      effects.deleteTask$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.deleteTaskFailure.type);
        expect((action as any).error).toBe('Delete failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addColumn$
  // ---------------------------------------------------------------------------

  describe('addColumn$', () => {
    const newColumnInput: Omit<Column, 'id'> = {
      name: 'Review', projectId: 'proj-1', order: 2, color: '#f0f', taskLimit: null,
    };

    const createdColumn: Column = { ...newColumnInput, id: 'col-new' } as Column;

    it('should dispatch addColumnSuccess with the created column', (done: DoneFn) => {
      mockBoardService.addColumn.and.returnValue(Promise.resolve(createdColumn));

      actions$.next(BoardActions.addColumn({ projectId: 'proj-1', column: newColumnInput }));

      effects.addColumn$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.addColumnSuccess.type);
        expect((action as any).column).toEqual(createdColumn);
        done();
      });
    });

    it('should dispatch addColumnFailure on error', (done: DoneFn) => {
      mockBoardService.addColumn.and.returnValue(Promise.reject({ message: 'Column add failed' }));

      actions$.next(BoardActions.addColumn({ projectId: 'proj-1', column: newColumnInput }));

      effects.addColumn$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.addColumnFailure.type);
        expect((action as any).error).toBe('Column add failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateColumn$
  // ---------------------------------------------------------------------------

  describe('updateColumn$', () => {
    it('should dispatch updateColumnSuccess with updated column', (done: DoneFn) => {
      mockBoardService.updateColumn.and.returnValue(Promise.resolve());

      actions$.next(BoardActions.updateColumn({
        projectId: 'proj-1', columnId: 'col-1', changes: { name: 'Done' },
      }));

      effects.updateColumn$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.updateColumnSuccess.type);
        const result = action as ReturnType<typeof BoardActions.updateColumnSuccess>;
        expect(result.column.id).toBe('col-1');
        expect(result.column.name).toBe('Done');
        done();
      });
    });

    it('should dispatch updateColumnFailure on error', (done: DoneFn) => {
      mockBoardService.updateColumn.and.returnValue(Promise.reject({ message: 'Update col failed' }));

      actions$.next(BoardActions.updateColumn({
        projectId: 'proj-1', columnId: 'col-1', changes: { name: 'X' },
      }));

      effects.updateColumn$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.updateColumnFailure.type);
        expect((action as any).error).toBe('Update col failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteColumn$
  // ---------------------------------------------------------------------------

  describe('deleteColumn$', () => {
    it('should dispatch deleteColumnSuccess (service handles batch delete of tasks + column)', (done: DoneFn) => {
      mockBoardService.deleteColumn.and.returnValue(Promise.resolve());

      actions$.next(BoardActions.deleteColumn({ projectId: 'proj-1', columnId: 'col-1' }));

      effects.deleteColumn$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.deleteColumnSuccess.type);
        expect((action as any).columnId).toBe('col-1');
        done();
      });
    });

    it('should call boardService.deleteColumn which deletes all tasks in column first', (done: DoneFn) => {
      mockBoardService.deleteColumn.and.returnValue(Promise.resolve());

      actions$.next(BoardActions.deleteColumn({ projectId: 'proj-1', columnId: 'col-1' }));

      effects.deleteColumn$.subscribe(() => {
        expect(mockBoardService.deleteColumn).toHaveBeenCalledWith('proj-1', 'col-1');
        done();
      });
    });

    it('should dispatch deleteColumnFailure on error', (done: DoneFn) => {
      mockBoardService.deleteColumn.and.returnValue(Promise.reject({ message: 'Delete col failed' }));

      actions$.next(BoardActions.deleteColumn({ projectId: 'proj-1', columnId: 'col-1' }));

      effects.deleteColumn$.subscribe((action) => {
        expect(action.type).toBe(BoardActions.deleteColumnFailure.type);
        expect((action as any).error).toBe('Delete col failed');
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // notifyTaskAssigned$ (dispatch: false)
  // ---------------------------------------------------------------------------

  describe('notifyTaskAssigned$', () => {
    it('should call notificationsService.createNotification when task is assigned to another user', () => {
      const assignedTask: Task = {
        ...mockTasks[0],
        id: 'task-assigned',
        assigneeId: 'other-user',
      };

      actions$.next(BoardActions.addTaskSuccess({ task: assignedTask }));

      effects.notifyTaskAssigned$.subscribe();
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        'other-user',
        jasmine.objectContaining({
          userId: 'other-user',
          type: 'task_assigned',
          title: 'New task assigned',
        })
      );
    });

    it('should NOT notify when task is assigned to the current user', () => {
      const selfAssigned: Task = {
        ...mockTasks[0],
        id: 'task-self',
        assigneeId: 'current-user',
      };

      actions$.next(BoardActions.addTaskSuccess({ task: selfAssigned }));

      effects.notifyTaskAssigned$.subscribe();
      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
    });
  });
});
