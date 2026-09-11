import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Sync current logged in user role directly from database
    if (this.authService.isLoggedIn()) {
      this.authService.getUsers().subscribe({
        next: (users) => {
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            const freshUser = users.find((u) => u._id === currentUser._id || u.email === currentUser.email);
            if (freshUser) {
              const updated = { ...currentUser, role: freshUser.role, name: freshUser.name, department: freshUser.department };
              localStorage.setItem('user', JSON.stringify(updated));
              this.authService.currentUser.set(updated);
            }
          }
        },
        error: (err) => console.error('Navbar user sync:', err),
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
