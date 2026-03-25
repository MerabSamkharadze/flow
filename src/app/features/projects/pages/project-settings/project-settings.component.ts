import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Project, ProjectStatus, PROJECT_COLORS } from '../../../../shared/models/project.model';
import { Member, MemberRole } from '../../../../shared/models/member.model';
import { selectProjectById } from '../../store/projects.selectors';
import { selectUser } from '../../../auth/store';
import { ProjectsService } from '../../services/projects.service';
import * as ProjectsActions from '../../store/projects.actions';

/** Sidebar tab identifiers */
type SettingsTab = 'general' | 'members' | 'danger';

@Component({
  standalone: false,
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss'],
})
export class ProjectSettingsComponent implements OnInit, OnDestroy {
  projectId = '';
  project: Project | null = null;

  /** Active sidebar tab */
  activeTab: SettingsTab = 'general';

  /** General tab — reactive form */
  form!: FormGroup;
  readonly statuses: ProjectStatus[] = ['active', 'on-hold', 'completed'];
  readonly colors = PROJECT_COLORS;
  selectedColor = PROJECT_COLORS[0];
  saveLoading = false;
  saveMessage: { type: 'success' | 'error'; text: string } | null = null;

  /** Members tab */
  members: Member[] = [];
  currentUserId = '';
  inviteEmail = '';
  inviteLoading = false;
  inviteError = '';

  /** Danger zone */
  showDeleteConfirm = false;

  /** Member removal confirmation */
  confirmRemoveUserId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private store: Store,
    private projectsService: ProjectsService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';

    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['active'],
      deadline: [''],
    });

    // Load project from store
    this.store
      .select(selectProjectById(this.projectId))
      .pipe(takeUntil(this.destroy$))
      .subscribe((project) => {
        if (project) {
          this.project = project;
          this.form.patchValue({
            name: project.name,
            description: project.description,
            status: project.status,
            deadline: project.deadline || '',
          });
          this.selectedColor = project.color || PROJECT_COLORS[0];
        }
      });

    // Load current user
    this.store
      .select(selectUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.currentUserId = user.uid;
        }
      });

    // Load members
    this.projectsService
      .getMembers(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((members) => {
        this.members = members;
      });

    // Dispatch load project to ensure data is fresh
    this.store.dispatch(ProjectsActions.loadProject({ projectId: this.projectId }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ──────────────────────────────────────────────────────

  onGoBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
    this.saveMessage = null;
  }

  // ── General tab ─────────────────────────────────────────────────────

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  onSaveGeneral(): void {
    if (this.form.invalid || !this.project) return;

    this.saveLoading = true;
    this.saveMessage = null;

    const formVal = this.form.value;
    const changes: Partial<Project> = {
      name: formVal.name,
      description: formVal.description,
      status: formVal.status,
      color: this.selectedColor,
      deadline: formVal.deadline || null,
      updatedAt: Date.now(),
    };

    this.store.dispatch(
      ProjectsActions.updateProject({ projectId: this.projectId, changes })
    );

    // Optimistic success — the effect handles errors via toast
    setTimeout(() => {
      this.saveLoading = false;
      this.saveMessage = { type: 'success', text: 'Settings saved successfully.' };
    }, 600);
  }

  // ── Members tab ─────────────────────────────────────────────────────

  async onInviteMember(): Promise<void> {
    const email = this.inviteEmail.trim();
    if (!email) return;

    this.inviteLoading = true;
    this.inviteError = '';

    try {
      // Look up the user by email in Firestore
      const foundUser = await this.projectsService.findUserByEmail(email);

      if (!foundUser) {
        this.inviteError = 'User not found. They must register first.';
        this.inviteLoading = false;
        return;
      }

      const member: Member = {
        userId: foundUser.uid,
        email: foundUser.email,
        displayName: foundUser.displayName,
        role: 'member',
        joinedAt: Date.now(),
        avatarUrl: foundUser.photoURL,
      };

      this.store.dispatch(
        ProjectsActions.addMember({ projectId: this.projectId, member })
      );

      this.inviteEmail = '';
    } catch (err: any) {
      this.inviteError = err?.message || 'Failed to invite member.';
    }
    this.inviteLoading = false;
  }

  onRemoveMember(userId: string): void {
    this.confirmRemoveUserId = userId;
  }

  onConfirmRemove(): void {
    if (this.confirmRemoveUserId) {
      this.store.dispatch(
        ProjectsActions.removeMember({
          projectId: this.projectId,
          userId: this.confirmRemoveUserId,
        })
      );
    }
    this.confirmRemoveUserId = null;
  }

  onCancelRemove(): void {
    this.confirmRemoveUserId = null;
  }

  onRoleChange(userId: string, event: Event): void {
    const newRole = (event.target as HTMLSelectElement).value as MemberRole;
    this.store.dispatch(
      ProjectsActions.updateMemberRole({
        projectId: this.projectId,
        userId,
        newRole,
      })
    );
  }

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

  trackByValue(_index: number, value: string): string {
    return value;
  }

  trackMember(_index: number, member: Member): string {
    return member.userId;
  }

  // ── Danger zone ─────────────────────────────────────────────────────

  onDeleteProject(): void {
    this.showDeleteConfirm = true;
  }

  onConfirmDelete(): void {
    this.store.dispatch(ProjectsActions.deleteProject({ projectId: this.projectId }));
    this.showDeleteConfirm = false;
  }

  onCancelDelete(): void {
    this.showDeleteConfirm = false;
  }
}
