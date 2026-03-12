/**
 * Task — represents a single work item on the Kanban board.
 *
 * Tasks belong to a project and live within a column.
 * The 'order' field determines vertical position within the column.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  columnId: string;        // which board column this task belongs to
  assigneeId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;       // timestamp in milliseconds
  updatedAt: number;
  deadline: string | null; // ISO date string or null
  order: number;           // sort position within the column
  labels: string[];        // e.g. ['bug', 'frontend']
  subtasks: Subtask[];
}

/** Priority levels — determines visual badge color */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** Task lifecycle statuses */
export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'done';

/** A checklist item within a task */
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

/** Priority display config for consistent styling */
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low:      { label: 'Low',      color: '#10b981' },
  medium:   { label: 'Medium',   color: '#f59e0b' },
  high:     { label: 'High',     color: '#ef4444' },
  critical: { label: 'Critical', color: '#7c3aed' },
};
