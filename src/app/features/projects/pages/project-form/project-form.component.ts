import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROJECT_COLORS } from '../../../../shared/models/project.model';

/**
 * ProjectFormComponent — create a new project.
 *
 * Reactive form with name, description, color picker (5 presets), and deadline.
 * On submit, the project will be saved to Firestore via NgRx (TODO).
 */
@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {
  projectForm!: FormGroup;
  colors = PROJECT_COLORS;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
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

    this.isLoading = true;
    const formValue = this.projectForm.value;

    // TODO: dispatch NgRx action to create project in Firestore
    console.log('Create project:', formValue);

    // Navigate back to project list after creation
    this.router.navigate(['/projects']);
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
