import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';

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

  // Authenticated routes — rendered inside the layout shell
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Lazy-loaded feature modules will be added here:
      //
      // {
      //   path: 'dashboard',
      //   loadChildren: () =>
      //     import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
      // },
      // {
      //   path: 'projects',
      //   loadChildren: () =>
      //     import('./features/projects/projects.module').then(m => m.ProjectsModule),
      // },

      // Default redirect — will point to dashboard once it exists
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
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
