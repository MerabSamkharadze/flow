import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Project, ProjectStatus } from '../../../../shared/models/project.model';
import { ProjectTaskCounts } from '../../../projects/store/projects.reducer';
import { selectProjectTaskCounts } from '../../../projects/store/projects.selectors';

/**
 * MyProjectsComponent — sidebar widget showing up to 4 projects
 * with color accent, status badge, and progress indicator.
 */
@Component({
  standalone: false,
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.scss'],
})
export class MyProjectsComponent implements OnInit {
  /** Projects to display (pre-sorted by parent, we show first 4) */
  @Input() projects: Project[] = [];

  taskCounts$!: Observable<{ [projectId: string]: ProjectTaskCounts }>;

  constructor(
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.taskCounts$ = this.store.select(selectProjectTaskCounts);
  }

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

  /** Compute progress percentage from task counts */
  getProgress(projectId: string, counts: { [id: string]: ProjectTaskCounts }): number {
    const c = counts[projectId];
    if (!c || c.total === 0) return 0;
    return Math.round((c.completed / c.total) * 100);
  }
}
