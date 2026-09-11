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
  // Template Selector: 'WAYSIDE' or 'ONBOARD'
  complaintCategory: 'WAYSIDE' | 'ONBOARD' = 'WAYSIDE';

  // Common Fields
  zone = 'South Central Railway';
  contract = '';
  details = '';
  issueRaisedDate = new Date().toISOString().substring(0, 10);
  assignedTo = '';
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  // Wayside Fields
  station = '';
  complaintType = 'NMS';

  // Onboard Fields
  shed = '';
  locoNumber = '';
  locoType = 'WAP-7';
  brakeType = 'E-70';
  failureType = '';
  poLoaNumber = '';

  users: User[] = [];
  loadingUsers = true;
  submitting = false;
  errorMessage = '';
  successMessage = '';

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

  complaintTypes = [
    'NMS',
    'Application Related',
    'Others',
  ];

  locoTypes = [
    'WAP-7',
    'WAP-5',
    'WAP-9',
    'WAP-4',
    'WAG-7',
    'WAG-9',
    'WAG-9I',
    'WAG-9H',
    'WAG-9HC',
    'WAG-10HC',
    'WDG',
    'WDG-2',
    'WDG-3',
    'WDG-3A',
    'EMU',
    'MEMU',
    'Vande Bharat',
    'Amrit Bharat',
    'WDM',
    'WDM-3',
    'WDS-6',
    'EF-9K',
  ];

  brakeTypes = [
    'E-70',
    'CCB',
    'IRAB',
    'Conventional',
    'RCCB',
    'ESCORT',
  ];

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
          // Default to HBL Admin user if present, else first user
          const adminUser = users.find((u) => u.role === 'ADMIN' || u.email === 'admin@hbl.com' || u.name.includes('HBL'));
          this.assignedTo = adminUser ? adminUser._id : users[0]._id;
        }
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.loadingUsers = false;
      },
    });
  }

  setCategory(category: 'WAYSIDE' | 'ONBOARD'): void {
    this.complaintCategory = category;
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
    if (!this.zone || !this.details) {
      this.errorMessage = 'Please complete all required fields (Zone and Description).';
      return;
    }

    if (this.complaintCategory === 'WAYSIDE' && !this.station) {
      this.errorMessage = 'Station is required for Wayside complaints.';
      return;
    }

    if (this.complaintCategory === 'ONBOARD' && (!this.shed || !this.locoNumber)) {
      this.errorMessage = 'Shed Name and Loco Number are required for Onboard complaints.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('complaintCategory', this.complaintCategory);
    formData.append('zone', this.zone);
    formData.append('contract', this.contract);
    formData.append('details', this.details);
    formData.append('issueRaisedDate', this.issueRaisedDate);
    formData.append('assignedTo', this.assignedTo);

    if (this.complaintCategory === 'WAYSIDE') {
      formData.append('station', this.station);
      formData.append('complaintType', this.complaintType);
    } else {
      formData.append('shed', this.shed);
      formData.append('locoNumber', this.locoNumber);
      formData.append('locoType', this.locoType);
      formData.append('brakeType', this.brakeType);
      formData.append('failureType', this.failureType);
      formData.append('poLoaNumber', this.poLoaNumber);
    }

    this.selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    this.issueService.createIssue(formData).subscribe({
      next: (createdIssue) => {
        this.submitting = false;
        this.successMessage = `Complaint ${createdIssue.issueCode} logged successfully! Routed to HBL Admin for department allocation.`;
        setTimeout(() => {
          this.router.navigate(['/issues', createdIssue._id]);
        }, 1500);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit complaint.';
      },
    });
  }
}
