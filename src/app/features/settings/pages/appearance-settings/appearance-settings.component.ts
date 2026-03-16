import { Component, OnInit, OnDestroy } from '@angular/core';

/** Supported theme options */
type Theme = 'light' | 'dark' | 'system';

/**
 * AppearanceSettingsComponent — theme preferences.
 *
 * Saves selection to localStorage and applies data-theme attribute
 * on the <html> element. System theme listens for OS changes.
 */
@Component({
  standalone: false,
  selector: 'app-appearance-settings',
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.scss'],
})
export class AppearanceSettingsComponent implements OnInit, OnDestroy {
  /** Current theme selection */
  theme: Theme = 'light';

  /** Theme options for the card grid */
  themes: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  private systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private systemThemeListener = (e: MediaQueryListEvent) => this.onSystemThemeChange(e);

  trackByTheme(_index: number, t: { value: Theme }): string {
    return t.value;
  }

  ngOnInit(): void {
    this.theme = (localStorage.getItem('flow-theme') as Theme) || 'light';
    this.applyTheme(this.theme);

    if (this.theme === 'system') {
      this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
    }
  }

  ngOnDestroy(): void {
    this.systemThemeQuery.removeEventListener('change', this.systemThemeListener);
  }

  /** Handle theme card selection */
  onThemeChange(theme: Theme): void {
    // Remove previous system listener
    this.systemThemeQuery.removeEventListener('change', this.systemThemeListener);

    this.theme = theme;
    localStorage.setItem('flow-theme', theme);
    this.applyTheme(theme);

    // Add system listener if needed
    if (theme === 'system') {
      this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
    }
  }

  /** Apply theme via data-theme attribute on <html> */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = this.systemThemeQuery.matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }

  private onSystemThemeChange(e: MediaQueryListEvent): void {
    if (this.theme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  }
}
