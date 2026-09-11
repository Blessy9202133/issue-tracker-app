import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Issue, RespondIssueDto } from '../models/issue.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  private apiUrl = 'http://localhost:5000/api/issues';

  constructor(private http: HttpClient, private authService: AuthService) {}

  createIssue(formData: FormData): Observable<Issue> {
    return this.http.post<Issue>(this.apiUrl, formData, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  getIssues(filters?: {
    status?: string;
    complaintCategory?: string;
    zone?: string;
    shed?: string;
    assignedToMe?: boolean;
  }): Observable<Issue[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.complaintCategory) params = params.set('complaintCategory', filters.complaintCategory);
      if (filters.zone) params = params.set('zone', filters.zone);
      if (filters.shed) params = params.set('shed', filters.shed);
      if (filters.assignedToMe) params = params.set('assignedToMe', 'true');
    }

    return this.http.get<Issue[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params,
    });
  }

  getIssueById(id: string): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  respondToIssue(id: string, dto: RespondIssueDto): Observable<Issue> {
    return this.http.put<Issue>(`${this.apiUrl}/${id}/respond`, dto, {
      headers: this.authService.getAuthHeaders(),
    });
  }
}
