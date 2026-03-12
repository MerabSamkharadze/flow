import { Component, Output, EventEmitter } from '@angular/core';

/**
 * HeaderComponent — top navigation bar.
 *
 * Contains the sidebar toggle (hamburger), page breadcrumbs placeholder,
 * and user actions area (search, notifications, profile).
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  /** Emits when user clicks the sidebar toggle (hamburger icon) */
  @Output() toggleSidebar = new EventEmitter<void>();

  onMenuToggle(): void {
    this.toggleSidebar.emit();
  }
}
