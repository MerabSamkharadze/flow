import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comment } from '../../../shared/models/comment.model';

/**
 * CommentsService — Firestore CRUD for task comments.
 *
 * Collection path: projects/{projectId}/tasks/{taskId}/comments
 */
@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  constructor(private firestore: AngularFirestore) {}

  private commentsPath(projectId: string, taskId: string): string {
    return `projects/${projectId}/tasks/${taskId}/comments`;
  }

  /**
   * Get comments for a task as a real-time ordered stream.
   */
  getComments(projectId: string, taskId: string): Observable<Comment[]> {
    return this.firestore
      .collection<Comment>(this.commentsPath(projectId, taskId), (ref) =>
        ref.orderBy('createdAt', 'asc')
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id, taskId };
          })
        )
      );
  }

  /**
   * Add a new comment. Returns the created comment with Firestore ID.
   */
  async addComment(
    projectId: string,
    taskId: string,
    authorId: string,
    authorName: string,
    authorAvatar: string | null,
    content: string
  ): Promise<Comment> {
    const comment: Omit<Comment, 'id'> = {
      taskId,
      authorId,
      authorName,
      authorAvatar,
      content,
      createdAt: Date.now(),
      updatedAt: null,
    };

    const docRef = await this.firestore
      .collection(this.commentsPath(projectId, taskId))
      .add(comment);

    return { ...comment, id: docRef.id } as Comment;
  }

  /**
   * Edit an existing comment's content.
   */
  async editComment(
    projectId: string,
    taskId: string,
    commentId: string,
    content: string
  ): Promise<void> {
    await this.firestore
      .doc(`${this.commentsPath(projectId, taskId)}/${commentId}`)
      .update({ content, updatedAt: Date.now() });
  }

  /**
   * Delete a comment.
   */
  async deleteComment(
    projectId: string,
    taskId: string,
    commentId: string
  ): Promise<void> {
    await this.firestore
      .doc(`${this.commentsPath(projectId, taskId)}/${commentId}`)
      .delete();
  }
}
