import { Pipe, PipeTransform } from '@angular/core';

/**
 * TimeAgoPipe — transforms a timestamp (ms) into a human-readable relative string.
 *
 * Usage: {{ timestamp | timeAgo }}
 *
 * Pure pipe — recalculates only when the input value changes.
 * For continuously updating "just now" / "2m ago" displays,
 * the parent can use a periodic change-detection trigger.
 */
@Pipe({
  name: 'timeAgo',
  pure: true,
  standalone: false,
})
export class TimeAgoPipe implements PipeTransform {
  transform(timestamp: number | null | undefined): string {
    if (!timestamp) return '';

    const now = Date.now();
    const diffMs = now - timestamp;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    const currentYear = new Date(now).getFullYear();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== currentYear ? 'numeric' : undefined,
    });
  }
}
