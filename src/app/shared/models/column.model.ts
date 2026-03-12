/**
 * Column — represents a board column (e.g. "To Do", "In Progress", "Done").
 *
 * Columns belong to a project and contain tasks.
 * The 'order' field determines horizontal position on the board.
 * Optional 'taskLimit' enforces WIP (Work-In-Progress) limits.
 */
export interface Column {
  id: string;
  name: string;
  projectId: string;
  order: number;           // horizontal sort position on the board
  color: string;           // accent color for the column header
  taskLimit: number | null; // max number of tasks allowed (null = unlimited)
}

/** Default columns created for new projects */
export const DEFAULT_COLUMNS: Omit<Column, 'id' | 'projectId'>[] = [
  { name: 'To Do',        order: 0, color: '#6b7280', taskLimit: null },
  { name: 'In Progress',  order: 1, color: '#3b82f6', taskLimit: 5 },
  { name: 'In Review',    order: 2, color: '#f59e0b', taskLimit: 3 },
  { name: 'Done',         order: 3, color: '#10b981', taskLimit: null },
];
