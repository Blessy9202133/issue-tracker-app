import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IssueService } from '../../services/issue.service';
import { AuthService } from '../../services/auth.service';
import { Issue } from '../../models/issue.model';

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
    if (id) {
      this.loadIssue(id);
    }
  }

  loadIssue(id: string): void {
    this.loading = true;
    this.issueService.getIssueById(id).subscribe({
      next: (issue) => {
        this.issue = issue;
        this.status = issue.status;
        if (issue.expectedCompletionDate) {
          this.expectedCompletionDate = new Date(issue.expectedCompletionDate)
            .toISOString()
            .substring(0, 10);
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load issue details.';
        this.loading = false;
      },
    });
  }

  onSubmitResponse(): void {
    if (!this.issue) return;
    if (!this.comment && !this.expectedCompletionDate && this.status === this.issue.status) {
      this.errorMessage = 'Please provide a comment or update the status/completion date.';
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
      })
      .subscribe({
        next: (updatedIssue) => {
          this.issue = updatedIssue;
          this.comment = '';
          this.submitting = false;
          this.successMessage = 'Response submitted successfully!';
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Failed to submit response.';
        },
      });
  }

  getImageUrl(path: string): string {
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
