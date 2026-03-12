import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Comment } from '../../../../shared/models/comment.model';

/**
 * CommentThreadComponent — renders a list of comments for a task.
 *
 * Supports inline editing and deletion for comments owned by the current user.
 */
@Component({
  selector: 'app-comment-thread',
  templateUrl: './comment-thread.component.html',
  styleUrls: ['./comment-thread.component.scss'],
})
export class CommentThreadComponent {
  @Input() comments: Comment[] = [];
  @Input() currentUserId: string = '';

  @Output() editComment = new EventEmitter<{ commentId: string; content: string }>();
  @Output() deleteComment = new EventEmitter<string>();

  /** Currently editing comment ID */
  editingId: string | null = null;
  editContent = '';

  /** Start inline editing */
  startEdit(comment: Comment): void {
    this.editingId = comment.id;
    this.editContent = comment.content;
  }

  /** Cancel editing */
  cancelEdit(): void {
    this.editingId = null;
    this.editContent = '';
  }

  /** Save edited comment */
  saveEdit(): void {
    const text = this.editContent.trim();
    if (!text || !this.editingId) return;
    this.editComment.emit({ commentId: this.editingId, content: text });
    this.editingId = null;
    this.editContent = '';
  }

  /** Delete a comment */
  onDelete(commentId: string): void {
    this.deleteComment.emit(commentId);
  }

  /** Format timestamp for display */
  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}
