import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Column } from '../../../shared/models/column.model';
import { Task } from '../../../shared/models/task.model';

/**
 * BoardService — Firestore CRUD for board columns and tasks.
 *
 * Collection paths:
 *   - projects/{projectId}/columns  — board columns
 *   - projects/{projectId}/tasks    — task cards
 *
 * Read methods return real-time Observables (Firestore snapshots).
 * Mutation methods return Promises consumed by NgRx effects.
 */
@Injectable({
  providedIn: 'root',
})
export class BoardService {
  constructor(private firestore: AngularFirestore) {}

  // ---------------------------------------------------------------------------
  // Columns — projects/{projectId}/columns
  // ---------------------------------------------------------------------------

  /** Get all columns for a project as a real-time Observable, sorted by order */
  getColumns(projectId: string): Observable<Column[]> {
    return this.firestore
      .collection<Column>(`projects/${projectId}/columns`, (ref) =>
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

  /** Add a new column to the project */
  async addColumn(projectId: string, column: Omit<Column, 'id'>): Promise<Column> {
    const docRef = await this.firestore
      .collection(`projects/${projectId}/columns`)
      .add({ name: column.name, order: column.order, color: column.color, taskLimit: column.taskLimit });

    return { ...column, id: docRef.id } as Column;
  }

  /** Update an existing column (partial update) */
  async updateColumn(
    projectId: string,
    columnId: string,
    changes: Partial<Column>
  ): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/columns/${columnId}`)
      .update(changes);
  }

  /** Delete a column */
  async deleteColumn(projectId: string, columnId: string): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/columns/${columnId}`)
      .delete();
  }

  // ---------------------------------------------------------------------------
  // Tasks — projects/{projectId}/tasks
  // ---------------------------------------------------------------------------

  /** Get all tasks for a project as a real-time Observable, sorted by order */
  getTasks(projectId: string): Observable<Task[]> {
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

  /** Add a new task to the project */
  async addTask(projectId: string, task: Omit<Task, 'id'>): Promise<Task> {
    const docRef = await this.firestore
      .collection(`projects/${projectId}/tasks`)
      .add({
        title: task.title,
        description: task.description,
        columnId: task.columnId,
        assigneeId: task.assigneeId,
        priority: task.priority,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        deadline: task.deadline,
        order: task.order,
        labels: task.labels,
        subtasks: task.subtasks,
      });

    return { ...task, id: docRef.id } as Task;
  }

  /** Update an existing task (partial update) */
  async updateTask(
    projectId: string,
    taskId: string,
    changes: Partial<Task>
  ): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/tasks/${taskId}`)
      .update({ ...changes, updatedAt: Date.now() });
  }

  /** Delete a task */
  async deleteTask(projectId: string, taskId: string): Promise<void> {
    await this.firestore
      .doc(`projects/${projectId}/tasks/${taskId}`)
      .delete();
  }

  // ---------------------------------------------------------------------------
  // Move task — batch update for drag & drop
  // ---------------------------------------------------------------------------

  /**
   * Moves a task to a new column and/or order position.
   * Uses a Firestore batch to atomically update:
   *   1. The moved task's columnId and order
   *   2. The order of all affected tasks in both source and target columns
   */
  async moveTask(
    projectId: string,
    taskId: string,
    toColumnId: string,
    newOrder: number,
    affectedTasks: { id: string; order: number; columnId: string }[]
  ): Promise<void> {
    const batch = this.firestore.firestore.batch();
    const tasksPath = `projects/${projectId}/tasks`;

    // Update the moved task's columnId and order
    const taskRef = this.firestore.firestore.doc(`${tasksPath}/${taskId}`);
    batch.update(taskRef, {
      columnId: toColumnId,
      order: newOrder,
      updatedAt: Date.now(),
    });

    // Update order for all other affected tasks in both columns
    for (const affected of affectedTasks) {
      if (affected.id === taskId) continue; // already handled above
      const ref = this.firestore.firestore.doc(`${tasksPath}/${affected.id}`);
      batch.update(ref, { order: affected.order });
    }

    await batch.commit();
  }
}
