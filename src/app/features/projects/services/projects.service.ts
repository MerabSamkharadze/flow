import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../../../shared/models/project.model';
import { Member, MemberRole } from '../../../shared/models/member.model';

/**
 * ProjectsService — Firestore CRUD operations for the projects collection.
 *
 * Collection path: projects
 * (can be extended to workspaces/{workspaceId}/projects for multi-tenancy)
 *
 * Each method returns an Observable (for queries) or a Promise (for mutations)
 * that the NgRx effects will consume.
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly collectionPath = 'projects';

  constructor(private firestore: AngularFirestore) {}

  /**
   * Get all projects as a real-time Observable.
   * Firestore snapshots are mapped to Project[] with document IDs.
   */
  getProjects(): Observable<Project[]> {
    return this.firestore
      .collection<Project>(this.collectionPath, (ref) =>
        ref.orderBy('updatedAt', 'desc')
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
   * Get a single project by ID as a real-time Observable.
   */
  getProject(projectId: string): Observable<Project> {
    return this.firestore
      .doc<Project>(`${this.collectionPath}/${projectId}`)
      .snapshotChanges()
      .pipe(
        map((action) => {
          const data = action.payload.data()!;
          const id = action.payload.id;
          return { ...data, id };
        })
      );
  }

  /**
   * Create a new project document.
   * Returns the created project with its generated Firestore ID.
   */
  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    const docRef = await this.firestore
      .collection(this.collectionPath)
      .add(project);

    return { ...project, id: docRef.id } as Project;
  }

  /**
   * Update an existing project document (partial update).
   */
  async updateProject(
    projectId: string,
    changes: Partial<Project>
  ): Promise<void> {
    await this.firestore
      .doc(`${this.collectionPath}/${projectId}`)
      .update(changes);
  }

  /**
   * Delete a project document.
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.firestore
      .doc(`${this.collectionPath}/${projectId}`)
      .delete();
  }

  // ---------------------------------------------------------------------------
  // Members — stored as a subcollection: projects/{projectId}/members/{userId}
  // ---------------------------------------------------------------------------

  /**
   * Get all members of a project as a real-time Observable.
   */
  getMembers(projectId: string): Observable<Member[]> {
    return this.firestore
      .collection<Member>(`${this.collectionPath}/${projectId}/members`)
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data();
            return { ...data, userId: a.payload.doc.id };
          })
        )
      );
  }

  /**
   * Add a member to a project.
   * Uses the userId as the document ID for easy lookup.
   * Also adds the userId to the project's memberIds array.
   */
  async addMember(projectId: string, member: Member): Promise<void> {
    const batch = this.firestore.firestore.batch();

    // Add member document to subcollection
    const memberRef = this.firestore.firestore
      .collection(`${this.collectionPath}/${projectId}/members`)
      .doc(member.userId);
    batch.set(memberRef, member);

    // Add userId to the project's memberIds array
    const projectRef = this.firestore.firestore
      .collection(this.collectionPath)
      .doc(projectId);
    batch.update(projectRef, {
      memberIds: firebase.firestore.FieldValue.arrayUnion(member.userId),
      updatedAt: Date.now(),
    });

    await batch.commit();
  }

  /**
   * Remove a member from a project.
   * Deletes the member document and removes userId from memberIds array.
   */
  async removeMember(projectId: string, userId: string): Promise<void> {
    const batch = this.firestore.firestore.batch();

    // Remove member document
    const memberRef = this.firestore.firestore
      .collection(`${this.collectionPath}/${projectId}/members`)
      .doc(userId);
    batch.delete(memberRef);

    // Remove userId from the project's memberIds array
    const projectRef = this.firestore.firestore
      .collection(this.collectionPath)
      .doc(projectId);
    batch.update(projectRef, {
      memberIds: firebase.firestore.FieldValue.arrayRemove(userId),
      updatedAt: Date.now(),
    });

    await batch.commit();
  }

  /**
   * Update a member's role within a project.
   */
  async updateMemberRole(
    projectId: string,
    userId: string,
    newRole: MemberRole
  ): Promise<void> {
    await this.firestore
      .doc(`${this.collectionPath}/${projectId}/members/${userId}`)
      .update({ role: newRole });
  }
}
