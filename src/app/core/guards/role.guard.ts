import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const adminService = inject(AdminService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (authService.isAdminOrOwner()) {
    return true;
  }

  // Verificar si el rol del usuario tiene asignada la página solicitada
  const path = (route.routeConfig?.path || '').toLowerCase();
  const userRoleName = (authService.role() || '').toUpperCase();
  const currentRole = adminService.roles().find(r => r.nombre.toUpperCase() === userRoleName);

  if (currentRole && currentRole.paginas && currentRole.paginas.some(p => p.toLowerCase() === path)) {
    return true;
  }

  toastService.error('Se requieren permisos autorizados para acceder a esta sección.', 'Acceso Restringido');
  router.navigate(['/pos']);
  return false;
};
