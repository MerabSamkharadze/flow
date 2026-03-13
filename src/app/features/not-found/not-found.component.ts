import { Component } from '@angular/core';

/**
 * NotFoundComponent — 404 page.
 *
 * Displayed for any unmatched route via the wildcard '**' route.
 * Provides a link back to the dashboard.
 */
@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent {}
