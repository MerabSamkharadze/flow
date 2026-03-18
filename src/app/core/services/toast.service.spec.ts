import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
  });

  // -----------------------------------------------------------------------
  // show()
  // -----------------------------------------------------------------------

  it('should add a toast to toasts$ observable', () => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('Hello', 'info');

    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('info');
  });

  it('should assign unique ids to each toast', () => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('First');
    service.show('Second');

    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('should default type to info and duration to 3000', () => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('Test');

    expect(toasts[0].type).toBe('info');
    expect(toasts[0].duration).toBe(3000);
  });

  it('should auto-remove toast after duration', fakeAsync(() => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('Bye', 'info', 2000);
    expect(toasts.length).toBe(1);

    tick(2000);
    expect(toasts.length).toBe(0);
  }));

  it('should not auto-remove toast when duration is 0', fakeAsync(() => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('Sticky', 'info', 0);
    tick(10000);

    expect(toasts.length).toBe(1);
  }));

  // -----------------------------------------------------------------------
  // dismiss()
  // -----------------------------------------------------------------------

  it('should remove a specific toast by id', () => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('A', 'info', 0);
    service.show('B', 'info', 0);
    const idToRemove = toasts[0].id;

    service.dismiss(idToRemove);

    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('B');
  });

  it('should do nothing when dismissing non-existent id', () => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('A', 'info', 0);
    service.dismiss(99999);

    expect(toasts.length).toBe(1);
  });

  // -----------------------------------------------------------------------
  // Shorthands: success(), error(), info()
  // -----------------------------------------------------------------------

  it('success() should call show with type success', () => {
    spyOn(service, 'show').and.callThrough();
    service.success('Done');
    expect(service.show).toHaveBeenCalledWith('Done', 'success', 3000);
  });

  it('error() should call show with type error and 5000ms default', () => {
    spyOn(service, 'show').and.callThrough();
    service.error('Fail');
    expect(service.show).toHaveBeenCalledWith('Fail', 'error', 5000);
  });

  it('info() should call show with type info', () => {
    spyOn(service, 'show').and.callThrough();
    service.info('Note');
    expect(service.show).toHaveBeenCalledWith('Note', 'info', 3000);
  });

  it('success() should accept custom duration', () => {
    spyOn(service, 'show').and.callThrough();
    service.success('Quick', 1000);
    expect(service.show).toHaveBeenCalledWith('Quick', 'success', 1000);
  });

  // -----------------------------------------------------------------------
  // Max 5 stack limit
  // -----------------------------------------------------------------------

  it('should keep only the last 5 toasts when more are added', () => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    for (let i = 0; i < 7; i++) {
      service.show(`Toast ${i}`, 'info', 0);
    }

    expect(toasts.length).toBe(5);
    expect(toasts[0].message).toBe('Toast 2');
    expect(toasts[4].message).toBe('Toast 6');
  });

  // -----------------------------------------------------------------------
  // Stacking
  // -----------------------------------------------------------------------

  it('should stack multiple toasts in order', () => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t));

    service.show('First', 'success', 0);
    service.show('Second', 'error', 0);
    service.show('Third', 'warning', 0);

    expect(toasts.length).toBe(3);
    expect(toasts[0].message).toBe('First');
    expect(toasts[1].message).toBe('Second');
    expect(toasts[2].message).toBe('Third');
  });
});
