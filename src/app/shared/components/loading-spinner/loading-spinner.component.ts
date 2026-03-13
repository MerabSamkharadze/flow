import { Component, Input } from '@angular/core';

/**
 * LoadingSpinnerComponent — reusable CSS spinner.
 *
 * @Input size — diameter of the spinner ('sm' | 'md' | 'lg')
 * @Input overlay — when true, renders a centered overlay backdrop
 * @Input message — optional loading text displayed below the spinner
 */
@Component({
  standalone: false,
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() overlay = false;
  @Input() message = '';
}
