import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

/**
 * AuthRoutingModule — routes for the authentication feature.
 *
 * These routes are lazy-loaded under the /auth prefix:
 *   /auth/login    → LoginComponent
 *   /auth/register → RegisterComponent
 *   /auth          → redirects to /auth/login
 */
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
