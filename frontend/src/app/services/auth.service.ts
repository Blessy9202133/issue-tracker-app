import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private get baseUrl(): string {
    if (typeof window !== 'undefined' && (window as any)['API_URL']) {
      return `${(window as any)['API_URL']}/auth`;
    }
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      return `${protocol}//${hostname}:4915/api/auth`;
    }
    return 'https://eg.hbl.in:4915/api/auth';
  }

  // Angular Signal for reactive current user state
  currentUser = signal<UserProfile | null>(this.getStoredUser());
  isLoggedIn = signal<boolean>(!!this.getStoredToken());

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('ccp_auth_token');
    }
    return null;
  }

  private getStoredUser(): UserProfile | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem('ccp_user_profile');
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res && res.token) {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('ccp_auth_token', res.token);
            localStorage.setItem('ccp_user_profile', JSON.stringify(res.user));
          }
          this.currentUser.set(res.user);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  register(userData: { name: string; username: string; email: string; password: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, userData).pipe(
      tap((res) => {
        if (res && res.token) {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('ccp_auth_token', res.token);
            localStorage.setItem('ccp_user_profile', JSON.stringify(res.user));
          }
          this.currentUser.set(res.user);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('ccp_auth_token');
      localStorage.removeItem('ccp_user_profile');
    }
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  forgotPassword(username: string): Observable<{ message: string; resetLink?: string }> {
    return this.http.post<{ message: string; resetLink?: string }>(`${this.baseUrl}/forgot-password`, { username });
  }

  resetPassword(hash: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, { hash, password });
  }
}
