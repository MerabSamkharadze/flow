import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Project, ProjectStatus } from '../../../../shared/models/project.model';

/**
 * MyProjectsComponent — sidebar widget showing up to 4 projects
 * with color accent, status badge, and progress indicator.
 */
@Component({
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.scss'],
})
export class MyProjectsComponent {
  /** Projects to display (pre-sorted by parent, we show first 4) */
  @Input() projects: Project[] = [];

  constructor(private router: Router) {}

  /** Navigate to a project's detail page */
  onClick(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  /** Navigate to the project creation page */
  onNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  /** Visible projects — capped at 4 */
  get visibleProjects(): Project[] {
    return this.projects.slice(0, 4);
  }

  /** Format status for display (e.g. 'on-hold' → 'On Hold') */
  formatStatus(status: ProjectStatus): string {
    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  trackByProjectId(_index: number, project: Project): string {
    return project.id;
  }

  /** Compute a mock progress percentage based on project status */
  getProgress(project: Project): number {
    switch (project.status) {
      case 'completed': return 100;
      case 'archived': return 100;
      case 'on-hold': return 35;
      default: return 60; // Placeholder — will use real task data in Phase 6
    }
  }
}
