import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Member } from '../../models/member.model';

/**
 * MentionDropdownComponent — autocomplete dropdown for @mentions.
 *
 * Filters project members by the query string typed after "@".
 * Shows avatar + display name for each match, max 5 results.
 * Keyboard navigation (arrow keys) is handled by the parent.
 */
@Component({
  standalone: false,
  selector: 'app-mention-dropdown',
  templateUrl: './mention-dropdown.component.html',
  styleUrls: ['./mention-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionDropdownComponent implements OnChanges {
  @Input() members: Member[] = [];
  @Input() query = '';
  @Input() activeIndex = 0;

  @Output() selected = new EventEmitter<Member>();

  filtered: Member[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.filterMembers();
  }

  private filterMembers(): void {
    const q = this.query.toLowerCase().trim();
    this.filtered = this.members
      .filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }

  onSelect(member: Member): void {
    this.selected.emit(member);
  }

  getInitials(member: Member): string {
    const name = member.displayName || member.email || '?';
    const parts = name.split(/[\s@.]+/).filter((p) => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getColor(member: Member): string {
    const COLORS = [
      '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
      '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
    ];
    const key = member.userId || member.email || '';
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  }

  trackByUserId(_index: number, member: Member): string {
    return member.userId;
  }
}
