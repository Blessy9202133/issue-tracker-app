import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IssueService } from '../../services/issue.service';

@Component({
  selector: 'app-create-issue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-issue.component.html',
  styleUrl: './create-issue.component.css',
})
export class CreateIssueComponent implements OnInit {
  // Mode & Edit tracking
  isEditMode = signal<boolean>(false);
  editId = signal<string>('');
  issueCode = signal<string>('');
  loadingComplaint = signal<boolean>(false);

  // Form Fields
  zone = '';
  contract = '';
  station = '';
  locoNumber = '';
  details = '';
  issueRaisedDateDisplay = signal<string>(this.formatDateTimeDisplay(new Date()));
  existingPhotos = signal<string[]>([]);
  selectedFiles: File[] = [];
  filePreviews: { name: string; isImage: boolean; previewUrl?: string }[] = [];

  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((queryParams) => {
      const qId = queryParams.get('id');
      if (qId) {
        this.loadComplaint(qId);
      } else {
        const pId = this.route.snapshot.paramMap.get('id');
        if (pId) {
          this.loadComplaint(pId);
        }
      }
    });
  }

  loadComplaint(id: string): void {
    this.isEditMode.set(true);
    this.editId.set(id);
    this.loadingComplaint.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    this.issueService.getIssueById(id).subscribe({
      next: (issue) => {
        if (issue.status === 'CLOSED') {
          this.loadingComplaint.set(false);
          this.errorMessage.set('This complaint is CLOSED and cannot be edited. Redirecting...');
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/issues', id]);
          }, 1200);
          return;
        }

        this.zone = issue.zone || '';
        this.contract = issue.contract || '';
        this.station = issue.station || '';
        this.locoNumber = issue.locoNumber || '';
        this.details = issue.details || '';
        this.issueRaisedDateDisplay.set(this.formatDateTimeDisplay(issue.issueRaisedDate));
        this.existingPhotos.set(issue.photos || []);
        this.issueCode.set(issue.issueCode || '');
        this.loadingComplaint.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingComplaint.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load complaint details.');
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  formatDateTimeDisplay(dateInput?: string | Date): string {
    if (!dateInput) return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles: File[] = Array.from(files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];

      newFiles.forEach((file) => {
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.filePreviews.push({ name: file.name, isImage: true, previewUrl: e.target.result });
            this.cdr.markForCheck();
          };
          reader.readAsDataURL(file);
        } else {
          this.filePreviews.push({ name: file.name, isImage: false });
        }
      });
      this.cdr.markForCheck();
      event.target.value = '';
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
    this.cdr.markForCheck();
  }

  removeExistingPhoto(index: number): void {
    const photos = [...this.existingPhotos()];
    photos.splice(index, 1);
    this.existingPhotos.set(photos);
    this.cdr.markForCheck();
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

  getWordCount(text: string): number {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    return words.length;
  }

  onSubmit(): void {
    if (!this.zone || !this.details) {
      this.errorMessage.set('Please complete all required fields (Zone and Description).');
      this.cdr.markForCheck();
      return;
    }

    if (this.getWordCount(this.details) > 1000) {
      this.errorMessage.set('Complaint Description exceeds the limit of 1,000 words. Please shorten your description.');
      this.cdr.markForCheck();
      return;
    }

    if (!this.contract) {
      this.errorMessage.set('Division is required.');
      this.cdr.markForCheck();
      return;
    }

    if (this.locoNumber && this.locoNumber.trim() && !/^\d+$/.test(this.locoNumber.trim())) {
      this.errorMessage.set('Loco Number must contain only digits.');
      this.cdr.markForCheck();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    const formData = new FormData();
    formData.append('zone', this.zone);
    formData.append('contract', this.contract.trim());
    formData.append('details', this.details.trim());
    formData.append('station', this.station ? this.station.trim() : '');
    formData.append('locoNumber', this.locoNumber ? this.locoNumber.trim() : '');

    if (this.isEditMode()) {
      formData.append('existingPhotos', JSON.stringify(this.existingPhotos()));
      this.selectedFiles.forEach((file) => {
        formData.append('photos', file);
      });

      this.issueService.updateIssue(this.editId(), formData).subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set('Complaint updated successfully! Redirecting to dashboard...');
          this.cdr.markForCheck();
          this.cdr.detectChanges();

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 400);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update complaint.');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
      });
    } else {
      formData.append('issueRaisedDate', new Date().toISOString());
      formData.append('complaintCategory', 'WAYSIDE');
      this.selectedFiles.forEach((file) => {
        formData.append('photos', file);
      });

      this.issueService.createIssue(formData).subscribe({
        next: (createdIssue) => {
          this.submitting.set(false);
          this.successMessage.set(`Complaint ${createdIssue.issueCode} logged successfully! Redirecting to dashboard...`);
          this.errorMessage.set('');
          this.cdr.markForCheck();
          this.cdr.detectChanges();

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 400);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to submit complaint.');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
      });
    }
  }
}
