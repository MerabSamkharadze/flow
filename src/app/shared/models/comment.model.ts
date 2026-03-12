/**
 * Comment — a user comment on a task.
 *
 * Stored as a Firestore subcollection:
 *   projects/{projectId}/tasks/{taskId}/comments/{commentId}
 */
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  createdAt: number;       // timestamp in milliseconds
  updatedAt: number | null; // timestamp when last edited
}
