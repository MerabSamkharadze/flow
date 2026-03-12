import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Core module — singleton services and layout components
import { CoreModule } from './core/core.module';

// Firebase — AngularFire compat modules for Angular 15
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

// NgRx — global state management
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

// Auth state — registered at root level because guards and interceptors
// need it before the lazy-loaded AuthModule is loaded
import { authReducer } from './features/auth/store/auth.reducer';
import { AuthEffects } from './features/auth/store/auth.effects';

// Environment config
import { environment } from '../environments/environment';

/**
 * AppModule — root module of the FLOW application.
 *
 * Imports:
 *   - BrowserModule: required for browser-based apps
 *   - AppRoutingModule: top-level routing configuration
 *   - CoreModule.forRoot(): layout shell + singleton services
 *   - AngularFireModule: Firebase initialization with project config
 *   - AngularFireAuthModule: Firebase Authentication
 *   - AngularFirestoreModule: Cloud Firestore database
 *
 * Feature modules are lazy-loaded via the router, not imported here.
 */
@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule.forRoot(),

    // Firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,

    // NgRx — auth state registered at root because AuthGuard and interceptors
    // run before the lazy-loaded AuthModule is loaded
    StoreModule.forRoot({ auth: authReducer }),
    EffectsModule.forRoot([AuthEffects]),
    // Dev tools — disabled in production builds
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
