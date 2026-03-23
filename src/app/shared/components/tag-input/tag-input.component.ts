import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';

/** 8 preset label colors — hashed from label text for consistency */
const LABEL_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

/** Hash a string to a consistent color index */
function hashLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

/**
 * TagInputComponent — chip-based tag input with suggestions.
 *
 * Type text + press Enter or comma to add a tag chip.
 * Each chip shows label text + × remove button.
 * Max 10 tags. Duplicate tags are ignored.
 * Optional suggestions dropdown from previously used labels.
 */
@Component({
  standalone: false,
  selector: 'app-tag-input',
  templateUrl: './tag-input.component.html',
  styleUrls: ['./tag-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagInputComponent implements OnChanges {
  @Input() tags: string[] = [];
  @Input() suggestions: string[] = [];
  @Input() maxTags = 10;

  @Output() tagsChange = new EventEmitter<string[]>();

  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  inputValue = '';
  showSuggestions = false;
  filteredSuggestions: string[] = [];

  /** Get the consistent color for a label */
  getLabelColor(label: string): string {
    return hashLabelColor(label);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['suggestions'] || changes['tags']) {
      this.updateFilteredSuggestions();
    }
  }

  /** Focus the input when clicking on the container */
  onContainerClick(): void {
    this.inputEl?.nativeElement.focus();
  }

  /** Handle keydown for Enter, comma, and Backspace */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag(this.inputValue);
    } else if (event.key === 'Backspace' && !this.inputValue && this.tags.length > 0) {
      this.removeTag(this.tags.length - 1);
    }
  }

  /** Handle input changes for suggestion filtering */
  onInput(value: string): void {
    this.inputValue = value;
    this.updateFilteredSuggestions();
    this.showSuggestions = this.filteredSuggestions.length > 0;
  }

  /** Show suggestions on focus */
  onFocus(): void {
    this.updateFilteredSuggestions();
    this.showSuggestions = this.filteredSuggestions.length > 0;
  }

  /** Add a tag from text input */
  addTag(text: string): void {
    const tag = text.trim().toLowerCase();
    if (!tag) return;
    if (this.tags.length >= this.maxTags) return;
    if (this.tags.includes(tag)) {
      this.inputValue = '';
      return;
    }

    this.tags = [...this.tags, tag];
    this.inputValue = '';
    this.tagsChange.emit(this.tags);
    this.updateFilteredSuggestions();
  }

  /** Add a tag from suggestion click */
  selectSuggestion(label: string): void {
    this.addTag(label);
    this.showSuggestions = false;
    this.inputEl?.nativeElement.focus();
  }

  /** Remove a tag by index */
  removeTag(index: number): void {
    this.tags = this.tags.filter((_, i) => i !== index);
    this.tagsChange.emit(this.tags);
    this.updateFilteredSuggestions();
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.tag-input')) {
      this.showSuggestions = false;
    }
  }

  /** Filter suggestions: not already added, matches input text */
  private updateFilteredSuggestions(): void {
    const q = this.inputValue.toLowerCase().trim();
    this.filteredSuggestions = this.suggestions
      .filter((s) => !this.tags.includes(s))
      .filter((s) => !q || s.toLowerCase().includes(q))
      .slice(0, 8);
  }

  trackByTag(_index: number, tag: string): string {
    return tag;
  }

  trackBySuggestion(_index: number, s: string): string {
    return s;
  }
}

/** Export the hash function so other components can use it */
export { hashLabelColor, LABEL_COLORS };
