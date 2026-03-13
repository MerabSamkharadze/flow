import { Component, Output, EventEmitter } from '@angular/core';

/**
 * CommentInputComponent — text area + submit button for adding a comment.
 *
 * Emits the comment text on submit, then clears the input.
 */
@Component({
  standalone: false,
  selector: 'app-comment-input',
  templateUrl: './comment-input.component.html',
  styleUrls: ['./comment-input.component.scss'],
})
export class CommentInputComponent {
  @Output() commentSubmitted = new EventEmitter<string>();

  content = '';

  onSubmit(): void {
    const text = this.content.trim();
    if (!text) return;
    this.commentSubmitted.emit(text);
    this.content = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
