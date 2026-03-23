import { TaskPriority, IssueType } from '../../../shared/models/task.model';

/**
 * BoardFilters — filter criteria applied to board tasks.
 *
 * Used by the board-filters component and stored in NgRx state.
 * The kanban-view combines these filters with the task map
 * to produce a filtered view without modifying the underlying data.
 */
export interface BoardFilters {
  search: string;                // free-text search on task title
  priority: TaskPriority[];      // filter by one or more priority levels
  assigneeId: string | null;     // filter by assignee (null = show all)
  issueType: IssueType[];        // filter by one or more issue types
  labels: string[];              // filter by one or more labels (ANY match)
}

/** Default empty filters — shows all tasks */
export const EMPTY_FILTERS: BoardFilters = {
  search: '',
  priority: [],
  assigneeId: null,
  issueType: [],
  labels: [],
};
