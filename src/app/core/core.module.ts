import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

// Layout components
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';

// Interceptors
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { ErrorInterceptor } from './auth/interceptors/error.interceptor';

/**
 * CoreModule — singleton services and app-wide layout components.
 *
 * This module should only be imported ONCE in AppModule via CoreModule.forRoot().
 * It contains the main layout shell (sidebar, header, content area),
 * HTTP interceptors, and will later house global services.
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
    HttpClientModule,
  ],
  exports: [
    CommonModule,
    LayoutComponent,
  ],
})
export class CoreModule {
  /**
   * Guard against multiple imports — CoreModule must be a singleton.
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it only in AppModule using CoreModule.forRoot().'
      );
    }
  }

  /**
   * forRoot() pattern — registers singleton providers including HTTP interceptors.
   * Interceptors run in the order they are listed:
   *   1. AuthInterceptor — attaches the Firebase token
   *   2. ErrorInterceptor — catches 401/500 errors
   */
  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor,
          multi: true,
        },
      ],
    };
  }
}
