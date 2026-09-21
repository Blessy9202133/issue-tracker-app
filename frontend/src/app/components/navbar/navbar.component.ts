import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  public authService = inject(AuthService);
  public router = inject(Router);

  isMainPage(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '/create-issue';
  }

  isAuthPage(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/login' || url === '/register';
  }

  logout(): void {
    this.authService.logout();
  }
}
