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
  }
}
