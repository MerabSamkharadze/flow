import { Pipe, PipeTransform } from '@angular/core';
import { getStatusColor } from '../models/task.model';

/**
 * StatusColorPipe — returns a hex color for any dynamic task status string.
 *
 * Usage: [style.background-color]="task.status | statusColor"
 */
@Pipe({
  name: 'statusColor',
})
export class StatusColorPipe implements PipeTransform {
  transform(status: string): string {
    return getStatusColor(status);
  }
}
