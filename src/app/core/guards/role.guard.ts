import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (authService.isAdminOrOwner()) {
    return true;
  }

  toastService.error('Se requieren permisos de Administrador para acceder a esta sección.', 'Acceso Restringido');
  router.navigate(['/pos']);
  return false;
};
