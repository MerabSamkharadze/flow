import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { AuthGuard } from './core/auth/guards/auth.guard';

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
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.module').then(m => m.ProjectsModule),
      },
      {
        path: 'projects/:id/board',
        loadChildren: () =>
          import('./features/board/board.module').then(m => m.BoardModule),
      },
      // {
      //   path: 'dashboard',
      //   loadChildren: () =>
      //     import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
      // },

      // Default redirect — points to projects until dashboard is built
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
    ],
  },
  // Wildcard — redirect unknown routes to root
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
