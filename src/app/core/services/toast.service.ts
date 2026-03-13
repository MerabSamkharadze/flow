import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Toast — shape of a single toast notification.
 */
export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
}

/**
 * ToastService — manages a stack of transient toast notifications.
 *
 * Uses a BehaviorSubject so the ToastContainerComponent can subscribe
 * and render the current toast list reactively.
 *
 * Usage:
 *   this.toastService.show('Project created!', 'success');
 *   this.toastService.show('Something went wrong.', 'error', 5000);
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private nextId = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);

  /** Observable stream of active toasts */
  toasts$ = this.toastsSubject.asObservable();

  /**
   * Show a new toast notification.
   * @param message — display text
   * @param type — visual variant
   * @param duration — auto-dismiss time in ms (default 3000)
   */
  show(message: string, type: Toast['type'] = 'info', duration = 3000): void {
    const toast: Toast = { id: ++this.nextId, type, message, duration };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  /** Remove a toast by id */
  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }
}
