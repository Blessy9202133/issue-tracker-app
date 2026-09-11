import { Component, inject } from '@angular/core';
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
  email = '';
  username = '';
  phoneNumber = '';
  password = '';
  role = 'Customer';
  errorMessage = '';
  loading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    if (!this.name || !this.email || !this.username || !this.phoneNumber || !this.password) {
      this.errorMessage = 'Please fill in all required fields (Name, Email, Username, Phone Number, and Password).';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .register({
        name: this.name,
        email: this.email,
        username: this.username,
        phoneNumber: this.phoneNumber,
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Registration failed.';
        },
      });
  }
}
