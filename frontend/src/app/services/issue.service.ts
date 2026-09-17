import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Issue, RespondIssueDto } from '../models/issue.model';

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  private get apiUrl(): string {
    if (typeof window !== 'undefined' && (window as any)['API_URL']) {
      return (window as any)['API_URL'];
    }
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // When accessed via HTTPS (https://eg.hbl.in/KavachComplaintPortal/), use relative endpoint
      // to leverage the existing IIS SSL Certificate on Port 443 (identical to WFMS)
      if (window.location.protocol === 'https:') {
        return '/KavachComplaintPortal/api/issues';
      }
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://127.0.0.1:4915/api/issues';
      }
      return `http://${hostname}:4915/api/issues`;
    }
    return 'http://127.0.0.1:4915/api/issues';
  }

  constructor(private http: HttpClient) {}

  createIssue(formData: FormData): Observable<Issue> {
    return this.http.post<Issue>(this.apiUrl, formData);
  }

  getIssues(filters?: {
    status?: string;
    complaintType?: string;
    complaintCategory?: string;
    zone?: string;
    shed?: string;
    assignedToMe?: boolean;
  }): Observable<Issue[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.complaintType) params = params.set('complaintType', filters.complaintType);
      if (filters.complaintCategory) params = params.set('complaintCategory', filters.complaintCategory);
      if (filters.zone) params = params.set('zone', filters.zone);
      if (filters.shed) params = params.set('shed', filters.shed);
      if (filters.assignedToMe) params = params.set('assignedToMe', 'true');
    }

    return this.http.get<Issue[]>(this.apiUrl, { params });
  }

  getIssueById(id: string): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}`);
  }

  respondToIssue(id: string, dto: RespondIssueDto | FormData): Observable<Issue> {
    return this.http.put<Issue>(`${this.apiUrl}/${id}/respond`, dto);
  }

  updateIssue(id: string, formData: FormData): Observable<Issue> {
    return this.http.put<Issue>(`${this.apiUrl}/${id}`, formData);
  }
}
