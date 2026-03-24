import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * MentionPipe — transforms plain text containing @mentions into safe HTML.
 *
 * Detects patterns like @firstName lastName or @singleName and wraps them
 * in a styled <span class="mention"> tag.
 *
 * Usage: <span [innerHTML]="comment.content | mention"></span>
 */
@Pipe({
  name: 'mention',
})
export class MentionPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return value;

    // Escape HTML entities first to prevent XSS
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Replace @mentions with styled spans
    // Matches: @word or @word word (first + last name)
    const withMentions = escaped.replace(
      /@(\w+(?:\s\w+)?)/g,
      '<span class="mention">@$1</span>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(withMentions);
  }
}
