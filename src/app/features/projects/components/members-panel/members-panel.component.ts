import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Member, INVITE_ROLES, REMOVE_ROLES, ROLE_CHANGE_ROLES, MemberRole } from '../../../../shared/models/member.model';

/**
 * MembersPanelComponent — displays the project members list.
 *
 * Shows each member with their avatar, name, email, and role badge.
 * Conditionally shows management actions (invite, remove, change role)
 * based on the current user's project-level role.
 *
 * Role-based visibility:
 *   - "Invite Member" button: visible to admin and manager
 *   - "Remove" button per member: visible to admin and manager (cannot remove self)
 *   - "Change Role" dropdown: visible to admin only
 */
@Component({
  selector: 'app-members-panel',
  templateUrl: './members-panel.component.html',
  styleUrls: ['./members-panel.component.scss'],
})
export class MembersPanelComponent {
  /** List of project members to display */
  @Input() members: Member[] = [];

  /** The current user's role within this project */
  @Input() currentUserRole: MemberRole = 'member';

  /** The current user's ID — used to prevent self-removal */
  @Input() currentUserId = '';

  /** Emits when user clicks "Invite Member" */
  @Output() openInviteModal = new EventEmitter<void>();

  /** Emits when user clicks "Remove" on a member */
  @Output() removeMember = new EventEmitter<string>(); // userId

  /** Emits when user changes a member's role */
  @Output() changeRole = new EventEmitter<{ userId: string; newRole: MemberRole }>();

  /** Whether current user can invite new members (admin or manager) */
  get canInvite(): boolean {
    return INVITE_ROLES.includes(this.currentUserRole);
  }

  /** Whether current user can remove members (admin or manager) */
  get canRemove(): boolean {
    return REMOVE_ROLES.includes(this.currentUserRole);
  }

  /** Whether current user can change roles (admin only) */
  get canChangeRole(): boolean {
    return ROLE_CHANGE_ROLES.includes(this.currentUserRole);
  }

  onInvite(): void {
    this.openInviteModal.emit();
  }

  onRemove(userId: string): void {
    this.removeMember.emit(userId);
  }

  onRoleChange(userId: string, newRole: MemberRole): void {
    this.changeRole.emit({ userId, newRole });
  }
}
