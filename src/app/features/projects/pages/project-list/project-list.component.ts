import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Project } from '../../../../shared/models/project.model';
import * as ProjectsActions from '../../store/projects.actions';
import {
  selectAllProjects,
  selectProjectsLoading,
  selectProjectsError,
} from '../../store';

/**
 * ProjectListComponent — displays all projects in a responsive card grid.
 *
 * Connected to the NgRx store:
 *   - Dispatches loadProjects on init to fetch from Firestore
 *   - Uses selectors for projects, loading, and error states
 *   - Shows a loading spinner while data is being fetched
 */
@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  projects$!: Observable<Project[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private store: Store,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Bind store selectors
    this.projects$ = this.store.select(selectAllProjects);
    this.loading$ = this.store.select(selectProjectsLoading);
    this.error$ = this.store.select(selectProjectsError);

    // Dispatch action to load projects from Firestore
    this.store.dispatch(ProjectsActions.loadProjects());
  }

  onNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  /** TrackBy for project cards — improves ngFor performance */
  trackByProjectId(_index: number, project: Project): string {
    return project.id;
  }
}
