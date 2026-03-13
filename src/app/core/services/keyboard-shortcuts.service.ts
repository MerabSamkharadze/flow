import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/**
 * KeyboardShortcutsService — global keyboard shortcuts.
 *
 * Two-key "G then X" navigation pattern:
 *   G → D = Dashboard
 *   G → P = Projects
 *   G → T = My Tasks
 *   G → N = Notifications
 *
 * Single-key:
 *   Escape = close any open modal (dispatches a custom event)
 *
 * Ignores keystrokes when the user is typing in an input, textarea, or
 * contenteditable element to avoid hijacking form input.
 */
@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutsService implements OnDestroy {
  /** Whether "G" was pressed as the first key of a two-key combo */
  private gPressed = false;
  private gTimeout: ReturnType<typeof setTimeout> | null = null;

  private boundHandler = this.onKeyDown.bind(this);

  constructor(private router: Router) {}

  /** Start listening for keyboard events */
  initialize(): void {
    document.addEventListener('keydown', this.boundHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.boundHandler);
    if (this.gTimeout) clearTimeout(this.gTimeout);
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Ignore when user is typing in form fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = event.key.toLowerCase();

    // Escape — broadcast modal close
    if (key === 'escape') {
      document.dispatchEvent(new CustomEvent('keyboard:escape'));
      return;
    }

    // First key: G starts the combo
    if (!this.gPressed && key === 'g' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.gPressed = true;
      // Reset after 1 second if no second key
      this.gTimeout = setTimeout(() => (this.gPressed = false), 1000);
      return;
    }

    // Second key: navigate
    if (this.gPressed) {
      this.gPressed = false;
      if (this.gTimeout) clearTimeout(this.gTimeout);

      switch (key) {
        case 'd':
          this.router.navigate(['/dashboard']);
          break;
        case 'p':
          this.router.navigate(['/projects']);
          break;
        case 't':
          this.router.navigate(['/tasks']);
          break;
        case 'n':
          this.router.navigate(['/notifications']);
          break;
      }
    }
  }
}
