import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PROJECT_COLORS } from '../../../../shared/models/project.model';
import * as ProjectsActions from '../../store/projects.actions';
import { selectProjectsLoading, selectProjectsError } from '../../store';
import { selectUser } from '../../../auth/store';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  projectForm!: FormGroup;
  colors = PROJECT_COLORS;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  private currentUserId = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store
  ) {
    this.store.select(selectUser).pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUserId = user?.uid || '';
    });
  }

  ngOnInit(): void {
    this.loading$ = this.store.select(selectProjectsLoading);
    this.error$ = this.store.select(selectProjectsError);

    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      color: [this.colors[0], [Validators.required]],
      deadline: [''],
    });
  }

  get f() {
    return this.projectForm.controls;
  }

  /** Set the selected color */
  selectColor(color: string): void {
    this.projectForm.patchValue({ color });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const formValue = this.projectForm.value;
    const now = Date.now();

    this.store.dispatch(
      ProjectsActions.createProject({
        project: {
          name: formValue.name,
          description: formValue.description || '',
          color: formValue.color,
          ownerId: this.currentUserId,
          memberIds: [this.currentUserId],
          createdAt: now,
          updatedAt: now,
          deadline: formValue.deadline || null,
          status: 'active',
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
