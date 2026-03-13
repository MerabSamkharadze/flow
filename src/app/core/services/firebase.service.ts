import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

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
    private auth: AngularFireAuth
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
}
