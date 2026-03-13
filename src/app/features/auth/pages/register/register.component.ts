import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as AuthActions from '../../store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../store';

/**
 * RegisterComponent — new account sign-up page.
 *
 * Dispatches NgRx register action on submit.
 * Includes a password strength indicator (weak/medium/strong).
 * Loading and error states are driven by the store.
 */
@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: RegisterComponent.passwordsMatch }
    );

    this.loading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  /** Custom validator — ensures password and confirmPassword fields match */
  static passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');

    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  /** Convenience getter for template validation access */
  get f() {
    return this.registerForm.controls;
  }

  /**
   * Password strength classification:
   *   - weak: < 6 chars
   *   - medium: 6-10 chars without special characters
   *   - strong: 10+ chars OR has a special character
   */
  get passwordStrength(): 'weak' | 'medium' | 'strong' {
    const value: string = this.f['password']?.value || '';
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (value.length < 6) return 'weak';
    if (value.length >= 10 || hasSpecial) return 'strong';
    return 'medium';
  }

  /** Strength bar fill percentage */
  get strengthPercent(): number {
    switch (this.passwordStrength) {
      case 'weak': return 33;
      case 'medium': return 66;
      case 'strong': return 100;
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.value;
    this.store.dispatch(AuthActions.register({ name, email, password }));
  }

  /** Navigate to the login page */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
