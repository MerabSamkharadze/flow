import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Layout components
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';

/**
 * CoreModule — singleton services and app-wide layout components.
 *
 * This module should only be imported ONCE in AppModule via CoreModule.forRoot().
 * It contains the main layout shell (sidebar, header, content area) and will
 * later house global services like AuthService, NotificationService, etc.
 */
@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    CommonModule,
    LayoutComponent,
  ],
})
export class CoreModule {
  /**
   * Guard against multiple imports — CoreModule must be a singleton.
   * If it's accidentally imported in a lazy-loaded feature module,
   * this constructor throws a clear error.
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it only in AppModule using CoreModule.forRoot().'
      );
    }
  }

  /**
   * forRoot() pattern — use this in AppModule to register
   * singleton providers that should exist for the entire app lifetime.
   */
  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        // Register app-wide singleton services here
        // e.g. AuthService, NotificationService
      ],
    };
  }
}
