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
  issueType: IssueType;    // task, bug, story, or epic
  createdAt: number;       // timestamp in milliseconds
  updatedAt: number;
  deadline: string | null;   // ISO date string or null
  startDate: string | null;  // ISO date string for timeline start (optional)
  completedAt: number | null; // timestamp when task was marked 'done'
  order: number;             // sort position within the column
  estimatedHours: number | null; // estimated time in hours (for time tracking)
  labels: string[];        // e.g. ['bug', 'frontend']
  subtasks: Subtask[];
}

/** Priority levels — determines visual badge color */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** Task lifecycle statuses */
export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'done';

/** Issue type — categorizes the kind of work item */
export type IssueType = 'task' | 'bug' | 'story' | 'epic';

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

/** Issue type display config — icon, label, and color for each type */
export const ISSUE_TYPE_CONFIG: Record<IssueType, { icon: string; label: string; color: string }> = {
  task:  { icon: '\u2713', label: 'Task',  color: '#0052CC' },
  bug:   { icon: '\uD83D\uDC1B', label: 'Bug',   color: '#FF5630' },
  story: { icon: '\uD83D\uDD16', label: 'Story', color: '#36B37E' },
  epic:  { icon: '\u26A1', label: 'Epic',  color: '#6554C0' },
};
