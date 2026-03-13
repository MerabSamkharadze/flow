import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * EmptyStateComponent — reusable empty/zero-data state.
 *
 * Displays an icon, title, subtitle, and optional action button.
 *
 * @Input icon — which SVG icon to show ('tasks' | 'projects' | 'notifications' | 'search')
 * @Input title — main heading text
 * @Input subtitle — secondary description text
 * @Input actionLabel — text for the CTA button (hidden if empty)
 * @Output actionClicked — fires when the CTA button is clicked
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() icon: 'tasks' | 'projects' | 'notifications' | 'search' = 'tasks';
  @Input() title = 'Nothing here yet';
  @Input() subtitle = '';
  @Input() actionLabel = '';

  @Output() actionClicked = new EventEmitter<void>();

  onAction(): void {
    this.actionClicked.emit();
  }
}
