import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IssueService } from '../../services/issue.service';
import { AuthService } from '../../services/auth.service';
import { Issue } from '../../models/issue.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  issues: Issue[] = [];
  loading = true;

  // Filters
  statusFilter = '';
  complaintCategoryFilter = '';
  zoneFilter = '';
  shedFilter = '';
  assignedToMeFilter = false;

  private issueService = inject(IssueService);
  authService = inject(AuthService);

  ngOnInit(): void {
    this.fetchIssues();
  }

  fetchIssues(): void {
    this.loading = true;
    this.issueService
      .getIssues({
        status: this.statusFilter,
        complaintCategory: this.complaintCategoryFilter,
        zone: this.zoneFilter,
        shed: this.shedFilter,
        assignedToMe: this.assignedToMeFilter,
      })
      .subscribe({
        next: (issues) => {
          this.issues = issues;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading complaints:', err);
          this.loading = false;
        },
      });
  }

  onFilterChange(): void {
    this.fetchIssues();
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

  get totalCount(): number {
    return this.issues.length;
  }
  get openCount(): number {
    return this.issues.filter((i) => i.status === 'OPEN').length;
  }
  get inProgressCount(): number {
    return this.issues.filter((i) => i.status === 'IN_PROGRESS').length;
  }
  get resolvedCount(): number {
    return this.issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  }
}
