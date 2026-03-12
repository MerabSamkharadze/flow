import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MemberRole } from '../../../../shared/models/member.model';

/**
 * Payload emitted when an invite is submitted.
 */
export interface InvitePayload {
  email: string;
  role: MemberRole;
}

/**
 * InviteModalComponent — modal dialog to invite a new member to the project.
 *
 * Contains a form with:
 *   - Email input (required, must be valid email)
 *   - Role selector (manager or member — admin cannot be assigned via invite)
 *
 * Emits the invite payload to the parent, which dispatches the NgRx action.
 */
@Component({
  selector: 'app-invite-modal',
  templateUrl: './invite-modal.component.html',
  styleUrls: ['./invite-modal.component.scss']
})
export class InviteModalComponent {
  /** Emits the invite data when form is submitted */
  @Output() inviteMember = new EventEmitter<InvitePayload>();

  /** Emits when the modal should close */
  @Output() closeModal = new EventEmitter<void>();

  inviteForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['member' as MemberRole, [Validators.required]],
    });
  }

  get f() {
    return this.inviteForm.controls;
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, role } = this.inviteForm.value;
    this.inviteMember.emit({ email, role });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  /** Close modal when clicking on the overlay backdrop */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('invite-modal')) {
      this.onClose();
    }
  }
}
