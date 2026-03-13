import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * ConfirmDialogComponent — reusable confirmation modal.
 *
 * Renders a centered modal overlay with a title, message,
 * and confirm/cancel buttons. Supports danger, warning, and default variants.
 *
 * @Input title — dialog heading
 * @Input message — dialog body text
 * @Input confirmLabel — text on the confirm button
 * @Input cancelLabel — text on the cancel button
 * @Input variant — visual style ('danger' | 'warning' | 'default')
 * @Output confirmed — fires when user clicks confirm
 * @Output cancelled — fires when user clicks cancel or overlay
 */
@Component({
  standalone: false,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  @Input() title = 'Are you sure?';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() variant: 'danger' | 'warning' | 'default' = 'default';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  /** Close when clicking the overlay backdrop */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
