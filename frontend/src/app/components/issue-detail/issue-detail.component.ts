import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IssueService } from '../../services/issue.service';
import { AuthService } from '../../services/auth.service';
import { Issue } from '../../models/issue.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './issue-detail.component.html',
  styleUrl: './issue-detail.component.css',
})
export class IssueDetailComponent implements OnInit {
  issue: Issue | null = null;
  loading = true;
  errorMessage = '';

  // Users list for department re-assignment
  users: User[] = [];
  reassignTo = '';

  // Response Form
  comment = '';
  expectedCompletionDate = '';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' = 'IN_PROGRESS';
  submitting = false;
  successMessage = '';

  private route = inject(ActivatedRoute);
  private issueService = inject(IssueService);
  authService = inject(AuthService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadUsers();
    if (id) {
      this.loadIssue(id);
    } else {
      this.loading = false;
      this.errorMessage = 'Invalid complaint ID.';
    }
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (err) => console.error('Error fetching users for re-assignment:', err),
    });
  }

  loadIssue(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.issueService.getIssueById(id).subscribe({
      next: (issue) => {
        this.issue = issue;
        if (issue) {
          this.status = issue.status || 'OPEN';
          this.reassignTo = issue.assignedTo?._id || '';
          if (issue.expectedCompletionDate) {
            this.expectedCompletionDate = new Date(issue.expectedCompletionDate)
              .toISOString()
              .substring(0, 10);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching complaint details:', err);
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Backend API server on http://localhost:5000 is not running. Please start the backend using: cd backend && npm run dev';
        } else {
          this.errorMessage = err.error?.message || 'Failed to load complaint details from server.';
        }
      },
    });
  }

  onSubmitResponse(): void {
    if (!this.issue) return;
    
    const isReassigned = this.reassignTo && this.reassignTo !== this.issue.assignedTo?._id;

    if (!this.comment && !this.expectedCompletionDate && !isReassigned && this.status === this.issue.status) {
      this.errorMessage = 'Please provide a comment, update completion date, change status, or re-assign to a department.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.issueService
      .respondToIssue(this.issue._id, {
        comment: this.comment,
        expectedCompletionDate: this.expectedCompletionDate,
        status: this.status,
        reassignTo: this.reassignTo,
      })
      .subscribe({
        next: (updatedIssue) => {
          this.issue = updatedIssue;
          this.comment = '';
          this.submitting = false;
          this.successMessage = isReassigned
            ? `Complaint re-assigned & notification sent to ${updatedIssue.assignedTo?.name} (${updatedIssue.assignedTo?.department || 'Department'})!`
            : 'Response submitted successfully!';
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Failed to submit response.';
        },
      });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'badge-open';
      case 'IN_PROGRESS':
        return 'badge-in-progress';
      case 'RESOLVED':
        return 'badge-resolved';
      case 'CLOSED':
        return 'badge-closed';
      default:
        return '';
    }
  }
}
