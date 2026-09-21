import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  name = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;

  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.name?.trim() || !this.username?.trim() || !this.email?.trim() || !this.password?.trim()) {
      this.errorMessage.set('Please fill out all required fields.');
      this.cdr.markForCheck();
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match. Please re-enter passwords.');
      this.cdr.markForCheck();
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      this.cdr.markForCheck();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    this.authService
      .register({
        name: this.name.trim(),
        username: this.username.trim(),
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set('Account created successfully! Logging you in...');
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/create-issue']);
          }, 400);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
          this.cdr.markForCheck();
        },
      });
  }
}
