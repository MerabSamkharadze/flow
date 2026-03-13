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

  trackByCommentId(_index: number, comment: Comment): string {
    return comment.id;
  }

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

  /** ID of comment pending delete confirmation (null = dialog hidden) */
  confirmDeleteId: string | null = null;

  /** Show confirm dialog before deleting */
  onDelete(commentId: string): void {
    this.confirmDeleteId = commentId;
  }

  /** User confirmed deletion */
  onConfirmDelete(): void {
    if (this.confirmDeleteId) {
      this.deleteComment.emit(this.confirmDeleteId);
    }
    this.confirmDeleteId = null;
  }

  /** User cancelled deletion */
  onCancelDelete(): void {
    this.confirmDeleteId = null;
  }
}
