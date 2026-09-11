import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IssueService } from '../../services/issue.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-create-issue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-issue.component.html',
  styleUrl: './create-issue.component.css',
})
export class CreateIssueComponent implements OnInit {
  zone = 'Zone A';
  shed = '';
  details = '';
  issueRaisedDate = new Date().toISOString().substring(0, 10);
  assignedTo = '';
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  users: User[] = [];
  loadingUsers = true;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Central Zone', 'North Yard'];

  private issueService = inject(IssueService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loadingUsers = false;
        if (users.length > 0) {
          // Select first assignee or non-reporter user by default
          const defaultAssignee = users.find((u) => u.role === 'ASSIGNEE') || users[0];
          this.assignedTo = defaultAssignee._id;
        }
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.loadingUsers = false;
      },
    });
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.previewUrls = [];

      this.selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  onSubmit(): void {
    if (!this.zone || !this.shed || !this.details || !this.assignedTo) {
      this.errorMessage = 'Please complete all required fields (Zone, Shed, Details, and Assignee).';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('zone', this.zone);
    formData.append('shed', this.shed);
    formData.append('details', this.details);
    formData.append('issueRaisedDate', this.issueRaisedDate);
    formData.append('assignedTo', this.assignedTo);

    this.selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    this.issueService.createIssue(formData).subscribe({
      next: (createdIssue) => {
        this.submitting = false;
        this.successMessage = `Issue ${createdIssue.issueCode} created successfully! Email notification dispatched.`;
        setTimeout(() => {
          this.router.navigate(['/issues', createdIssue._id]);
        }, 1500);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to create issue.';
      },
    });
  }
}
