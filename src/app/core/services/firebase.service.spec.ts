import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { of } from 'rxjs';

import { FirebaseService } from './firebase.service';

describe('FirebaseService', () => {
  let service: FirebaseService;

  // --- Firestore mocks ---
  const mockSnapshotChanges = jasmine.createSpy('snapshotChanges').and.returnValue(of([]));
  const mockValueChanges = jasmine.createSpy('valueChanges').and.returnValue(of([]));
  const mockAdd = jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-id' }));
  const mockUpdate = jasmine.createSpy('update').and.returnValue(Promise.resolve());
  const mockDelete = jasmine.createSpy('delete').and.returnValue(Promise.resolve());
  const mockSet = jasmine.createSpy('set').and.returnValue(Promise.resolve());

  const mockCollectionRef = {
    snapshotChanges: mockSnapshotChanges,
    valueChanges: mockValueChanges,
    add: mockAdd,
  };

  const mockDocRef = {
    valueChanges: jasmine.createSpy('docValueChanges').and.returnValue(of(null)),
    update: mockUpdate,
    delete: mockDelete,
    set: mockSet,
  };

  const mockFirestore = {
    collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef),
    doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
  };

  // --- Auth mocks ---
  const mockAuthState = of(null);
  const mockSignIn = jasmine.createSpy('signIn').and.returnValue(
    Promise.resolve({ user: { uid: 'uid1', email: 'a@b.com' } })
  );
  const mockSignUp = jasmine.createSpy('signUp').and.returnValue(
    Promise.resolve({ user: { uid: 'uid2', email: 'c@d.com' } })
  );
  const mockSignOut = jasmine.createSpy('signOut').and.returnValue(Promise.resolve());

  const mockAuth = {
    authState: mockAuthState,
    signInWithEmailAndPassword: mockSignIn,
    createUserWithEmailAndPassword: mockSignUp,
    signOut: mockSignOut,
    currentUser: Promise.resolve(null),
  };

  // --- Storage mock ---
  const mockStorage = {
    ref: jasmine.createSpy('ref').and.returnValue({}),
    upload: jasmine.createSpy('upload').and.returnValue({
      percentageChanges: () => of(100),
      snapshotChanges: () => of(null),
    }),
  };

  beforeEach(() => {
    // Reset spies
    mockFirestore.collection.calls.reset();
    mockFirestore.doc.calls.reset();
    mockAdd.calls.reset();
    mockUpdate.calls.reset();
    mockDelete.calls.reset();
    mockSet.calls.reset();
    mockSnapshotChanges.calls.reset();
    mockValueChanges.calls.reset();
    mockSignIn.calls.reset();
    mockSignUp.calls.reset();
    mockSignOut.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        FirebaseService,
        { provide: AngularFirestore, useValue: mockFirestore },
        { provide: AngularFireAuth, useValue: mockAuth },
        { provide: AngularFireStorage, useValue: mockStorage },
      ],
    });

    service = TestBed.inject(FirebaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Firestore helpers
  // -----------------------------------------------------------------------

  describe('getCollection()', () => {
    it('should call firestore.collection with the given path', () => {
      service.getCollection('projects');
      expect(mockFirestore.collection).toHaveBeenCalledWith('projects');
    });

    it('should return the collection reference', () => {
      const result = service.getCollection('projects');
      expect(result).toBe(mockCollectionRef as any);
    });
  });

  describe('getDocument()', () => {
    it('should call firestore.doc with the given path', () => {
      service.getDocument('projects/abc');
      expect(mockFirestore.doc).toHaveBeenCalledWith('projects/abc');
    });

    it('should return the document reference', () => {
      const result = service.getDocument('projects/abc');
      expect(result).toBe(mockDocRef as any);
    });
  });

  // -----------------------------------------------------------------------
  // Auth helpers
  // -----------------------------------------------------------------------

  describe('currentUser$', () => {
    it('should return the auth state observable', () => {
      expect(service.currentUser$).toBe(mockAuthState);
    });
  });

  describe('signIn()', () => {
    it('should call signInWithEmailAndPassword with email and password', async () => {
      await service.signIn('test@test.com', 'password123');
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
    });

    it('should return the credential result', async () => {
      const result = await service.signIn('test@test.com', 'password123');
      expect(result.user!.uid).toBe('uid1');
    });
  });

  describe('signUp()', () => {
    it('should call createUserWithEmailAndPassword with email and password', async () => {
      await service.signUp('new@test.com', 'pass456');
      expect(mockSignUp).toHaveBeenCalledWith('new@test.com', 'pass456');
    });

    it('should return the credential result', async () => {
      const result = await service.signUp('new@test.com', 'pass456');
      expect(result.user!.uid).toBe('uid2');
    });
  });

  describe('signOut()', () => {
    it('should call auth signOut', async () => {
      await service.signOut();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Profile photo upload — validation
  // -----------------------------------------------------------------------

  describe('uploadProfilePhoto()', () => {
    it('should throw when file exceeds 2MB', () => {
      const bigFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', {
        type: 'image/jpeg',
      });
      expect(() => service.uploadProfilePhoto('uid1', bigFile)).toThrowError(
        'File size exceeds 2MB limit.'
      );
    });

    it('should throw for invalid file type', () => {
      const textFile = new File(['hello'], 'file.txt', { type: 'text/plain' });
      expect(() => service.uploadProfilePhoto('uid1', textFile)).toThrowError(
        'Invalid file type. Allowed: JPEG, PNG, WebP.'
      );
    });
  });
});
