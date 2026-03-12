import { Component } from '@angular/core';

/**
 * LayoutComponent — main application shell.
 *
 * Provides the two-column layout structure:
 *   - Left: Sidebar navigation (app-sidebar)
 *   - Right: Header bar (app-header) + routed content area (router-outlet)
 *
 * All authenticated pages render inside this layout.
 */
@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  /** Controls sidebar collapsed/expanded state */
  isSidebarCollapsed = false;

  /** Toggle sidebar between collapsed and expanded */
  onToggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
