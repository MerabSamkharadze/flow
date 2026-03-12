import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * ProjectSettingsComponent — project configuration page.
 *
 * Placeholder for project settings (rename, archive, manage members, etc.).
 * Will be expanded as features are added.
 */
@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss'],
})
export class ProjectSettingsComponent implements OnInit {
  projectId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}
