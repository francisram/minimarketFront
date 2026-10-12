import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const permissionGuard = (claveRequerida: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    if (authService.hasPermission(claveRequerida)) {
      return true;
    }

    toastService.error('No tienes permisos autorizados para acceder a esta sección.', 'Acceso Restringido');
    router.navigate(['/dashboard']);
    return false;
  };
};

export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const path = (route.routeConfig?.path || '').toLowerCase();
  if (authService.hasPermission(path)) {
    return true;
  }

  toastService.error('Se requieren permisos autorizados para acceder a esta sección.', 'Acceso Restringido');
  router.navigate(['/dashboard']);
  return false;
};
