import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

// Shared module provides CommonModule, FormsModule, ReactiveFormsModule
import { SharedModule } from '../../shared/shared.module';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

// NgRx auth state
import { authReducer } from './store/auth.reducer';
import { AuthEffects } from './store/auth.effects';

/**
 * AuthModule — authentication feature module.
 *
 * Lazy-loaded under /auth. Contains login and register pages.
 * Registers the 'auth' NgRx feature state slice and effects.
 */
@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
  ],
  imports: [
    SharedModule,
    AuthRoutingModule,

    // NgRx — register the auth feature state and side effects
    StoreModule.forFeature('auth', authReducer),
    EffectsModule.forFeature([AuthEffects]),
  ],
})
export class AuthModule {}
