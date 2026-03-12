import { NgModule } from '@angular/core';

// Shared module provides CommonModule, FormsModule, ReactiveFormsModule
import { SharedModule } from '../../shared/shared.module';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

/**
 * AuthModule — authentication feature module.
 *
 * Lazy-loaded under /auth. Contains login and register pages.
 *
 * NOTE: The auth NgRx state (reducer + effects) is registered in AppModule
 * rather than here, because AuthGuard and interceptors need the auth state
 * to be available before this lazy-loaded module is loaded.
 */
@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
  ],
  imports: [
    SharedModule,
    AuthRoutingModule,
  ],
})
export class AuthModule {}
