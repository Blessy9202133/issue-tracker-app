import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = false;

  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private returnUrl = '/create-issue';

  ngOnInit(): void {
    // Check if password reset hash is present in query parameters or window location
    const hashFromParam = this.route.snapshot.queryParams['hash'];
    let hashFromSearch: string | null = null;
    if (typeof window !== 'undefined' && window.location.search) {
      hashFromSearch = new URLSearchParams(window.location.search).get('hash');
    }
    const resetHash = hashFromParam || hashFromSearch;

    if (resetHash) {
      this.router.navigate(['/reset-password'], { queryParams: { hash: resetHash } });
      return;
    }

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/create-issue']);
      return;
    }

    const qReturn = this.route.snapshot.queryParams['returnUrl'];
    if (qReturn) {
      this.returnUrl = qReturn;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.username?.trim() || !this.password?.trim()) {
      this.errorMessage.set('Please enter both Username and Password.');
      this.cdr.markForCheck();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set('Login successful! Redirecting...');
        this.cdr.markForCheck();
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 300);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please check your credentials.');
        this.cdr.markForCheck();
      },
    });
  }
}
