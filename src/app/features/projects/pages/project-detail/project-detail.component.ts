import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Project } from '@shared/models/project.model';
import { Member, MemberRole } from '@shared/models/member.model';
import { Task, PRIORITY_CONFIG, isTaskCompleted } from '@shared/models/task.model';
import { Column } from '@shared/models/column.model';
import { InvitePayload } from '../../components/invite-modal/invite-modal.component';

import * as ProjectsActions from '../../store/projects.actions';
import { selectProjectById, selectProjectsLoading } from '../../store';
import { selectUser } from '../../../auth/store';
import { ProjectsService } from '../../services/projects.service';
import { BoardService } from '../../../board/services/board.service';

@Component({
  standalone: false,
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  project$!: Observable<Project | null | undefined>;
  loading$!: Observable<boolean>;
  members: Member[] = [];
  currentUserId = '';
  currentUserProjectRole: MemberRole = 'member';
  showInviteModal = false;
  projectId = '';

  /** Columns for progress calculation */
  columns: Column[] = [];

  /** Task stats */
  allTasks: Task[] = [];
  totalTasks = 0;
  completedTasks = 0;
  completedPercent = 0;
  overdueTasks = 0;
  recentTasks: Task[] = [];
  readonly priorityConfig = PRIORITY_CONFIG;

  /** Tabs: General | Analytics */
  activeTab: 'general' | 'analytics' = 'general';

  /** Burndown chart date range */
  burndownStart!: Date;
  burndownEnd!: Date;

  /** Members display */
  readonly maxVisibleAvatars = 5;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private projectsService: ProjectsService,
    private boardService: BoardService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';

    // Load the project into the store
    this.store.dispatch(ProjectsActions.loadProject({ projectId: this.projectId }));
    this.store.dispatch(ProjectsActions.setSelectedProject({ projectId: this.projectId }));

    // Select project from store
    this.project$ = this.store.select(selectProjectById(this.projectId));
    this.loading$ = this.store.select(selectProjectsLoading);

    // Get current user ID
    this.store
      .select(selectUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUserId = user?.uid || '';
      });

    // Load members from Firestore subcollection
    this.projectsService
      .getMembers(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((members) => {
        this.members = members;
        const currentMember = members.find((m) => m.userId === this.currentUserId);
        this.currentUserProjectRole = currentMember?.role || 'member';
      });

    // Subscribe to project for burndown end date
    this.project$
      .pipe(takeUntil(this.destroy$))
      .subscribe((project) => this.setBurndownEnd(project));

    // Load columns for progress calculation
    this.boardService
      .getColumns(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((columns) => {
        this.columns = columns.sort((a, b) => a.order - b.order);
        if (this.allTasks.length > 0) {
          this.computeStats(this.allTasks);
        }
      });

    // Load tasks directly from Firestore (board state is lazy-loaded)
    this.boardService
      .getTasks(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks) => {
        this.allTasks = tasks;
        this.computeStats(tasks);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Stats computation ────────────────────────────────────────────

  private computeStats(tasks: Task[]): void {
    this.totalTasks = tasks.length;

    // Build column order lookup: columnId → position index (0-based)
    const colCount = this.columns.length;
    const colIndex = new Map<string, number>();
    for (let i = 0; i < colCount; i++) {
      colIndex.set(this.columns[i].id, i);
    }

    // A task is "completed" if it's in the last column, or status contains done/complete/finish
    const lastColumnId = colCount > 0 ? this.columns[colCount - 1].id : null;
    this.completedTasks = tasks.filter((t) =>
      (lastColumnId && t.columnId === lastColumnId) || isTaskCompleted(t)
    ).length;

    // Weighted progress: each task contributes its column position / (totalColumns - 1)
    // e.g. 4 columns: col0=0%, col1=33%, col2=66%, col3=100%
    if (this.totalTasks > 0 && colCount > 1) {
      let totalWeight = 0;
      for (const task of tasks) {
        const idx = colIndex.get(task.columnId) ?? 0;
        totalWeight += idx / (colCount - 1);
      }
      this.completedPercent = Math.round((totalWeight / this.totalTasks) * 100);
    } else if (this.totalTasks > 0) {
      // Fallback: no columns loaded, use simple completed/total
      this.completedPercent = Math.round((this.completedTasks / this.totalTasks) * 100);
    } else {
      this.completedPercent = 0;
    }

    const now = new Date().toISOString().slice(0, 10);
    this.overdueTasks = tasks.filter(
      (t) => t.deadline && t.deadline < now && !isTaskCompleted(t) && t.columnId !== lastColumnId
    ).length;

    // Recent tasks: sorted by updatedAt desc, take 5
    this.recentTasks = [...tasks]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);

    // Burndown date range — earliest createdAt to project deadline (or +30 days)
    if (tasks.length > 0) {
      const earliest = Math.min(...tasks.map((t) => t.createdAt));
      this.burndownStart = new Date(earliest);
    } else {
      this.burndownStart = new Date();
    }
  }

  /** Set chart end date after project loads (needs project.deadline) */
  private setBurndownEnd(project: Project | null | undefined): void {
    if (project?.deadline) {
      this.burndownEnd = new Date(project.deadline);
    } else {
      // Default: 30 days from start
      const start = this.burndownStart || new Date();
      this.burndownEnd = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  // ── Navigation ───────────────────────────────────────────────────

  onOpenBoard(): void {
    this.router.navigate(['/projects', this.projectId, 'board']);
  }

  onOpenRoadmap(): void {
    this.router.navigate(['/projects', this.projectId, 'board', 'roadmap']);
  }

  onGoToSettings(): void {
    this.router.navigate(['/projects', this.projectId, 'settings']);
  }

  onGoToMembersSettings(): void {
    this.router.navigate(['/projects', this.projectId, 'settings'], {
      queryParams: { tab: 'members' },
    });
  }

  onGoBack(): void {
    this.router.navigate(['/projects']);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  /** Generate a consistent color from a member's userId */
  getMemberColor(member: Member): string {
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

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((p) => p.length > 0)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'on-hold':
        return 'On Hold';
      case 'in-progress':
        return 'In Progress';
      case 'in-review':
        return 'In Review';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  trackTask(_index: number, task: Task): string {
    return task.id;
  }

  trackMember(_index: number, member: Member): string {
    return member.userId;
  }

  get visibleMembers(): Member[] {
    return this.members.slice(0, this.maxVisibleAvatars);
  }

  get overflowCount(): number {
    return Math.max(0, this.members.length - this.maxVisibleAvatars);
  }

  // ── Member management (kept for invite modal) ────────────────────

  onOpenInviteModal(): void {
    this.showInviteModal = true;
  }

  onCloseInviteModal(): void {
    this.showInviteModal = false;
  }

  async onInviteMember(payload: InvitePayload): Promise<void> {
    const foundUser = await this.projectsService.findUserByEmail(payload.email);

    if (!foundUser) {
      // TODO: show error toast — user not registered
      this.showInviteModal = false;
      return;
    }

    const member: Member = {
      userId: foundUser.uid,
      email: foundUser.email,
      displayName: foundUser.displayName,
      role: payload.role,
      joinedAt: Date.now(),
      avatarUrl: foundUser.photoURL,
    };

    this.store.dispatch(
      ProjectsActions.addMember({ projectId: this.projectId, member })
    );
    this.showInviteModal = false;
  }

  onRemoveMember(userId: string): void {
    this.store.dispatch(
      ProjectsActions.removeMember({ projectId: this.projectId, userId })
    );
  }

  onChangeRole(event: { userId: string; newRole: MemberRole }): void {
    this.store.dispatch(
      ProjectsActions.updateMemberRole({
        projectId: this.projectId,
        userId: event.userId,
        newRole: event.newRole,
      })
    );
  }
}
