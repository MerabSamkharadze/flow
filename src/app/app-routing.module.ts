import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { NotFoundComponent } from './features/not-found/not-found.component';

/**
 * AppRoutingModule — top-level routing configuration.
 *
 * All authenticated routes are children of the LayoutComponent,
 * which provides the sidebar + header shell.
 *
 * Feature modules will be lazy-loaded as children of the layout route.
 */
const routes: Routes = [
  // Auth routes — rendered WITHOUT the layout shell (no sidebar/header)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule),
  },

  // Authenticated routes — protected by AuthGuard, rendered inside the layout shell
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Lazy-loaded feature modules
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.module').then(m => m.ProjectsModule),
      },
      {
        path: 'projects/:id/board',
        loadChildren: () =>
          import('./features/board/board.module').then(m => m.BoardModule),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks.module').then(m => m.TasksModule),
      },
      {
        path: 'my-tasks',
        loadChildren: () =>
          import('./features/tasks/tasks.module').then(m => m.TasksModule),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./features/calendar/calendar.module').then(m => m.CalendarModule),
      },
      {
        path: 'team',
        loadChildren: () =>
          import('./features/team/team.module').then(m => m.TeamModule),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.module').then(m => m.NotificationsModule),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.module').then(m => m.SettingsModule),
      },

      // Default redirect
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  // Wildcard — show 404 page for unknown routes
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
