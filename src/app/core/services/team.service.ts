import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { TeamMember } from '../../shared/models/team-member.model';
import { Project } from '../../shared/models/project.model';
import { Member, MemberRole } from '../../shared/models/member.model';

/** Role priority for picking the highest role across projects */
const ROLE_PRIORITY: Record<MemberRole, number> = {
  admin: 2,
  manager: 1,
  member: 0,
};

/**
 * TeamService — aggregates team member data across all shared projects.
 *
 * Queries all projects where the current user is a member,
 * collects unique member userIds, fetches their profiles,
 * and returns a combined list excluding the current user.
 */
@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor(private firestore: AngularFirestore) {}

  /**
   * Get all teammates of the current user.
   *
   * 1. Query projects where memberIds contains userId
   * 2. For each project, load its members subcollection
   * 3. Merge into unique TeamMember[] with shared project names and highest role
   */
  getMyTeammates(userId: string): Observable<TeamMember[]> {
    // Step 1: get all projects where current user is a member
    return this.firestore
      .collection<Project>('projects', (ref) =>
        ref.where('memberIds', 'array-contains', userId)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id } as Project;
          })
        ),
        switchMap((projects) => {
          if (projects.length === 0) return of([]);

          // Step 2: for each project, load its members subcollection
          const memberStreams = projects.map((project) =>
            this.firestore
              .collection<Member>(`projects/${project.id}/members`)
              .valueChanges()
              .pipe(
                map((members) =>
                  members.map((m) => ({ ...m, projectName: project.name }))
                )
              )
          );

          return combineLatest(memberStreams).pipe(
            map((allProjectMembers) => {
              // Step 3: flatten and aggregate by userId
              const memberMap = new Map<
                string,
                { member: Member; projects: string[]; highestRole: MemberRole }
              >();

              for (const projectMembers of allProjectMembers) {
                for (const pm of projectMembers) {
                  // Skip the current user
                  if (pm.userId === userId) continue;

                  const existing = memberMap.get(pm.userId);
                  if (existing) {
                    if (!existing.projects.includes(pm.projectName)) {
                      existing.projects.push(pm.projectName);
                    }
                    // Keep the highest role
                    if (ROLE_PRIORITY[pm.role] > ROLE_PRIORITY[existing.highestRole]) {
                      existing.highestRole = pm.role;
                    }
                  } else {
                    memberMap.set(pm.userId, {
                      member: pm,
                      projects: [pm.projectName],
                      highestRole: pm.role,
                    });
                  }
                }
              }

              // Convert to TeamMember array
              const teammates: TeamMember[] = [];
              memberMap.forEach(({ member, projects, highestRole }) => {
                teammates.push({
                  userId: member.userId,
                  displayName: member.displayName || member.email.split('@')[0],
                  email: member.email,
                  avatarUrl: member.avatarUrl,
                  projects,
                  role: highestRole,
                });
              });

              // Sort alphabetically by display name
              return teammates.sort((a, b) =>
                a.displayName.localeCompare(b.displayName)
              );
            })
          );
        })
      );
  }
}
