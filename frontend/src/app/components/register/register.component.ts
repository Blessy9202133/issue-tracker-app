import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
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
export class RegisterComponent implements OnInit {
  securityPasscode = '';
  showPasscode = false;
  isPasscodeVerified = signal<boolean>(false);

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

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.isPasscodeVerified.set(true);
    }
  }

  togglePasscodeVisibility(): void {
    this.showPasscode = !this.showPasscode;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  verifyPasscode(): void {
    if (!this.securityPasscode?.trim()) {
      this.errorMessage.set('Please enter the security passcode.');
      this.cdr.markForCheck();
      return;
    }

    const input = this.securityPasscode.trim();
    const validKeys = ['Admin#2026', 'HBL#2026', 'Admin2026', 'HBL2026', '2026', 'admin', 'Strong#2026'];

    if (validKeys.includes(input)) {
      this.isPasscodeVerified.set(true);
      this.errorMessage.set('');
      this.cdr.markForCheck();
      return;
    }

    // Also check if passcode works as admin login password
    this.authService.login({ username: 'admin', password: input }).subscribe({
      next: () => {
        this.isPasscodeVerified.set(true);
        this.errorMessage.set('');
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage.set('Incorrect security passcode. Access denied.');
        this.cdr.markForCheck();
      },
    });
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
          this.successMessage.set('Account created successfully! Redirecting...');
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/create-issue']);
          }, 600);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
          this.cdr.markForCheck();
        },
      });
  }
}
