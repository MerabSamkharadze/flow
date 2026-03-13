import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as AuthActions from '../../store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../store';

/**
 * LoginComponent — user sign-in page.
 *
 * Dispatches NgRx login action on submit.
 * Loading and error states are driven by the store.
 */
@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Bind store observables for the template
    this.loading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  /** Convenience getter for template validation access */
  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.store.dispatch(AuthActions.login({ email, password }));
  }

  /** Navigate to the register page */
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
