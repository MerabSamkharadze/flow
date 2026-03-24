/**
 * TimeEntry — represents a time log entry for a task.
 *
 * Stored in Firestore at: projects/{projectId}/tasks/{taskId}/timeEntries/{id}
 */
export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  hours: number;
  minutes: number;
  description: string;
  loggedAt: number; // timestamp in milliseconds
}
