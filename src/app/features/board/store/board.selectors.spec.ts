import * as fromSelectors from './board.selectors';
import { BoardState } from './board.reducer';
import { Task } from '../../../shared/models/task.model';
import { Column } from '../../../shared/models/column.model';
import { BoardFilters } from '../models/board-filters.model';

describe('Board Selectors', () => {
  const mockColumns: Column[] = [
    { id: 'col-1', name: 'To Do', projectId: 'proj-1', order: 0, color: '#ccc', taskLimit: null },
    { id: 'col-2', name: 'In Progress', projectId: 'proj-1', order: 1, color: '#0af', taskLimit: 5 },
    { id: 'col-3', name: 'Done', projectId: 'proj-1', order: 2, color: '#0f0', taskLimit: null },
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-1', title: 'Build login', description: '', projectId: 'proj-1',
      columnId: 'col-1', assigneeId: 'user-1', priority: 'high', status: 'todo', issueType: 'task',
      createdAt: 1000, updatedAt: 2000, deadline: null, startDate: null, completedAt: null, order: 0, labels: [], subtasks: [],
    },
    {
      id: 'task-2', title: 'Build signup', description: '', projectId: 'proj-1',
      columnId: 'col-1', assigneeId: 'user-2', priority: 'medium', status: 'todo', issueType: 'task',
      createdAt: 1100, updatedAt: 2100, deadline: null, startDate: null, completedAt: null, order: 1, labels: [], subtasks: [],
    },
    {
      id: 'task-3', title: 'API integration', description: '', projectId: 'proj-1',
      columnId: 'col-2', assigneeId: 'user-1', priority: 'critical', status: 'in-progress', issueType: 'task',
      createdAt: 1200, updatedAt: 2200, deadline: null, startDate: null, completedAt: null, order: 0, labels: [], subtasks: [],
    },
    {
      id: 'task-4', title: 'Deploy v1', description: '', projectId: 'proj-1',
      columnId: 'col-3', assigneeId: null, priority: 'low', status: 'done', issueType: 'task',
      createdAt: 1300, updatedAt: 2300, deadline: null, startDate: null, completedAt: null, order: 0, labels: [], subtasks: [],
    },
  ];

  const mockTasksMap: { [columnId: string]: Task[] } = {
    'col-1': [mockTasks[0], mockTasks[1]],
    'col-2': [mockTasks[2]],
    'col-3': [mockTasks[3]],
  };

  const mockState: BoardState = {
    columns: mockColumns,
    tasks: mockTasksMap,
    activeTaskId: 'task-1',
    filters: { search: '', priority: [], assigneeId: '', issueType: [], labels: [] },
    loading: false,
    error: null,
    previousTasks: null,
  };

  // ---------------------------------------------------------------------------
  // selectColumns
  // ---------------------------------------------------------------------------

  describe('selectColumns', () => {
    it('should return the columns array', () => {
      const result = fromSelectors.selectColumns.projector(mockState);
      expect(result).toEqual(mockColumns);
      expect(result.length).toBe(3);
    });

    it('should return empty array when state is undefined', () => {
      const result = fromSelectors.selectColumns.projector(undefined as any);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // selectAllTasks (flat array)
  // ---------------------------------------------------------------------------

  describe('selectAllTasks', () => {
    it('should return all tasks as a flat array', () => {
      const result = fromSelectors.selectAllTasks.projector(mockTasksMap);
      expect(result.length).toBe(4);
      expect(result.map((t: Task) => t.id)).toContain('task-1');
      expect(result.map((t: Task) => t.id)).toContain('task-4');
    });

    it('should return empty array when tasks map is empty', () => {
      const result = fromSelectors.selectAllTasks.projector({});
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // selectTasksByColumn (factory selector)
  // ---------------------------------------------------------------------------

  describe('selectTasksByColumn', () => {
    it('should return tasks for a specific column', () => {
      const selector = fromSelectors.selectTasksByColumn('col-1');
      const result = selector.projector(mockTasksMap);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('task-1');
      expect(result[1].id).toBe('task-2');
    });

    it('should return empty array for a non-existent column', () => {
      const selector = fromSelectors.selectTasksByColumn('col-999');
      const result = selector.projector(mockTasksMap);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // selectBoardLoading
  // ---------------------------------------------------------------------------

  describe('selectBoardLoading', () => {
    it('should return false when not loading', () => {
      const result = fromSelectors.selectBoardLoading.projector(mockState);
      expect(result).toBe(false);
    });

    it('should return true when loading', () => {
      const loadingState = { ...mockState, loading: true };
      const result = fromSelectors.selectBoardLoading.projector(loadingState);
      expect(result).toBe(true);
    });

    it('should return false when state is undefined', () => {
      const result = fromSelectors.selectBoardLoading.projector(undefined as any);
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // selectBoardError
  // ---------------------------------------------------------------------------

  describe('selectBoardError', () => {
    it('should return null when no error', () => {
      const result = fromSelectors.selectBoardError.projector(mockState);
      expect(result).toBeNull();
    });

    it('should return error message when present', () => {
      const errorState = { ...mockState, error: 'Something failed' };
      const result = fromSelectors.selectBoardError.projector(errorState);
      expect(result).toBe('Something failed');
    });
  });

  // ---------------------------------------------------------------------------
  // selectActiveTaskId / selectActiveTask
  // ---------------------------------------------------------------------------

  describe('selectActiveTaskId', () => {
    it('should return the active task ID', () => {
      const result = fromSelectors.selectActiveTaskId.projector(mockState);
      expect(result).toBe('task-1');
    });

    it('should return null when no active task', () => {
      const noActive = { ...mockState, activeTaskId: null };
      const result = fromSelectors.selectActiveTaskId.projector(noActive);
      expect(result).toBeNull();
    });
  });

  describe('selectActiveTask', () => {
    it('should return the active task object', () => {
      const result = fromSelectors.selectActiveTask.projector(mockTasksMap, 'task-1');
      expect(result).toBeTruthy();
      expect(result!.id).toBe('task-1');
      expect(result!.title).toBe('Build login');
    });

    it('should return null when activeId is null', () => {
      const result = fromSelectors.selectActiveTask.projector(mockTasksMap, null);
      expect(result).toBeNull();
    });

    it('should return null when active task not found', () => {
      const result = fromSelectors.selectActiveTask.projector(mockTasksMap, 'non-existent');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // selectBoardFilters
  // ---------------------------------------------------------------------------

  describe('selectBoardFilters', () => {
    it('should return the current filters', () => {
      const result = fromSelectors.selectBoardFilters.projector(mockState);
      expect(result).toEqual({ search: '', priority: [], assigneeId: '', issueType: [], labels: [] });
    });
  });

  // ---------------------------------------------------------------------------
  // selectFilteredTasksMap
  // ---------------------------------------------------------------------------

  describe('selectFilteredTasksMap', () => {
    it('should return all tasks when no filters are active', () => {
      const emptyFilters: BoardFilters = { search: '', priority: [], assigneeId: '', issueType: [], labels: [] };
      const result = fromSelectors.selectFilteredTasksMap.projector(mockTasksMap, emptyFilters);
      expect(result['col-1'].length).toBe(2);
      expect(result['col-2'].length).toBe(1);
      expect(result['col-3'].length).toBe(1);
    });

    it('should filter by search term (case-insensitive)', () => {
      const filters: BoardFilters = { search: 'build', priority: [], assigneeId: '', issueType: [], labels: [] };
      const result = fromSelectors.selectFilteredTasksMap.projector(mockTasksMap, filters);
      expect(result['col-1'].length).toBe(2); // "Build login" and "Build signup"
      expect(result['col-2'].length).toBe(0); // "API integration" filtered out
      expect(result['col-3'].length).toBe(0); // "Deploy v1" filtered out
    });

    it('should filter by priority', () => {
      const filters: BoardFilters = { search: '', priority: ['high', 'critical'], assigneeId: '', issueType: [], labels: [] };
      const result = fromSelectors.selectFilteredTasksMap.projector(mockTasksMap, filters);
      expect(result['col-1'].length).toBe(1); // task-1 is high
      expect(result['col-2'].length).toBe(1); // task-3 is critical
      expect(result['col-3'].length).toBe(0); // task-4 is low
    });

    it('should filter by assigneeId (partial match)', () => {
      const filters: BoardFilters = { search: '', priority: [], assigneeId: 'user-1', issueType: [], labels: [] };
      const result = fromSelectors.selectFilteredTasksMap.projector(mockTasksMap, filters);
      expect(result['col-1'].length).toBe(1); // task-1 assigned to user-1
      expect(result['col-2'].length).toBe(1); // task-3 assigned to user-1
      expect(result['col-3'].length).toBe(0); // task-4 has no assignee
    });

    it('should combine multiple filters (AND logic)', () => {
      const filters: BoardFilters = { search: 'build', priority: ['high'], assigneeId: '', issueType: [], labels: [] };
      const result = fromSelectors.selectFilteredTasksMap.projector(mockTasksMap, filters);
      expect(result['col-1'].length).toBe(1); // Only "Build login" is high priority
    });
  });

  // ---------------------------------------------------------------------------
  // selectFilteredTasksByColumn
  // ---------------------------------------------------------------------------

  describe('selectFilteredTasksByColumn', () => {
    it('should return filtered tasks for a specific column', () => {
      const filteredMap = { 'col-1': [mockTasks[0]], 'col-2': [], 'col-3': [] };
      const selector = fromSelectors.selectFilteredTasksByColumn('col-1');
      const result = selector.projector(filteredMap);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('task-1');
    });
  });

  // ---------------------------------------------------------------------------
  // selectFilteredAllTasks
  // ---------------------------------------------------------------------------

  describe('selectFilteredAllTasks', () => {
    it('should return all filtered tasks as a flat array', () => {
      const filteredMap = {
        'col-1': [mockTasks[0]],
        'col-2': [mockTasks[2]],
        'col-3': [],
      };
      const result = fromSelectors.selectFilteredAllTasks.projector(filteredMap);
      expect(result.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // selectTasksMap
  // ---------------------------------------------------------------------------

  describe('selectTasksMap', () => {
    it('should return the tasks dictionary', () => {
      const result = fromSelectors.selectTasksMap.projector(mockState);
      expect(result).toEqual(mockTasksMap);
    });

    it('should return empty object when state is undefined', () => {
      const result = fromSelectors.selectTasksMap.projector(undefined as any);
      expect(result).toEqual({});
    });
  });
});
