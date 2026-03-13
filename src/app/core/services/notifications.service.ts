import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppNotification } from '../../shared/models/notification.model';

/**
 * NotificationsService — Firestore CRUD for user notifications.
 *
 * Collection path: users/{userId}/notifications
 *
 * Provides real-time streams for the notification feed and unread count,
 * plus methods for marking notifications as read.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(private firestore: AngularFirestore) {}

  /** Firestore collection path for a user's notifications */
  private notificationsPath(userId: string): string {
    return `users/${userId}/notifications`;
  }

  /**
   * Get notifications as a real-time stream, ordered by createdAt desc, limit 50.
   * Uses snapshotChanges() to include the Firestore document ID.
   */
  getNotifications(userId: string): Observable<AppNotification[]> {
    return this.firestore
      .collection<Omit<AppNotification, 'id'>>(
        this.notificationsPath(userId),
        (ref) => ref.orderBy('createdAt', 'desc').limit(50)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id } as AppNotification;
          })
        )
      );
  }

  /**
   * Get the count of unread notifications as a real-time stream.
   * Derived from getNotifications to avoid a separate Firestore query.
   */
  getUnreadCount(userId: string): Observable<number> {
    return this.getNotifications(userId).pipe(
      map((notifications) => notifications.filter((n) => !n.read).length)
    );
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.firestore
      .doc(`${this.notificationsPath(userId)}/${notificationId}`)
      .update({ read: true });
  }

  /**
   * Mark all unread notifications as read using a batch write.
   */
  async markAllAsRead(userId: string): Promise<void> {
    const snapshot = await this.firestore
      .collection(this.notificationsPath(userId), (ref) =>
        ref.where('read', '==', false)
      )
      .get()
      .toPromise();

    if (!snapshot || snapshot.empty) return;

    const batch = this.firestore.firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }

  /**
   * Create a new notification for a user.
   * Used by other services when triggering notification-worthy events.
   */
  async createNotification(
    userId: string,
    notification: Omit<AppNotification, 'id'>
  ): Promise<void> {
    await this.firestore
      .collection(this.notificationsPath(userId))
      .add(notification);
  }
}
