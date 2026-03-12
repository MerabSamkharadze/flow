/**
 * Subtask — a checklist item within a task, stored as a Firestore subcollection.
 *
 * Path: projects/{projectId}/tasks/{taskId}/subtasks/{subtaskId}
 */
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: number;       // timestamp in milliseconds
  completedAt: number | null; // timestamp when completed, null if not done
}
