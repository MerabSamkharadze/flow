/**
 * Member — represents a user's membership in a specific project.
 *
 * Stored as a subcollection or embedded in the project document.
 * The role here is project-scoped (not the global app role).
 *
 * Role hierarchy:
 *   admin   — full control: manage members, delete project, change settings
 *   manager — can invite/remove members, manage tasks
 *   member  — can view project, create/update own tasks
 */
export interface Member {
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  joinedAt: number;       // timestamp in milliseconds
  avatarUrl: string | null;
}

/** Project-level roles (distinct from the global AuthUser.role) */
export type MemberRole = 'admin' | 'manager' | 'member';

/** Roles allowed to invite new members */
export const INVITE_ROLES: MemberRole[] = ['admin', 'manager'];

/** Roles allowed to remove members */
export const REMOVE_ROLES: MemberRole[] = ['admin', 'manager'];

/** Roles allowed to change another member's role */
export const ROLE_CHANGE_ROLES: MemberRole[] = ['admin'];
