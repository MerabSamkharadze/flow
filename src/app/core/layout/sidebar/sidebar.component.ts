import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * SidebarComponent — left-side navigation panel.
 *
 * Displays the app logo, main navigation links, and a collapse toggle.
 * Navigation items are defined locally for now; they'll later be driven
 * by user permissions / feature flags.
 */

/** Shape of a navigation item */
interface NavItem {
  label: string;
  icon: string;   // placeholder icon name (will be replaced with real icons later)
  route: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  /** Whether the sidebar is in collapsed (icon-only) mode */
  @Input() isCollapsed = false;

  /** Emits when user clicks the collapse/expand toggle */
  @Output() toggleSidebar = new EventEmitter<void>();

  /** Main navigation items */
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Projects', icon: 'folder', route: '/projects' },
    { label: 'My Tasks', icon: 'check_circle', route: '/tasks' },
    { label: 'Team', icon: 'people', route: '/team' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  onToggle(): void {
    this.toggleSidebar.emit();
  }
}
