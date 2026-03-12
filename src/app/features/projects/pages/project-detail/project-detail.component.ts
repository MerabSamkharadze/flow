import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Project } from '../../../../shared/models/project.model';
import { Member, MemberRole } from '../../../../shared/models/member.model';
import { InvitePayload } from '../../components/invite-modal/invite-modal.component';

import * as ProjectsActions from '../../store/projects.actions';
import { selectProjectById, selectProjectsLoading } from '../../store';
import { selectUser } from '../../../auth/store';
import { ProjectsService } from '../../services/projects.service';

/**
 * ProjectDetailComponent — shows full details of a single project.
 *
 * Connected to NgRx store for project data.
 * Loads members from Firestore subcollection.
 * Manages invite modal visibility and member actions.
 */
@Component({
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

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private projectsService: ProjectsService
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
    this.store.select(selectUser).pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUserId = user?.uid || '';
    });

    // Load members from Firestore subcollection
    this.projectsService
      .getMembers(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((members) => {
        this.members = members;
        // Determine current user's project-level role
        const currentMember = members.find((m) => m.userId === this.currentUserId);
        this.currentUserProjectRole = currentMember?.role || 'member';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onOpenBoard(): void {
    // TODO: navigate to /projects/:id/board
    console.log('Open board for project:', this.projectId);
  }

  onGoToSettings(): void {
    this.router.navigate(['/projects', this.projectId, 'settings']);
  }

  onGoBack(): void {
    this.router.navigate(['/projects']);
  }

  // ---------------------------------------------------------------------------
  // Member management
  // ---------------------------------------------------------------------------

  onOpenInviteModal(): void {
    this.showInviteModal = true;
  }

  onCloseInviteModal(): void {
    this.showInviteModal = false;
  }

  /** Handle invite form submission */
  onInviteMember(payload: InvitePayload): void {
    const member: Member = {
      userId: '', // Will be resolved server-side or by lookup
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

  /** Handle member removal */
  onRemoveMember(userId: string): void {
    this.store.dispatch(
      ProjectsActions.removeMember({ projectId: this.projectId, userId })
    );
  }

  /** Handle role change */
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
