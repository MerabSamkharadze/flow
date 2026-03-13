import { Component, OnInit } from '@angular/core';

/** Supported theme options */
type Theme = 'light' | 'dark' | 'system';

/**
 * AppearanceSettingsComponent — theme preferences.
 *
 * Saves selection to localStorage and applies theme class to document.body.
 */
@Component({
  standalone: false,
  selector: 'app-appearance-settings',
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.scss'],
})
export class AppearanceSettingsComponent implements OnInit {
  /** Current theme selection */
  theme: Theme = 'light';

  /** Theme options for the card grid */
  themes: { value: Theme; label: string; colors: string[] }[] = [
    { value: 'light', label: 'Light', colors: ['#ffffff', '#f9fafb', '#4f46e5'] },
    { value: 'dark', label: 'Dark', colors: ['#111827', '#1f2937', '#818cf8'] },
    { value: 'system', label: 'System', colors: ['#ffffff', '#111827', '#4f46e5'] },
  ];

  trackByTheme(_index: number, t: { value: Theme }): string {
    return t.value;
  }

  ngOnInit(): void {
    // Load saved preferences from localStorage
    this.theme = (localStorage.getItem('flow-theme') as Theme) || 'light';
    this.applyTheme(this.theme);
  }

  /** Handle theme card selection */
  onThemeChange(theme: Theme): void {
    this.theme = theme;
    localStorage.setItem('flow-theme', theme);
    this.applyTheme(theme);
  }

  /** Apply theme class to document.body */
  private applyTheme(theme: Theme): void {
    document.body.classList.remove('theme-light', 'theme-dark');

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      document.body.classList.add(`theme-${theme}`);
    }
  }
}
