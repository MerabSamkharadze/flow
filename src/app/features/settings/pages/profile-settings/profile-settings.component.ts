import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { selectUser, AuthUser, updateUserPhoto } from '../../../auth/store';
import { FirebaseService } from '../../../../core/services/firebase.service';

/**
 * ProfileSettingsComponent — edit user profile information.
 *
 * Loads current user from auth store, provides a reactive form
 * for displayName, bio, and avatar, and saves changes via FirebaseService.
 */
@Component({
  standalone: false,
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
})
export class ProfileSettingsComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  /** Reactive form for profile fields */
  form!: FormGroup;

  /** Current user data */
  user: AuthUser | null = null;

  /** UI state */
  saving = false;
  successMessage = '';
  errorMessage = '';

  /** Photo upload state */
  uploading = false;
  uploadProgress = 0;
  uploadError = '';
  previewUrl: string | null = null;

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

  /** Current avatar URL (preview takes precedence) */
  get avatarUrl(): string | null {
    return this.previewUrl || this.user?.photoURL || null;
  }

  /** Current bio character count */
  get bioLength(): number {
    return (this.form.get('bio')?.value || '').length;
  }

  /** Trigger file input click */
  onChangePhotoClick(): void {
    this.fileInput.nativeElement.click();
  }

  /** Handle file selection */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Reset state
    this.uploadError = '';
    this.successMessage = '';

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      this.uploadError = 'File size exceeds 2MB limit.';
      input.value = '';
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.uploadError = 'Invalid file type. Allowed: JPEG, PNG, WebP.';
      input.value = '';
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Start upload
    this.uploading = true;
    this.uploadProgress = 0;

    try {
      this.firebaseService.uploadProfilePhoto(this.user!.uid, file).subscribe({
        next: (value) => {
          if (typeof value === 'number') {
            this.uploadProgress = value;
          } else {
            // value is the download URL
            this.previewUrl = null; // clear preview, use real URL
            this.store.dispatch(updateUserPhoto({ photoURL: value }));
            this.uploading = false;
            this.successMessage = 'Photo uploaded successfully.';
          }
        },
        error: (err) => {
          this.uploading = false;
          this.previewUrl = null;
          this.uploadError = err.message || 'Failed to upload photo.';
        },
      });
    } catch (err: any) {
      this.uploading = false;
      this.previewUrl = null;
      this.uploadError = err.message || 'Failed to upload photo.';
    }

    // Reset input so same file can be re-selected
    input.value = '';
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
