import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IssueService } from '../../services/issue.service';
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
  complaintTypeFilter = '';
  statusFilter = '';
  complaintCategoryFilter = '';
  zoneFilter = '';
  shedFilter = '';

  complaintTypes = ['Application Data', 'Loco Kavach Maintenance Issue','Stationary Kavach Maintenance Issue','Kavach Software Issue','Inter-Operability Issue','RFID Tag Issue','Other Kavach OEM Issue','Railway Issue', 'Others'];

  // Computed metrics from reactive signal
  totalCount = computed(() => this.issues().length);
  openCount = computed(() => this.issues().filter((i) => i.status === 'OPEN').length);
  inProgressCount = computed(() => this.issues().filter((i) => i.status === 'IN_PROGRESS').length);
  analysedCount = computed(() => this.issues().filter((i) => !!i.analysis || i.status === 'RESOLVED' || i.status === 'CLOSED').length);
  resolvedCount = computed(() => this.analysedCount());

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
  private cdr = inject(ChangeDetectorRef);

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
        complaintType: this.complaintTypeFilter,
        complaintCategory: this.complaintCategoryFilter,
        zone: this.zoneFilter,
        shed: this.shedFilter,
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
          if (err.status === 0) {
            this.errorMessage.set('Unable to connect to the backend server. Please verify the backend service is running.');
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
      case 'ANALYSED':
      case 'RESOLVED':
      case 'CLOSED':
        return 'badge-resolved';
      default:
        return '';
    }
  }

  getStatusLabel(issue: Issue): string {
    if (issue.status === 'CLOSED' || issue.status === 'RESOLVED' || issue.analysis) {
      return 'ANALYSED';
    }
    return 'YET TO ANALYZE';
  }
}
