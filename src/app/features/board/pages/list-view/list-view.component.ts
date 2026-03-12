import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * ListViewComponent — alternative list-based view of board tasks.
 *
 * Placeholder for now; will show tasks in a table/list format
 * with sorting and filtering capabilities.
 */
@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss'],
  standalone: false
})
export class ListViewComponent {
  projectId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';
  }

  onSwitchToBoard(): void {
    this.router.navigate(['projects', this.projectId, 'board']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}
