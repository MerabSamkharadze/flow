import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';

import * as ProjectsActions from '../../store/projects.actions';

/**
 * ProjectSettingsComponent — project configuration page.
 *
 * Placeholder for project settings (rename, archive, manage members, etc.).
 * Includes a Danger Zone with a delete project button guarded by a confirm dialog.
 */
@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss'],
})
export class ProjectSettingsComponent implements OnInit {
  projectId = '';

  /** Whether the delete confirmation dialog is visible */
  showDeleteConfirm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  /** Show the delete confirmation dialog */
  onDeleteProject(): void {
    this.showDeleteConfirm = true;
  }

  /** User confirmed project deletion */
  onConfirmDelete(): void {
    this.store.dispatch(ProjectsActions.deleteProject({ projectId: this.projectId }));
    this.showDeleteConfirm = false;
  }

  /** User cancelled project deletion */
  onCancelDelete(): void {
    this.showDeleteConfirm = false;
  }
}
