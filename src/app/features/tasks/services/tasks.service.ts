import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Task } from '../../../shared/models/task.model';
import { Project } from '../../../shared/models/project.model';

/**
 * TasksService — fetches tasks assigned to a user across all projects.
 *
 * Queries the projects collection first (filtered by memberIds),
 * then collects tasks from each project's subcollection where
 * assigneeId matches the current user.
 */
@Injectable({
  providedIn: 'root',
})
export class TasksService {
  constructor(private firestore: AngularFirestore) {}

  /**
   * Get all projects the user is a member of.
   */
  getUserProjects(userId: string): Observable<Project[]> {
    return this.firestore
      .collection<Project>('projects', (ref) =>
        ref.where('memberIds', 'array-contains', userId)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        )
      );
  }

  /**
   * Get all tasks assigned to a user across all their projects.
   * Returns a combined observable that updates whenever any project's tasks change.
   */
  getUserTasks(userId: string): Observable<Task[]> {
    return this.getUserProjects(userId).pipe(
      switchMap((projects) => {
        if (projects.length === 0) return of([]);

        // Create an observable for each project's tasks assigned to the user
        const taskStreams = projects.map((project) =>
          this.firestore
            .collection<Task>(`projects/${project.id}/tasks`, (ref) =>
              ref.where('assigneeId', '==', userId)
            )
            .snapshotChanges()
            .pipe(
              map((actions) =>
                actions.map((a) => {
                  const data = a.payload.doc.data();
                  const id = a.payload.doc.id;
                  return { ...data, id, projectId: project.id };
                })
              )
            )
        );

        // Combine all project task streams into one flat array
        return combineLatest(taskStreams).pipe(
          map((taskArrays) => taskArrays.reduce((acc, tasks) => [...acc, ...tasks], []))
        );
      })
    );
  }

  /**
   * Mark a task as done by updating its status in Firestore.
   */
  async markTaskDone(projectId: string, taskId: string): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/tasks/${taskId}`)
      .update({ status: 'done', updatedAt: Date.now() });
  }
}
