import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import { loadUser } from '@features/auth/store';
import { KeyboardShortcutsService } from '@core/services/keyboard-shortcuts.service';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private systemThemeListener = (e: MediaQueryListEvent) => this.onSystemThemeChange(e);

  constructor(
    private store: Store,
    private keyboardShortcuts: KeyboardShortcutsService
  ) {}

  ngOnInit(): void {
    // Restore Firebase session on app start / page refresh
    this.store.dispatch(loadUser());

    // Initialize global keyboard shortcuts (G+D, G+P, G+T, G+N, Escape)
    this.keyboardShortcuts.initialize();

    // Apply saved theme on app startup
    this.initializeTheme();
  }

  ngOnDestroy(): void {
    this.systemThemeQuery.removeEventListener('change', this.systemThemeListener);
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('flow-theme') || 'light';
    this.applyTheme(savedTheme);

    // Listen for OS theme changes when 'system' is selected
    if (savedTheme === 'system') {
      this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
    }
  }

  private applyTheme(theme: string): void {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = this.systemThemeQuery.matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }

  private onSystemThemeChange(e: MediaQueryListEvent): void {
    const savedTheme = localStorage.getItem('flow-theme');
    if (savedTheme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  }
}
