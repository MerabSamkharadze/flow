import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '../../../../shared/models/project.model';

/**
 * ProjectListComponent — displays all projects in a responsive card grid.
 *
 * Has a "New Project" button that navigates to the project creation form.
 * Projects will later be loaded from Firestore via NgRx;
 * for now uses mock data for layout development.
 */
@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Mock data — will be replaced with NgRx store selector
    this.projects = [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with new branding and improved UX.',
        color: '#4f46e5',
        ownerId: 'user1',
        memberIds: ['user1', 'user2', 'user3', 'user4'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deadline: '2026-05-01',
        status: 'active',
      },
      {
        id: '2',
        name: 'Mobile App v2',
        description: 'Second major release of the mobile application with offline support.',
        color: '#0ea5e9',
        ownerId: 'user1',
        memberIds: ['user1', 'user5'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deadline: '2026-06-15',
        status: 'active',
      },
      {
        id: '3',
        name: 'API Migration',
        description: 'Migrate legacy REST endpoints to GraphQL.',
        color: '#10b981',
        ownerId: 'user2',
        memberIds: ['user2', 'user3'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deadline: null,
        status: 'on-hold',
      },
      {
        id: '4',
        name: 'Q1 Marketing Campaign',
        description: 'Digital marketing campaign for Q1 product launch.',
        color: '#f59e0b',
        ownerId: 'user3',
        memberIds: ['user3'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deadline: '2026-03-31',
        status: 'completed',
      },
    ];
  }

  onNewProject(): void {
    this.router.navigate(['/projects/new']);
  }
}
