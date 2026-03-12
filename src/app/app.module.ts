import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Core module — singleton services and layout components
import { CoreModule } from './core/core.module';

/**
 * AppModule — root module of the FLOW application.
 *
 * Imports:
 *   - BrowserModule: required for browser-based apps
 *   - AppRoutingModule: top-level routing configuration
 *   - CoreModule.forRoot(): layout shell + singleton services
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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
