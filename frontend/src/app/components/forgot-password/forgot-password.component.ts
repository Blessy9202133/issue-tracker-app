import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  username = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  resetLink = signal<string | null>(null);

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.username.trim()) {
      this.errorMessage.set('Please enter your Username or Email.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.resetLink.set(null);

    this.authService.forgotPassword(this.username.trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message || 'Password reset link sent successfully.');
        if (res.resetLink) {
          this.resetLink.set(res.resetLink);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to request password reset. Please try again.';
        this.errorMessage.set(msg);
      },
    });
  }
}
