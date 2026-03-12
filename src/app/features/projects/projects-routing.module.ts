import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ProjectFormComponent } from './pages/project-form/project-form.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { ProjectSettingsComponent } from './pages/project-settings/project-settings.component';

/**
 * ProjectsRoutingModule — routes for the projects feature.
 *
 * Lazy-loaded under /projects:
 *   /projects           → ProjectListComponent (grid of all projects)
 *   /projects/new       → ProjectFormComponent (create new project)
 *   /projects/:id       → ProjectDetailComponent (single project view)
 *   /projects/:id/settings → ProjectSettingsComponent
 *
 * NOTE: /projects/new must be declared before /projects/:id
 * so "new" is not matched as a route parameter.
 */
const routes: Routes = [
  { path: '', component: ProjectListComponent },
  { path: 'new', component: ProjectFormComponent },
  { path: ':id', component: ProjectDetailComponent },
  { path: ':id/settings', component: ProjectSettingsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsRoutingModule {}
