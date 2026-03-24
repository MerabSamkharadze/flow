import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Member } from '../../../../shared/models/member.model';

/**
 * CommentInputComponent — text area + submit button for adding a comment.
 *
 * Supports @mention autocomplete: typing "@" triggers a dropdown of
 * project members filtered by the text after "@". Selecting a member
 * inserts "@displayName" into the comment text.
 */
@Component({
  standalone: false,
  selector: 'app-comment-input',
  templateUrl: './comment-input.component.html',
  styleUrls: ['./comment-input.component.scss'],
})
export class CommentInputComponent {
  @Input() members: Member[] = [];
  @Output() commentSubmitted = new EventEmitter<string>();

  @ViewChild('textarea') textareaRef!: ElementRef<HTMLTextAreaElement>;

  content = '';

  /** Mention state */
  showMentionDropdown = false;
  mentionQuery = '';
  mentionActiveIndex = 0;
  private mentionStartPos = -1;

  onSubmit(): void {
    const text = this.content.trim();
    if (!text) return;
    this.commentSubmitted.emit(text);
    this.content = '';
    this.closeMention();
  }

  onKeydown(event: KeyboardEvent): void {
    // Ctrl/Cmd+Enter to submit
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.onSubmit();
      return;
    }

    // Mention dropdown keyboard navigation
    if (this.showMentionDropdown) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.mentionActiveIndex = Math.min(
          this.mentionActiveIndex + 1,
          this.getFilteredCount() - 1
        );
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.mentionActiveIndex = Math.max(this.mentionActiveIndex - 1, 0);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        this.selectMentionByIndex();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeMention();
        return;
      }
    }
  }

  onInput(): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const text = this.content;

    // Find the last "@" before cursor that starts a mention
    const beforeCursor = text.substring(0, pos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex >= 0) {
      // Check there's no space before @ (or it's at start)
      const charBefore = atIndex > 0 ? beforeCursor[atIndex - 1] : ' ';
      if (charBefore === ' ' || charBefore === '\n' || atIndex === 0) {
        const query = beforeCursor.substring(atIndex + 1);
        // Only show if query doesn't contain newlines
        if (!query.includes('\n')) {
          this.mentionStartPos = atIndex;
          this.mentionQuery = query;
          this.mentionActiveIndex = 0;
          this.showMentionDropdown = true;
          return;
        }
      }
    }

    this.closeMention();
  }

  /** Called when a member is selected from the dropdown */
  onMentionSelected(member: Member): void {
    this.insertMention(member);
  }

  private insertMention(member: Member): void {
    const name = member.displayName || member.email;
    const before = this.content.substring(0, this.mentionStartPos);
    const textarea = this.textareaRef?.nativeElement;
    const afterPos = textarea ? textarea.selectionStart : this.mentionStartPos + this.mentionQuery.length + 1;
    const after = this.content.substring(afterPos);

    this.content = before + '@' + name + ' ' + after;
    this.closeMention();

    // Restore cursor position after the inserted mention
    setTimeout(() => {
      if (textarea) {
        const newPos = before.length + 1 + name.length + 1;
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }
    });
  }

  private selectMentionByIndex(): void {
    const filtered = this.members
      .filter(
        (m) =>
          m.displayName.toLowerCase().includes(this.mentionQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(this.mentionQuery.toLowerCase())
      )
      .slice(0, 5);

    if (filtered[this.mentionActiveIndex]) {
      this.insertMention(filtered[this.mentionActiveIndex]);
    }
  }

  private getFilteredCount(): number {
    return this.members
      .filter(
        (m) =>
          m.displayName.toLowerCase().includes(this.mentionQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(this.mentionQuery.toLowerCase())
      )
      .slice(0, 5).length;
  }

  private closeMention(): void {
    this.showMentionDropdown = false;
    this.mentionQuery = '';
    this.mentionStartPos = -1;
    this.mentionActiveIndex = 0;
  }
}
