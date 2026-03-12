import { Component, Input, Output, EventEmitter } from '@angular/core';

/** Shape of a navigation item */
interface NavItem {
  label: string;
  icon: string;
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

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '\u2302', route: '/dashboard' },
    { label: 'Projects', icon: '\u{1F4C1}', route: '/projects' },
    { label: 'My Tasks', icon: '\u2713', route: '/tasks' },
    { label: 'Team', icon: '\u{1F465}', route: '/team' },
    { label: 'Settings', icon: '\u2699', route: '/settings' },
  ];

  onToggle(): void {
    this.toggleSidebar.emit();
  }
}
