import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * StatsCardComponent — displays a single statistic with icon, value, and label.
 *
 * Used on the dashboard to show project count, active tasks, overdue, and due today.
 * Supports variant-based coloring for contextual emphasis.
 */
@Component({
  standalone: false,
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsCardComponent {
  /** Text label displayed below the value */
  @Input() label = '';

  /** Numeric or string value to display; shows em-dash when null */
  @Input() value: number | string | null = null;

  /** Color variant for contextual emphasis */
  @Input() variant: 'default' | 'warning' | 'danger' | 'success' = 'default';

  /** Icon name — determines which SVG is rendered */
  @Input() icon: 'projects' | 'tasks' | 'overdue' | 'today' = 'projects';

  /** Formatted display value — em-dash when null */
  get displayValue(): string {
    return this.value !== null && this.value !== undefined
      ? String(this.value)
      : '\u2014';
  }
}
