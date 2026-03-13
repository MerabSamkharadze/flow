import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TimeAgoPipe } from './pipes/time-ago.pipe';

// Shared components
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

/**
 * SharedModule — reusable components, directives, and pipes.
 *
 * Unlike CoreModule, SharedModule CAN be imported by multiple feature modules.
 * It re-exports commonly needed Angular modules (CommonModule, FormsModule,
 * ReactiveFormsModule) so feature modules don't have to import them individually.
 */
@NgModule({
  declarations: [
    TimeAgoPipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  exports: [
    // Re-export common modules so feature modules get them for free
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,

    // Export shared declarations
    TimeAgoPipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
})
export class SharedModule {}
