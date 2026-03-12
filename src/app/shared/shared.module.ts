import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/**
 * SharedModule — reusable components, directives, and pipes.
 *
 * Unlike CoreModule, SharedModule CAN be imported by multiple feature modules.
 * It re-exports commonly needed Angular modules (CommonModule, FormsModule,
 * ReactiveFormsModule) so feature modules don't have to import them individually.
 *
 * Add shared UI components (buttons, modals, cards, etc.) here as the app grows.
 */
@NgModule({
  declarations: [
    // Shared components, directives, and pipes go here
    // e.g. ButtonComponent, ModalComponent, StatusBadgePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    // Re-export common modules so feature modules get them for free
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // Export shared declarations here as they're added
  ],
})
export class SharedModule {}
