import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401: No autenticado / token expirado
      if (error.status === 401) {
        authService.logout(false);
        toastService.error('Sesión expirada o inválida. Por favor, inicia sesión.', 'Sesión requerida');
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // 403: Prohibido / contraseña expirada / sin permisos
      if (error.status === 403) {
        const errorBody = error.error;
        let isPasswordExpired = false;

        if (typeof errorBody === 'object' && errorBody !== null) {
          if (errorBody.error?.includes('Contraseña expirada') || 
              errorBody.mensaje?.includes('Contraseña expirada') ||
              errorBody.error?.includes('cambio requerido')) {
            isPasswordExpired = true;
          }
        } else if (typeof errorBody === 'string' && (errorBody.includes('Contraseña expirada') || errorBody.includes('cambio requerido'))) {
          isPasswordExpired = true;
        }

        if (isPasswordExpired) {
          toastService.warning('Tu contraseña ha expirado o requiere cambio.', 'Cambio Obligatorio');
          router.navigate(['/cambiar-password']);
        } else {
          toastService.error('Acceso denegado. No tienes permisos para esta acción.', '403 Prohibido');
        }
        return throwError(() => error);
      }

      // 503: Servicio no disponible (ej. error en texto plano al imprimir)
      if (error.status === 503) {
        let mensaje = 'Servicio no disponible temporalmente.';
        if (typeof error.error === 'string' && error.error.trim().length > 0) {
          mensaje = error.error;
        } else if (error.error?.mensaje) {
          mensaje = error.error.mensaje;
        }
        toastService.error(mensaje, 'Error de Servicio (503)');
        return throwError(() => error);
      }

      // 400: Error de validación o solicitud inválida
      if (error.status === 400) {
        if (error.error?.mensaje) {
          toastService.warning(error.error.mensaje, 'Datos inválidos');
        } else if (error.error?.error) {
          toastService.warning(error.error.error, 'Datos inválidos');
        }
      }

      // Otros errores del servidor
      if (error.status >= 500 && error.status !== 503) {
        toastService.error('Ocurrió un error inesperado en el servidor.', 'Error del Servidor');
      }

      return throwError(() => error);
    })
  );
};
