import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { FirebaseService } from '../../../../core/services/firebase.service';

/**
 * AccountSettingsComponent — change password and account danger zone.
 *
 * Provides a change-password form with reauthentication,
 * and a danger zone section with a disabled delete-account button.
 */
@Component({
  standalone: false,
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
})
export class AccountSettingsComponent {
  /** Change password form */
  form: FormGroup;

  /** UI state */
  saving = false;
  successMessage = '';
  errorMessage = '';

  /** Password visibility toggles */
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: AccountSettingsComponent.passwordsMatch }
    );
  }

  /** Custom validator: newPassword and confirmPassword must match */
  static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const newPw = group.get('newPassword')?.value;
    const confirmPw = group.get('confirmPassword')?.value;
    return newPw === confirmPw ? null : { passwordMismatch: true };
  }

  /** Whether the confirm field shows a mismatch error */
  get passwordMismatch(): boolean {
    return (
      this.form.hasError('passwordMismatch') &&
      this.form.get('confirmPassword')!.touched
    );
  }

  /** Toggle password field visibility */
  toggleVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
    else if (field === 'new') this.showNewPassword = !this.showNewPassword;
    else this.showConfirmPassword = !this.showConfirmPassword;
  }

  /** Reauthenticate and update password via Firebase */
  async onChangePassword(): Promise<void> {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const { currentPassword, newPassword } = this.form.value;
      await this.firebaseService.changePassword(currentPassword, newPassword);
      this.successMessage = 'Password updated successfully.';
      this.form.reset();
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to update password.';
    } finally {
      this.saving = false;
    }
  }
}
