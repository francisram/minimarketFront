import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Impresora, PruebaImpresionRequest } from '../models/impresora.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ImpresorasService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly impresoras = signal<Impresora[]>([]);
  public readonly cargando = signal<boolean>(false);

  // La API puede exponer /impresoras o /api/impresoras
  private readonly endpoint = `${this.apiUrl}/impresoras`;

  cargarImpresoras(): void {
    this.cargando.set(true);
    this.http.get<Impresora[]>(this.endpoint).pipe(
      catchError(() => {
        // Fallback a /api/impresoras por si está bajo el prefijo api
        return this.http.get<Impresora[]>(`${this.apiUrl}/api/impresoras`);
      })
    ).subscribe({
      next: (data) => {
        this.impresoras.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de impresoras.');
        this.cargando.set(false);
      }
    });
  }

  crear(impresora: Impresora): Observable<Impresora> {
    const payload = this.sanitizarPayload(impresora);
    return this.http.post<Impresora>(this.endpoint, payload).pipe(
      tap(() => {
        this.toast.success(`Impresora "${impresora.nombre}" registrada correctamente.`);
        this.cargarImpresoras();
      })
    );
  }

  actualizar(id: number, impresora: Impresora): Observable<Impresora> {
    const payload = this.sanitizarPayload(impresora);
    return this.http.put<Impresora>(`${this.endpoint}/${id}`, payload).pipe(
      tap(() => {
        this.toast.success(`Impresora "${impresora.nombre}" actualizada.`);
        this.cargarImpresoras();
      })
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.toast.success('Impresora eliminada exitosamente.');
        this.cargarImpresoras();
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          const msg = error.error?.mensaje || 'No se puede eliminar: la impresora está asignada a una ticketera.';
          this.toast.error(msg, 'Conflicto (409)');
        }
        return throwError(() => error);
      })
    );
  }

  probarImpresion(id: number, request: PruebaImpresionRequest): Observable<string> {
    // Usamos responseType 'text' para procesar texto plano tanto en 200 como en 503
    return this.http.post(`${this.endpoint}/${id}/imprimir`, request, { responseType: 'text' }).pipe(
      tap(() => {
        this.toast.success('Prueba de impresión enviada exitosamente.');
      }),
      catchError((err: HttpErrorResponse) => {
        let mensaje = 'Error al enviar prueba de impresión.';
        if (err.status === 503) {
          mensaje = typeof err.error === 'string' && err.error.trim().length > 0 
            ? err.error 
            : (err.error?.mensaje || 'Error 503: Conectividad o impresora no disponible.');
          this.toast.error(mensaje, 'Impresión Fallida (503)', 8000);
        }
        return throwError(() => new Error(mensaje));
      })
    );
  }

  private sanitizarPayload(impresora: Impresora): Impresora {
    const tipo = impresora.tipoConexion.toUpperCase() as 'RED' | 'CUPS';
    if (tipo === 'RED') {
      return {
        nombre: impresora.nombre.trim(),
        tipoConexion: 'RED',
        ip: impresora.ip?.trim(),
        puerto: impresora.puerto ? Number(impresora.puerto) : 9100,
        cola: null
      };
    } else {
      return {
        nombre: impresora.nombre.trim(),
        tipoConexion: 'CUPS',
        ip: impresora.ip?.trim() || undefined,
        puerto: impresora.puerto ? Number(impresora.puerto) : 631,
        cola: impresora.cola?.trim() || ''
      };
    }
  }
}
