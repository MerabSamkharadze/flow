import { Component } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';
import { Observable } from 'rxjs';

/**
 * ToastContainerComponent — renders the stack of active toasts.
 *
 * Positioned fixed at the bottom-right of the viewport.
 * Each toast slides in and auto-dismisses after its duration.
 */
@Component({
  standalone: false,
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent {
  toasts$: Observable<Toast[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  /** Manually dismiss a toast */
  onDismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  /** TrackBy for ngFor performance */
  trackById(_index: number, toast: Toast): number {
    return toast.id;
  }
}
