import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Task, TaskStatus } from '../../../shared/models/task.model';
import { Subtask } from '../../../shared/models/subtask.model';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { Project } from '../../../shared/models/project.model';

/**
 * TasksService — Firestore operations for the My Tasks feature.
 *
 * Queries tasks assigned to a user across all projects,
 * manages task status updates, and handles subtask CRUD.
 *
 * Collection paths:
 *   - projects/{projectId}/tasks
 *   - projects/{projectId}/tasks/{taskId}/subtasks
 */
@Injectable({
  providedIn: 'root',
})
export class TasksService {
  constructor(private firestore: AngularFirestore) {}

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------

  /**
   * Get all projects the user is a member of.
   * Used for filter dropdown and project name lookup.
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

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  /**
   * Get all tasks assigned to a user across all their projects.
   * Returns a combined real-time observable that updates whenever
   * any project's tasks change.
   */
  getMyTasks(userId: string): Observable<Task[]> {
    return this.getUserProjects(userId).pipe(
      switchMap((projects) => {
        if (projects.length === 0) return of([]);

        // Create a real-time stream for each project's tasks assigned to the user
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

        // Merge all project task streams into one flat array
        return combineLatest(taskStreams).pipe(
          map((taskArrays) => taskArrays.reduce((acc, tasks) => [...acc, ...tasks], []))
        );
      })
    );
  }

  /**
   * Get ALL tasks for a specific project as a real-time Observable.
   * Unlike getMyTasks, this is NOT filtered by assigneeId.
   * Used by the Calendar view to show all project tasks.
   */
  getAllProjectTasks(projectId: string): Observable<Task[]> {
    return this.firestore
      .collection<Task>(`projects/${projectId}/tasks`, (ref) =>
        ref.orderBy('order', 'asc')
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id, projectId };
          })
        )
      );
  }

  /**
   * Update a task's status in Firestore.
   */
  async updateTaskStatus(
    projectId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/tasks/${taskId}`)
      .update({ status, updatedAt: Date.now() });
  }

  // ---------------------------------------------------------------------------
  // Subtasks
  // ---------------------------------------------------------------------------

  /**
   * Get subtasks for a specific task as a real-time observable.
   * Subtasks are stored as a subcollection under the task document.
   */
  getSubtasks(projectId: string, taskId: string): Observable<Subtask[]> {
    return this.firestore
      .collection<Subtask>(
        `projects/${projectId}/tasks/${taskId}/subtasks`,
        (ref) => ref.orderBy('createdAt', 'asc')
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
   * Add a new subtask to a task.
   * Returns the created subtask with its generated Firestore ID.
   */
  async addSubtask(projectId: string, taskId: string, title: string): Promise<Subtask> {
    const subtask: Omit<Subtask, 'id'> = {
      taskId,
      title,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
    };

    const docRef = await this.firestore
      .collection(`projects/${projectId}/tasks/${taskId}/subtasks`)
      .add(subtask);

    return { ...subtask, id: docRef.id } as Subtask;
  }

  /**
   * Toggle a subtask's completed state.
   * Sets completedAt to now when completed, null when uncompleted.
   */
  async toggleSubtask(
    projectId: string,
    taskId: string,
    subtaskId: string,
    completed: boolean
  ): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`)
      .update({
        completed,
        completedAt: completed ? Date.now() : null,
      });
  }

  /**
   * Delete a subtask from a task.
   */
  async deleteSubtask(
    projectId: string,
    taskId: string,
    subtaskId: string
  ): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`)
      .delete();
  }

  // ---------------------------------------------------------------------------
  // Time Entries
  // ---------------------------------------------------------------------------

  /**
   * Get time entries for a task as a real-time observable.
   */
  getTimeEntries(projectId: string, taskId: string): Observable<TimeEntry[]> {
    return this.firestore
      .collection<TimeEntry>(
        `projects/${projectId}/tasks/${taskId}/timeEntries`,
        (ref) => ref.orderBy('loggedAt', 'desc')
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
   * Log time for a task. Returns the created entry with Firestore ID.
   */
  async logTime(
    projectId: string,
    taskId: string,
    entry: Omit<TimeEntry, 'id'>
  ): Promise<TimeEntry> {
    const docRef = await this.firestore
      .collection(`projects/${projectId}/tasks/${taskId}/timeEntries`)
      .add(entry);
    return { ...entry, id: docRef.id } as TimeEntry;
  }

  /**
   * Delete a time entry.
   */
  async deleteTimeEntry(
    projectId: string,
    taskId: string,
    entryId: string
  ): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/tasks/${taskId}/timeEntries/${entryId}`)
      .delete();
  }
}
