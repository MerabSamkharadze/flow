import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '../../../../shared/models/project.model';

/**
 * ProjectDetailComponent — shows full details of a single project.
 *
 * Displays project name, description, members, progress bar,
 * and provides navigation to the project board and settings.
 */
@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  projectId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';

    // Mock data — will be replaced with NgRx store selector
    this.project = {
      id: this.projectId,
      name: 'Website Redesign',
      description:
        'Complete overhaul of the company website with new branding, improved UX, and performance optimization. The project includes redesigning all landing pages, updating the design system, and migrating to a new CMS.',
      color: '#4f46e5',
      ownerId: 'user1',
      memberIds: ['user1', 'user2', 'user3', 'user4', 'user5'],
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now(),
      deadline: '2026-05-01',
      status: 'active',
    };
  }

  /** Navigate to the Kanban board (will be implemented later) */
  onOpenBoard(): void {
    // TODO: navigate to /projects/:id/board
    console.log('Open board for project:', this.projectId);
  }

  onGoToSettings(): void {
    this.router.navigate(['/projects', this.projectId, 'settings']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects']);
  }
}
