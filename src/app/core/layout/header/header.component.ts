import { Component, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';

import { logout } from '../../../features/auth/store/auth.actions';
import { selectUser } from '../../../features/auth/store/auth.selectors';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  user$ = this.store.select(selectUser);

  constructor(private store: Store) {}

  onMenuToggle(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }
}
