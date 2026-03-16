/**
 * TeamMember — represents a user who shares at least one project
 * with the current user.
 *
 * Aggregated from project membership data and user profiles.
 * The role reflects their highest role across shared projects.
 */
export interface TeamMember {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  projects: string[];                        // project names they share with you
  role: 'admin' | 'manager' | 'member';      // highest role across shared projects
}
