import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Ante un 401 intenta renovar el token de acceso una vez y reintenta la petición.
 * Es el interceptor más cercano al servidor (el último de la lista), así que el de errores solo ve el resultado final
 * y también quedan cubiertos los sondeos silenciosos.
 * Solo si la renovación falla el 401 llega al interceptor de errores, que cierra la sesión.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const esAuth = req.url.includes('/api/auth/');
      if (error.status !== 401 || esAuth || !authService.isAuthenticated()) {
        return throwError(() => error);
      }
      return authService.renovarToken().pipe(
        switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
        catchError(() => throwError(() => error))
      );
    })
  );
};
