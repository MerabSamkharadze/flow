import { Component, Input } from '@angular/core';
import { Project } from '../../../../shared/models/project.model';

/**
 * ProjectCardComponent — displays a single project as a card in the grid.
 *
 * Shows color accent bar, name, description, member avatars,
 * progress indicator, and deadline.
 */
@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss']
})
export class ProjectCardComponent {
  @Input() project!: Project;

  /** Calculate a mock progress percentage based on status */
  get progress(): number {
    switch (this.project.status) {
      case 'completed':
        return 100;
      case 'archived':
        return 100;
      case 'on-hold':
        return 35;
      default:
        return 60; // Placeholder — will be calculated from real task data in Phase 6
    }
  }

  /** Format deadline for display */
  get formattedDeadline(): string | null {
    if (!this.project.deadline) return null;
    return new Date(this.project.deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /** How many member avatars to show before "+N" */
  get visibleMembers(): string[] {
    return this.project.memberIds.slice(0, 3);
  }

  get remainingMemberCount(): number {
    return Math.max(0, this.project.memberIds.length - 3);
  }

  trackByMemberId(_index: number, memberId: string): string {
    return memberId;
  }
}
