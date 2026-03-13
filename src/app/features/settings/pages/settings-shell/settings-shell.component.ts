import { Component } from '@angular/core';

/**
 * SettingsShellComponent — layout wrapper for the settings feature.
 *
 * Renders a left tab navigation + right content area (<router-outlet>).
 * Each tab links to a child route (profile, account, appearance, notifications).
 */
@Component({
  standalone: false,
  selector: 'app-settings-shell',
  templateUrl: './settings-shell.component.html',
  styleUrls: ['./settings-shell.component.scss'],
})
export class SettingsShellComponent {
  trackByRoute(_index: number, tab: { route: string }): string {
    return tab.route;
  }

  /** Navigation tabs for the settings sidebar */
  tabs = [
    { label: 'Profile', route: 'profile', icon: 'user' },
    { label: 'Account', route: 'account', icon: 'shield' },
    { label: 'Appearance', route: 'appearance', icon: 'palette' },
    { label: 'Notifications', route: 'notifications', icon: 'bell' },
  ];
}
