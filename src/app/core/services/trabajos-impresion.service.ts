import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENCIAR_ERRORES } from '../interceptors/error.interceptor';
import {
  EstadoTrabajoImpresion,
  ResumenTrabajosImpresion,
  TrabajoImpresion
} from '../models/trabajo-impresion.model';

/** Cliente del spooler de impresión del backend (cola con reintentos y dead letter). */
@Injectable({ providedIn: 'root' })
export class TrabajosImpresionService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/impresion/trabajos`;
  // El sondeo no debe disparar toasts ni redirecciones si falla: es solo un indicador.
  private readonly contextoSilencioso = new HttpContext().set(SILENCIAR_ERRORES, true);

  private readonly _resumen = signal<ResumenTrabajosImpresion | null>(null);
  public readonly resumen = this._resumen.asReadonly();
  /** Tickets que agotaron los reintentos y requieren acción del cajero. */
  public readonly sinImprimir = computed(() => this._resumen()?.MUERTO ?? 0);

  actualizarResumen(): void {
    this.http.get<ResumenTrabajosImpresion>(`${this.endpoint}/resumen`, { context: this.contextoSilencioso })
      .subscribe({
        next: (r) => this._resumen.set(r),
        error: () => { /* sin conexión o sin permiso: se conserva el último valor conocido */ }
      });
  }

  listar(estado?: EstadoTrabajoImpresion): Observable<TrabajoImpresion[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<TrabajoImpresion[]>(this.endpoint, { params });
  }

  reintentar(id: number): Observable<TrabajoImpresion> {
    return this.http.post<TrabajoImpresion>(`${this.endpoint}/${id}/reintentar`, {}).pipe(
      tap(() => this.actualizarResumen())
    );
  }
}
