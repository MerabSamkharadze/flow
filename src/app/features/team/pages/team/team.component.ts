import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, Observable, of, combineLatest } from 'rxjs';
import { switchMap, takeUntil, filter, map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { TeamMember } from '../../../../shared/models/team-member.model';
import { TeamService } from '../../../../core/services/team.service';
import { selectUser } from '../../../auth/store';
import { AuthUser } from '../../../auth/store/auth.actions';

/** Color palette for avatar backgrounds based on first letter */
const AVATAR_COLORS: Record<string, string> = {
  a: '#ef4444', b: '#f97316', c: '#f59e0b', d: '#eab308',
  e: '#84cc16', f: '#22c55e', g: '#10b981', h: '#14b8a6',
  i: '#06b6d4', j: '#0ea5e9', k: '#3b82f6', l: '#6366f1',
  m: '#8b5cf6', n: '#a855f7', o: '#d946ef', p: '#ec4899',
  q: '#f43f5e', r: '#ef4444', s: '#f97316', t: '#f59e0b',
  u: '#84cc16', v: '#22c55e', w: '#10b981', x: '#14b8a6',
  y: '#06b6d4', z: '#3b82f6',
};

/**
 * TeamComponent — shows all users who share at least one project
 * with the current user.
 */
@Component({
  standalone: false,
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
})
export class TeamComponent implements OnInit, OnDestroy {
  teammates$!: Observable<TeamMember[]>;
  filteredTeammates$!: Observable<TeamMember[]>;
  loading = true;

  searchControl = new FormControl('');

  /** Max project chips to show before "+N more" */
  readonly maxChips = 3;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    // Load teammates when we have a user
    this.teammates$ = this.store.select(selectUser).pipe(
      filter((user): user is AuthUser => !!user),
      switchMap((user) => this.teamService.getMyTeammates(user.uid)),
      takeUntil(this.destroy$)
    );

    // Track loading state
    this.teammates$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loading = false;
    });

    // Filter teammates by search query
    const search$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map((v) => (v || '').trim().toLowerCase())
    );

    this.filteredTeammates$ = combineLatest([search$, this.teammates$]).pipe(
      map(([query, teammates]) => {
        if (!query) return teammates;
        return teammates.filter(
          (m) =>
            m.displayName.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query)
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((p) => p.length > 0)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getAvatarColor(name: string): string {
    const firstChar = (name || 'a').charAt(0).toLowerCase();
    return AVATAR_COLORS[firstChar] || '#6366f1';
  }

  getVisibleProjects(projects: string[]): string[] {
    return projects.slice(0, this.maxChips);
  }

  getOverflowCount(projects: string[]): number {
    return Math.max(0, projects.length - this.maxChips);
  }

  trackByUserId(_index: number, member: TeamMember): string {
    return member.userId;
  }

  trackByProject(_index: number, project: string): string {
    return project;
  }
}
