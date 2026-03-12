/**
 * Project — core data model for the FLOW platform.
 *
 * Represents a project entity stored in Firestore.
 * Used across project list, detail, form, and card components.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;           // hex color for the project accent, e.g. '#4f46e5'
  ownerId: string;         // uid of the project creator
  memberIds: string[];     // uids of all project members
  createdAt: number;       // timestamp in milliseconds
  updatedAt: number;       // timestamp in milliseconds
  deadline: string | null; // ISO date string, e.g. '2026-04-15', or null if none
  status: ProjectStatus;
}

/** Possible project lifecycle statuses */
export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived';

/** Preset color palette for project creation */
export const PROJECT_COLORS: string[] = [
  '#4f46e5', // indigo
  '#0ea5e9', // sky blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
];
