import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if URL has password reset hash parameter
  const hashFromParam = route.queryParams['hash'];
  let hashFromSearch: string | null = null;
  if (typeof window !== 'undefined' && window.location.search) {
    hashFromSearch = new URLSearchParams(window.location.search).get('hash');
  }
  const resetHash = hashFromParam || hashFromSearch;

  if (resetHash) {
    return router.createUrlTree(['/reset-password'], { queryParams: { hash: resetHash } });
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect unauthenticated user to login page with returnUrl query parameter
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
