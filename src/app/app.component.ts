import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { loadUser } from './features/auth/store/auth.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private store: Store) {}

  ngOnInit(): void {
    // Restore Firebase session on app start / page refresh
    this.store.dispatch(loadUser());
  }
}
