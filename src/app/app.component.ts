import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { loadUser } from './features/auth/store/auth.actions';
import { KeyboardShortcutsService } from './core/services/keyboard-shortcuts.service';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
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

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('flow-theme') || 'light';
    document.body.classList.remove('theme-light', 'theme-dark');

    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      document.body.classList.add(`theme-${savedTheme}`);
    }
  }
}
