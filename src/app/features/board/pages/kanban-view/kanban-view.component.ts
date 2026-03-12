import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Column } from '../../../../shared/models/column.model';
import { Task } from '../../../../shared/models/task.model';

/**
 * KanbanViewComponent — main Kanban board page.
 *
 * Displays a horizontal scrollable row of columns,
 * each containing vertically stacked task cards.
 *
 * Uses mock data for now; will be connected to NgRx store
 * with Firestore backend in a later phase.
 */
@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
})
export class KanbanViewComponent implements OnInit {
  projectId = '';
  columns: Column[] = [];
  tasks: Task[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get project ID from the parent route (projects/:id/board)
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';

    // Mock columns
    this.columns = [
      { id: 'col-1', name: 'To Do',        projectId: this.projectId, order: 0, color: '#6b7280', taskLimit: null },
      { id: 'col-2', name: 'In Progress',  projectId: this.projectId, order: 1, color: '#3b82f6', taskLimit: 5 },
      { id: 'col-3', name: 'In Review',    projectId: this.projectId, order: 2, color: '#f59e0b', taskLimit: 3 },
      { id: 'col-4', name: 'Done',         projectId: this.projectId, order: 3, color: '#10b981', taskLimit: null },
    ];

    // Mock tasks
    this.tasks = [
      {
        id: 't1', title: 'Design homepage mockup', description: '',
        projectId: this.projectId, columnId: 'col-1', assigneeId: 'user1',
        priority: 'high', status: 'todo',
        createdAt: Date.now(), updatedAt: Date.now(),
        deadline: '2026-04-01', order: 0,
        labels: ['design', 'frontend'], subtasks: [],
      },
      {
        id: 't2', title: 'Set up CI/CD pipeline', description: '',
        projectId: this.projectId, columnId: 'col-1', assigneeId: 'user2',
        priority: 'medium', status: 'todo',
        createdAt: Date.now(), updatedAt: Date.now(),
        deadline: null, order: 1,
        labels: ['devops'], subtasks: [
          { id: 's1', title: 'Configure GitHub Actions', completed: true },
          { id: 's2', title: 'Add deploy step', completed: false },
        ],
      },
      {
        id: 't3', title: 'Implement auth flow', description: '',
        projectId: this.projectId, columnId: 'col-2', assigneeId: 'user1',
        priority: 'critical', status: 'in-progress',
        createdAt: Date.now(), updatedAt: Date.now(),
        deadline: '2026-03-20', order: 0,
        labels: ['backend'], subtasks: [],
      },
      {
        id: 't4', title: 'Write API documentation', description: '',
        projectId: this.projectId, columnId: 'col-3', assigneeId: null,
        priority: 'low', status: 'in-review',
        createdAt: Date.now(), updatedAt: Date.now(),
        deadline: '2026-04-10', order: 0,
        labels: ['docs'], subtasks: [],
      },
      {
        id: 't5', title: 'Create project scaffold', description: '',
        projectId: this.projectId, columnId: 'col-4', assigneeId: 'user2',
        priority: 'medium', status: 'done',
        createdAt: Date.now(), updatedAt: Date.now(),
        deadline: null, order: 0,
        labels: [], subtasks: [],
      },
    ];
  }

  /** Get tasks that belong to a specific column, sorted by order */
  getColumnTasks(columnId: string): Task[] {
    return this.tasks
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }

  onAddColumn(): void {
    // TODO: open column creation dialog
    console.log('Add column to project:', this.projectId);
  }

  onAddTask(columnId: string): void {
    // TODO: open task creation dialog
    console.log('Add task to column:', columnId);
  }

  /** Navigate to list view */
  onSwitchToList(): void {
    this.router.navigate(['projects', this.projectId, 'board', 'list']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}
