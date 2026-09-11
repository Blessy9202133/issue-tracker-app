import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  // Angular Signals for instant template rendering
  issues = signal<Issue[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Filters
  statusFilter = '';
  complaintCategoryFilter = '';
  zoneFilter = '';
  shedFilter = '';
  assignedToMeFilter = false;

  // Computed metrics from reactive signal
  totalCount = computed(() => this.issues().length);
  openCount = computed(() => this.issues().filter((i) => i.status === 'OPEN').length);
  inProgressCount = computed(() => this.issues().filter((i) => i.status === 'IN_PROGRESS').length);
  resolvedCount = computed(() => this.issues().filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length);

  zones = [
    'Central Railway',
    'Konkan Railway',
    'Metro Railway in Kolkata',
    'Northern Railway',
    'North Central Railway',
    'North Eastern Railway',
    'Northeast Frontier Railway',
    'North Western Railway',
    'Eastern Railway',
    'East Central Railway',
    'East Coast Railway',
    'Southern Railway',
    'South Central Railway',
    'South Coast Railway',
    'South Eastern Railway',
    'South East Central Railway',
    'South Western Railway',
    'Western Railway',
    'West Central Railway',
  ];

  private issueService = inject(IssueService);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  ngOnInit(): void {
    this.fetchIssues();
  }

  fetchIssues(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    this.issueService
      .getIssues({
        status: this.statusFilter,
        complaintCategory: this.complaintCategoryFilter,
        zone: this.zoneFilter,
        shed: this.shedFilter,
        assignedToMe: this.assignedToMeFilter,
      })
      .subscribe({
        next: (issuesList) => {
          this.issues.set(issuesList || []);
          this.loading.set(false);
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading complaints on dashboard:', err);
          this.loading.set(false);
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          } else if (err.status === 0) {
            this.errorMessage.set('Backend API server on http://127.0.0.1:5000 is not running. Please start the backend using: cd backend && npm run dev');
          } else {
            this.errorMessage.set(err.error?.message || 'Failed to load complaints from server.');
          }
          this.cdr.markForCheck();
          this.cdr.detectChanges();
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
}
