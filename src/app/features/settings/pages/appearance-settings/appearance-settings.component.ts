import { Component, OnInit } from '@angular/core';

/** Supported theme options */
type Theme = 'light' | 'dark' | 'system';

/** Supported density options */
type Density = 'comfortable' | 'compact';

/**
 * AppearanceSettingsComponent — theme and density preferences.
 *
 * Saves selections to localStorage and applies theme class to document.body.
 * Note: Dark mode CSS variables are not yet implemented — this stores the
 * user's selection in localStorage and applies a body class for future use.
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

  /** Current density selection */
  density: Density = 'comfortable';

  /** Theme options for the card grid */
  themes: { value: Theme; label: string; colors: string[] }[] = [
    { value: 'light', label: 'Light', colors: ['#ffffff', '#f9fafb', '#4f46e5'] },
    { value: 'dark', label: 'Dark', colors: ['#111827', '#1f2937', '#818cf8'] },
    { value: 'system', label: 'System', colors: ['#ffffff', '#111827', '#4f46e5'] },
  ];

  /** Density options */
  densities: { value: Density; label: string; description: string }[] = [
    { value: 'comfortable', label: 'Comfortable', description: 'More whitespace, relaxed layout' },
    { value: 'compact', label: 'Compact', description: 'Denser layout, more content visible' },
  ];

  trackByTheme(_index: number, t: { value: Theme }): string {
    return t.value;
  }

  trackByDensity(_index: number, d: { value: Density }): string {
    return d.value;
  }

  ngOnInit(): void {
    // Load saved preferences from localStorage
    this.theme = (localStorage.getItem('flow-theme') as Theme) || 'light';
    this.density = (localStorage.getItem('flow-density') as Density) || 'comfortable';
    this.applyTheme(this.theme);
  }

  /** Handle theme card selection */
  onThemeChange(theme: Theme): void {
    this.theme = theme;
    localStorage.setItem('flow-theme', theme);
    this.applyTheme(theme);
  }

  /** Handle density card selection */
  onDensityChange(density: Density): void {
    this.density = density;
    localStorage.setItem('flow-density', density);
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
