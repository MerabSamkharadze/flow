import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * FirebaseService — centralized access to Firebase backend.
 *
 * Wraps AngularFirestore and AngularFireAuth so that feature modules
 * interact with Firebase through a single service rather than
 * importing AngularFire modules directly everywhere.
 *
 * Provided in 'root' so it's a singleton across the entire app.
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage
  ) {}

  // ---------------------------------------------------------------------------
  // Firestore helpers
  // ---------------------------------------------------------------------------

  /** Get a typed collection reference */
  getCollection<T>(path: string) {
    return this.firestore.collection<T>(path);
  }

  /** Get a typed document reference */
  getDocument<T>(path: string) {
    return this.firestore.doc<T>(path);
  }

  // ---------------------------------------------------------------------------
  // Auth helpers
  // ---------------------------------------------------------------------------

  /** Observable of the currently authenticated user (null if signed out) */
  get currentUser$() {
    return this.auth.authState;
  }

  /** Sign in with email and password */
  signIn(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  /** Create a new account with email and password */
  signUp(email: string, password: string) {
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  /** Sign out the current user */
  signOut() {
    return this.auth.signOut();
  }

  // ---------------------------------------------------------------------------
  // Profile helpers
  // ---------------------------------------------------------------------------

  /**
   * Update the current user's profile (displayName and optional photoURL).
   * Updates both Firebase Auth profile and Firestore users/{uid} document.
   */
  async updateProfile(displayName: string, photoURL?: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user) throw new Error('No authenticated user.');

    // Update Firebase Auth profile
    await user.updateProfile({
      displayName,
      ...(photoURL !== undefined && { photoURL }),
    });

    // Sync to Firestore user document
    await this.firestore.doc(`users/${user.uid}`).set(
      {
        displayName,
        ...(photoURL !== undefined && { photoURL }),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  /**
   * Change the current user's password.
   * Reauthenticates with the current password first, then updates.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user.');

    // Reauthenticate with current password
    const { default: firebase } = await import('firebase/compat/app');
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await user.reauthenticateWithCredential(credential);

    // Update to new password
    await user.updatePassword(newPassword);
  }

  // ---------------------------------------------------------------------------
  // Profile photo upload
  // ---------------------------------------------------------------------------

  /**
   * Upload a profile photo to Firebase Storage.
   *
   * - Validates file size (max 2MB) and type (jpeg, png, webp).
   * - Uploads to `avatars/{userId}/{timestamp}_{filename}`.
   * - After upload, updates Firebase Auth photoURL and Firestore user doc.
   * - Returns Observable that emits upload progress (0-100) then the final download URL.
   */
  uploadProfilePhoto(userId: string, file: File): Observable<number | string> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 2MB limit.');
    }
    // Validate a file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP.');
    }

    const filePath = `avatars/${userId}/${Date.now()}_${file.name}`;
    const ref = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return new Observable<number | string>((observer) => {
      // Emit progress 0-100
      const progressSub = task.percentageChanges().subscribe((pct) => {
        if (pct !== undefined) {
          observer.next(Math.round(pct));
        }
      });

      // On complete, get download URL and update profile
      task.snapshotChanges().pipe(
        switchMap((snapshot) => {
          if (snapshot?.state === 'success') {
            return from(ref.getDownloadURL());
          }
          return new Observable<never>();
        })
      ).subscribe({
        next: async (downloadURL: string) => {
          progressSub.unsubscribe();
          try {
            // Update Firebase Auth + Firestore
            const user = await this.auth.currentUser;
            if (user) {
              await user.updateProfile({ photoURL: downloadURL });
              await this.firestore.doc(`users/${user.uid}`).set(
                { photoURL: downloadURL, avatarUrl: downloadURL, updatedAt: Date.now() },
                { merge: true }
              );
            }
            observer.next(downloadURL);
            observer.complete();
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => {
          progressSub.unsubscribe();
          observer.error(err);
        },
      });
    });
  }
}
