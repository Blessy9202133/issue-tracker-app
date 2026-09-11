import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
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
export class IssueDetailComponent implements OnInit, OnDestroy {
  // Angular Signals for instant template change detection
  loading = signal<boolean>(true);
  issue = signal<Issue | null>(null);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  submitting = signal<boolean>(false);
  users = signal<User[]>([]);

  // Form Fields
  comment = '';
  expectedCompletionDate = '';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' = 'IN_PROGRESS';
  reassignTo = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private issueService = inject(IssueService);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private routeSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadUsers();
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadIssue(id);
      } else {
        this.loading.set(false);
        this.errorMessage.set('Invalid complaint ID.');
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching users for re-assignment:', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  loadIssue(id: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    this.issueService.getIssueById(id).subscribe({
      next: (issueData) => {
        this.issue.set(issueData);
        if (issueData) {
          this.status = issueData.status || 'OPEN';
          this.reassignTo = issueData.assignedTo?._id || '';
          if (issueData.expectedCompletionDate) {
            this.expectedCompletionDate = new Date(issueData.expectedCompletionDate)
              .toISOString()
              .substring(0, 10);
          }
        }
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching complaint details:', err);
        this.loading.set(false);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (err.status === 0) {
          this.errorMessage.set('Backend API server on http://127.0.0.1:5000 is not running. Please start the backend using: cd backend && npm run dev');
        } else {
          this.errorMessage.set(err.error?.message || 'Failed to load complaint details from server.');
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  onSubmitResponse(): void {
    const currentIssue = this.issue();
    if (!currentIssue) return;

    const isReassigned = this.reassignTo && this.reassignTo !== currentIssue.assignedTo?._id;

    if (!this.comment && !this.expectedCompletionDate && !isReassigned && this.status === currentIssue.status) {
      this.errorMessage.set('Please provide a comment, update completion date, change status, or re-assign to a department.');
      this.cdr.markForCheck();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    this.issueService
      .respondToIssue(currentIssue._id, {
        comment: this.comment,
        expectedCompletionDate: this.expectedCompletionDate,
        status: this.status,
        reassignTo: this.reassignTo,
      })
      .subscribe({
        next: (updatedIssue) => {
          this.issue.set(updatedIssue);
          this.comment = '';
          this.submitting.set(false);
          this.successMessage.set(
            isReassigned
              ? `Complaint re-assigned to ${updatedIssue.assignedTo?.name} (${updatedIssue.assignedTo?.department || 'Department'})!`
              : 'Response submitted successfully!'
          );
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          } else {
            this.errorMessage.set(err.error?.message || 'Failed to submit response.');
          }
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
      });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:5000${path}`;
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
