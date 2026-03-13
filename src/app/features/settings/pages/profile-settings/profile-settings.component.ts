import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { selectUser, AuthUser } from '../../../auth/store';
import { FirebaseService } from '../../../../core/services/firebase.service';

/**
 * ProfileSettingsComponent — edit user profile information.
 *
 * Loads current user from auth store, provides a reactive form
 * for displayName, bio, and avatar, and saves changes via FirebaseService.
 */
@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
})
export class ProfileSettingsComponent implements OnInit, OnDestroy {
  /** Reactive form for profile fields */
  form!: FormGroup;

  /** Current user data */
  user: AuthUser | null = null;

  /** UI state */
  saving = false;
  successMessage = '';
  errorMessage = '';

  /** Bio max character limit */
  readonly bioMaxLength = 160;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      displayName: ['', [Validators.required, Validators.maxLength(50)]],
      email: [{ value: '', disabled: true }],
      bio: ['', [Validators.maxLength(this.bioMaxLength)]],
      avatarUrl: [''],
    });

    // Load current user from auth store
    this.store
      .select(selectUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
        if (user) {
          this.form.patchValue({
            displayName: user.displayName || '',
            email: user.email || '',
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Get the initials for the avatar fallback */
  get initials(): string {
    const name = this.user?.displayName || this.user?.email || 'U';
    return name.charAt(0).toUpperCase();
  }

  /** Current bio character count */
  get bioLength(): number {
    return (this.form.get('bio')?.value || '').length;
  }

  /** Save profile changes via Firebase */
  async onSave(): Promise<void> {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const { displayName, avatarUrl } = this.form.getRawValue();
      await this.firebaseService.updateProfile(displayName, avatarUrl || undefined);
      this.successMessage = 'Profile updated successfully.';
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to update profile.';
    } finally {
      this.saving = false;
    }
  }
}
