import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { IssueService } from '../../services/issue.service';
import { Issue } from '../../models/issue.model';

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
  closing = signal<boolean>(false);
  showAnalysisModal = signal<boolean>(false);

  // Form / Analysis Fields
  comment = '';
  expectedCompletionDate = '';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' = 'IN_PROGRESS';
  analysisText = '';
  actionTakenText = '';
  preventiveActionText = '';
  analysisComplaintType = '';
  analysisStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' = 'OPEN';
  isEditingAnalysis = false;
  submittingAnalysis = signal<boolean>(false);
  savingType = signal<boolean>(false);
  typeUpdateSuccess = signal<string>('');

  // Analysis Files / Photos
  selectedAnalysisFiles: File[] = [];
  analysisFilePreviews: { name: string; isImage: boolean; previewUrl?: string }[] = [];
  existingAnalysisPhotos: string[] = [];

  complaintTypes = ['NMS', 'Application Related', 'Others'];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private issueService = inject(IssueService);
  private cdr = inject(ChangeDetectorRef);
  private routeSub: Subscription | null = null;

  ngOnInit(): void {
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

  loadIssue(id: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    this.issueService.getIssueById(id).subscribe({
      next: (issueData) => {
        this.issue.set(issueData);
        if (issueData) {
          this.status = issueData.status || 'OPEN';
          this.analysisText = issueData.analysis || '';
          this.actionTakenText = issueData.actionTaken || '';
          this.preventiveActionText = issueData.preventiveAction || '';
          this.analysisComplaintType = issueData.complaintType || '';
          this.analysisStatus = issueData.status || 'OPEN';
          this.isEditingAnalysis = !issueData.analysis;
          this.existingAnalysisPhotos = issueData.analysisPhotos ? [...issueData.analysisPhotos] : [];
          this.selectedAnalysisFiles = [];
          this.analysisFilePreviews = [];
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
        if (err.status === 0) {
          this.errorMessage.set('Backend API server on http://127.0.0.1:5000 is not running. Please start the backend using: cd backend && npm run dev');
        } else {
          this.errorMessage.set(err.error?.message || 'Failed to load complaint details from server.');
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  onCloseComplaint(): void {
    const currentIssue = this.issue();
    if (!currentIssue) return;

    if (!currentIssue.complaintType && !this.analysisComplaintType) {
      this.errorMessage.set('Please select Type of Complaint in the Analysis section before closing the ticket.');
      this.isEditingAnalysis = true;
      this.cdr.markForCheck();
      return;
    }

    this.closing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    this.issueService
      .respondToIssue(currentIssue._id, {
        status: 'CLOSED',
        complaintType: this.analysisComplaintType || currentIssue.complaintType,
      })
      .subscribe({
        next: (updatedIssue) => {
          this.issue.set(updatedIssue);
          this.closing.set(false);
          this.analysisStatus = 'CLOSED';
          this.successMessage.set('Complaint has been marked as Closed.');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.closing.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to close complaint.');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
      });
  }

  onReopenComplaint(): void {
    const currentIssue = this.issue();
    if (!currentIssue) return;

    this.closing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    this.issueService
      .respondToIssue(currentIssue._id, {
        status: 'OPEN',
      })
      .subscribe({
        next: (updatedIssue) => {
          this.issue.set(updatedIssue);
          this.closing.set(false);
          this.analysisStatus = 'OPEN';
          this.successMessage.set('Complaint has been reopened.');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.closing.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to reopen complaint.');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
      });
  }

  onAnalysisFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles: File[] = Array.from(files);
      this.selectedAnalysisFiles = [...this.selectedAnalysisFiles, ...newFiles];

      newFiles.forEach((file) => {
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.analysisFilePreviews.push({ name: file.name, isImage: true, previewUrl: e.target.result });
            this.cdr.markForCheck();
          };
          reader.readAsDataURL(file);
        } else {
          this.analysisFilePreviews.push({ name: file.name, isImage: false });
        }
      });
      this.cdr.markForCheck();
      // Reset input element so user can choose the same file again if desired
      event.target.value = '';
    }
  }

  removeSelectedAnalysisFile(index: number): void {
    this.selectedAnalysisFiles.splice(index, 1);
    this.analysisFilePreviews.splice(index, 1);
    this.cdr.markForCheck();
  }

  removeExistingAnalysisPhoto(index: number): void {
    this.existingAnalysisPhotos.splice(index, 1);
    this.cdr.markForCheck();
  }

  onSaveAnalysis(): void {
    const currentIssue = this.issue();
    if (!currentIssue) return;

    if (!this.analysisComplaintType) {
      this.errorMessage.set('Please select Type of Complaint.');
      this.cdr.markForCheck();
      return;
    }

    if (!this.analysisText.trim()) {
      this.errorMessage.set('Please provide Root Cause / Technical Analysis.');
      this.cdr.markForCheck();
      return;
    }

    this.submittingAnalysis.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    const formData = new FormData();
    formData.append('analysis', this.analysisText.trim());
    formData.append('actionTaken', this.actionTakenText.trim());
    formData.append('preventiveAction', this.preventiveActionText.trim());
    formData.append('complaintType', this.analysisComplaintType);
    formData.append('status', 'CLOSED');
    formData.append('existingAnalysisPhotos', JSON.stringify(this.existingAnalysisPhotos));

    this.selectedAnalysisFiles.forEach((file) => {
      formData.append('analysisPhotos', file);
    });

    this.issueService
      .respondToIssue(currentIssue._id, formData)
      .subscribe({
        next: (updatedIssue) => {
          this.issue.set(updatedIssue);
          this.submittingAnalysis.set(false);
          this.isEditingAnalysis = false;
          this.analysisStatus = 'CLOSED';
          this.selectedAnalysisFiles = [];
          this.analysisFilePreviews = [];
          this.existingAnalysisPhotos = updatedIssue.analysisPhotos ? [...updatedIssue.analysisPhotos] : [];
          this.showAnalysisModal.set(true);
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.submittingAnalysis.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to save analysis.');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
      });
  }

  closeAnalysisModal(): void {
    this.showAnalysisModal.set(false);
    this.router.navigate(['/dashboard']);
  }

  onEditAnalysis(): void {
    const currentIssue = this.issue();
    this.existingAnalysisPhotos = currentIssue?.analysisPhotos ? [...currentIssue.analysisPhotos] : [];
    this.selectedAnalysisFiles = [];
    this.analysisFilePreviews = [];
    this.isEditingAnalysis = true;
    this.cdr.markForCheck();
  }

  onCancelEditAnalysis(): void {
    const currentIssue = this.issue();
    if (currentIssue) {
      this.analysisText = currentIssue.analysis || '';
      this.actionTakenText = currentIssue.actionTaken || '';
      this.preventiveActionText = currentIssue.preventiveAction || '';
      this.analysisComplaintType = currentIssue.complaintType || '';
      this.analysisStatus = currentIssue.status || 'OPEN';
      this.existingAnalysisPhotos = currentIssue.analysisPhotos ? [...currentIssue.analysisPhotos] : [];
    }
    this.selectedAnalysisFiles = [];
    this.analysisFilePreviews = [];
    this.isEditingAnalysis = false;
    this.cdr.markForCheck();
  }

  onQuickTypeChange(newType: string): void {
    const currentIssue = this.issue();
    if (!currentIssue || !newType || newType === currentIssue.complaintType) return;

    this.savingType.set(true);
    this.analysisComplaintType = newType;
    this.errorMessage.set('');
    this.typeUpdateSuccess.set('');
    this.cdr.markForCheck();

    this.issueService
      .respondToIssue(currentIssue._id, {
        complaintType: newType,
      })
      .subscribe({
        next: (updatedIssue) => {
          this.issue.set(updatedIssue);
          this.savingType.set(false);
          this.typeUpdateSuccess.set('✓ Type updated');
          setTimeout(() => {
            this.typeUpdateSuccess.set('');
            this.cdr.markForCheck();
          }, 3000);
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingType.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update complaint type.');
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

  isImage(path: string): boolean {
    if (!path) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  }

  getFileName(path: string): string {
    if (!path) return 'File';
    return path.split('/').pop()?.split('\\').pop() || 'File';
  }

  getStatusLabel(issue: Issue | null): string {
    if (!issue) return '';
    if (issue.status === 'CLOSED' || issue.status === 'RESOLVED' || issue.analysis) {
      return 'ANALYSED';
    }
    return 'YET TO ANALYZE';
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
}
