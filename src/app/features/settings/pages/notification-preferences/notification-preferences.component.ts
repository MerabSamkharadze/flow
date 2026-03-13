import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { selectUser } from '../../../auth/store';

/** Notification preference keys */
interface NotificationPrefs {
  taskAssigned: boolean;
  commentAdded: boolean;
  memberAdded: boolean;
  taskUpdated: boolean;
}

/**
 * NotificationPreferencesComponent — toggle notification types on/off.
 *
 * Loads preferences from Firestore users/{uid}/preferences/notifications,
 * and auto-saves on each toggle (no save button needed).
 */
@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.scss'],
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
  /** Current notification preferences */
  prefs: NotificationPrefs = {
    taskAssigned: true,
    commentAdded: true,
    memberAdded: true,
    taskUpdated: true,
  };

  /** Toggle row definitions */
  toggleRows: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    { key: 'taskAssigned', label: 'Task assigned to me', description: 'Get notified when someone assigns a task to you.' },
    { key: 'commentAdded', label: 'New comment on my task', description: 'Get notified when someone comments on a task you own.' },
    { key: 'memberAdded', label: 'Added to a project', description: 'Get notified when you are added as a member to a project.' },
    { key: 'taskUpdated', label: 'Task status updated', description: 'Get notified when a task you are assigned to changes status.' },
  ];

  trackByKey(_index: number, row: { key: string }): string {
    return row.key;
  }

  /** Loading state */
  loading = true;

  /** Current user ID */
  private userId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private firestore: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.userId = user.uid;
          this.loadPreferences(user.uid);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Toggle a notification preference and auto-save */
  onToggle(key: keyof NotificationPrefs): void {
    this.prefs[key] = !this.prefs[key];
    this.savePreferences();
  }

  /** Load preferences from Firestore */
  private async loadPreferences(userId: string): Promise<void> {
    try {
      const doc = await this.firestore
        .doc(`users/${userId}/preferences/notifications`)
        .get()
        .toPromise();

      if (doc?.exists) {
        const data = doc.data() as Partial<NotificationPrefs>;
        this.prefs = { ...this.prefs, ...data };
      }
    } catch {
      // Silently use defaults if Firestore load fails
    } finally {
      this.loading = false;
    }
  }

  /** Save preferences to Firestore */
  private async savePreferences(): Promise<void> {
    if (!this.userId) return;
    try {
      await this.firestore
        .doc(`users/${this.userId}/preferences/notifications`)
        .set(this.prefs);
    } catch {
      // Silently fail — preferences are non-critical
    }
  }
}
