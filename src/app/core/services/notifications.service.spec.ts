import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';

import { NotificationsService } from './notifications.service';
import { AppNotification } from '../../shared/models/notification.model';

describe('NotificationsService', () => {
  let service: NotificationsService;

  // --- Mock data ---
  const mockNotifications: AppNotification[] = [
    {
      id: 'n1', userId: 'user1', type: 'task_assigned',
      title: 'Task assigned', body: 'You were assigned a task.',
      link: '/projects/p1', read: false, createdAt: Date.now(),
      actorName: 'Alice', actorAvatar: null,
    },
    {
      id: 'n2', userId: 'user1', type: 'comment_added',
      title: 'New comment', body: 'Bob commented on your task.',
      link: '/projects/p2', read: true, createdAt: Date.now() - 1000,
      actorName: 'Bob', actorAvatar: null,
    },
    {
      id: 'n3', userId: 'user1', type: 'member_added',
      title: 'Added to project', body: 'Carol added you.',
      link: '/projects/p3', read: false, createdAt: Date.now() - 2000,
      actorName: 'Carol', actorAvatar: null,
    },
  ];

  function buildSnapshotActions(notifications: AppNotification[]) {
    return notifications.map((n) => ({
      payload: {
        doc: {
          id: n.id,
          data: () => {
            const { id: _id, ...rest } = n;
            return rest;
          },
        },
      },
    }));
  }

  // --- Firestore mocks ---
  let mockUpdate: jasmine.Spy;
  let mockAdd: jasmine.Spy;
  let mockSnapshotChanges: jasmine.Spy;
  let mockGet: jasmine.Spy;
  let mockBatchUpdate: jasmine.Spy;
  let mockBatchCommit: jasmine.Spy;
  let mockFirestore: any;

  beforeEach(() => {
    mockUpdate = jasmine.createSpy('update').and.returnValue(Promise.resolve());
    mockAdd = jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-notif' }));
    mockSnapshotChanges = jasmine.createSpy('snapshotChanges').and.returnValue(
      of(buildSnapshotActions(mockNotifications))
    );
    mockGet = jasmine.createSpy('get').and.returnValue(
      of({
        empty: false,
        docs: [{ ref: 'ref-n1' }, { ref: 'ref-n3' }],
      })
    );
    mockBatchUpdate = jasmine.createSpy('batchUpdate');
    mockBatchCommit = jasmine.createSpy('batchCommit').and.returnValue(Promise.resolve());

    const mockCollectionRef = {
      snapshotChanges: mockSnapshotChanges,
      add: mockAdd,
      get: mockGet,
    };

    mockFirestore = {
      collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef),
      doc: jasmine.createSpy('doc').and.returnValue({ update: mockUpdate }),
      firestore: {
        batch: () => ({ update: mockBatchUpdate, commit: mockBatchCommit }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        { provide: AngularFirestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(NotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // getNotifications()
  // -----------------------------------------------------------------------

  describe('getNotifications()', () => {
    it('should return an observable of notifications', (done: DoneFn) => {
      service.getNotifications('user1').subscribe((notifications) => {
        expect(notifications.length).toBe(3);
        expect(notifications[0].id).toBe('n1');
        expect(notifications[0].title).toBe('Task assigned');
        done();
      });
    });

    it('should query the correct Firestore path', () => {
      service.getNotifications('user1').subscribe();
      const path = mockFirestore.collection.calls.mostRecent().args[0];
      expect(path).toBe('users/user1/notifications');
    });

    it('should include document IDs in the result', (done: DoneFn) => {
      service.getNotifications('user1').subscribe((notifications) => {
        expect(notifications[0].id).toBe('n1');
        expect(notifications[1].id).toBe('n2');
        expect(notifications[2].id).toBe('n3');
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getUnreadCount()
  // -----------------------------------------------------------------------

  describe('getUnreadCount()', () => {
    it('should return the count of unread notifications', (done: DoneFn) => {
      service.getUnreadCount('user1').subscribe((count) => {
        expect(count).toBe(2); // n1 and n3 are unread
        done();
      });
    });

    it('should return 0 when all notifications are read', (done: DoneFn) => {
      const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
      mockSnapshotChanges.and.returnValue(of(buildSnapshotActions(allRead)));

      service.getUnreadCount('user1').subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // markAsRead()
  // -----------------------------------------------------------------------

  describe('markAsRead()', () => {
    it('should call Firestore doc update with read: true', async () => {
      await service.markAsRead('user1', 'n1');
      expect(mockFirestore.doc).toHaveBeenCalledWith('users/user1/notifications/n1');
      expect(mockUpdate).toHaveBeenCalledWith({ read: true });
    });
  });

  // -----------------------------------------------------------------------
  // markAllAsRead()
  // -----------------------------------------------------------------------

  describe('markAllAsRead()', () => {
    it('should batch update all unread notifications', async () => {
      await service.markAllAsRead('user1');
      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('should pass each doc ref and read:true to batch update', async () => {
      await service.markAllAsRead('user1');
      expect(mockBatchUpdate).toHaveBeenCalledWith('ref-n1', { read: true });
      expect(mockBatchUpdate).toHaveBeenCalledWith('ref-n3', { read: true });
    });

    it('should not batch commit when no unread notifications exist', async () => {
      mockGet.and.returnValue(of({ empty: true, docs: [] }));
      mockBatchCommit.calls.reset();

      await service.markAllAsRead('user1');
      expect(mockBatchCommit).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // createNotification()
  // -----------------------------------------------------------------------

  describe('createNotification()', () => {
    const notifData: Omit<AppNotification, 'id'> = {
      userId: 'user2', type: 'task_assigned',
      title: 'New task', body: 'You got a task.',
      link: '/projects/p1', read: false, createdAt: Date.now(),
      actorName: 'Dave', actorAvatar: null,
    };

    it('should call Firestore collection add with notification data', async () => {
      await service.createNotification('user2', notifData);
      expect(mockAdd).toHaveBeenCalledWith(notifData);
    });

    it('should use the correct collection path', async () => {
      await service.createNotification('user2', notifData);
      const path = mockFirestore.collection.calls.mostRecent().args[0];
      expect(path).toBe('users/user2/notifications');
    });
  });
});
