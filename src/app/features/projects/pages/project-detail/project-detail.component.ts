import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Project } from '@shared/models/project.model';
import { Member, MemberRole } from '@shared/models/member.model';
import { Task, PRIORITY_CONFIG } from '@shared/models/task.model';
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

  /** Task stats */
  allTasks: Task[] = [];
  totalTasks = 0;
  completedTasks = 0;
  completedPercent = 0;
  overdueTasks = 0;
  recentTasks: Task[] = [];
  readonly priorityConfig = PRIORITY_CONFIG;

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
    this.completedTasks = tasks.filter((t) => t.status === 'done').length;
    this.completedPercent =
      this.totalTasks > 0
        ? Math.round((this.completedTasks / this.totalTasks) * 100)
        : 0;

    const now = new Date().toISOString().slice(0, 10);
    this.overdueTasks = tasks.filter(
      (t) => t.deadline && t.deadline < now && t.status !== 'done'
    ).length;

    // Recent tasks: sorted by updatedAt desc, take 5
    this.recentTasks = [...tasks]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);
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

  onInviteMember(payload: InvitePayload): void {
    const member: Member = {
      userId: '',
      email: payload.email,
      displayName: payload.email.split('@')[0],
      role: payload.role,
      joinedAt: Date.now(),
      avatarUrl: null,
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
