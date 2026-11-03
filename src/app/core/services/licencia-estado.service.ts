import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENCIAR_ERRORES } from '../interceptors/error.interceptor';
import { LicenciaEstado } from '../models/licencia-estado.model';
import { ToastService } from './toast.service';

/** Estado informativo de la licencia y alerta de retroceso del reloj del servidor. No bloquea la operación. */
@Injectable({ providedIn: 'root' })
export class LicenciaEstadoService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly endpoint = `${environment.apiBaseUrl}/api/licencia`;

  private readonly _estado = signal<LicenciaEstado | null>(null);
  public readonly estado = this._estado.asReadonly();

  /** Hay algo que mostrar: vencida, por vencer, sin licencia o reloj atrasado. */
  public readonly requiereAviso = computed(() => {
    const e = this._estado();
    return !!e && (e.relojRetrocedido || e.estado === 'VENCIDA' || e.estado === 'POR_VENCER' || e.estado === 'SIN_LICENCIA');
  });

  actualizar(): void {
    this.http.get<LicenciaEstado>(`${this.endpoint}/estado`, { context: new HttpContext().set(SILENCIAR_ERRORES, true) })
      .subscribe({ next: e => this._estado.set(e), error: () => { /* se conserva el último estado */ } });
  }

  reconocerReloj() {
    return this.http.post<LicenciaEstado>(`${this.endpoint}/reloj/reconocer`, {}).pipe(
      tap(e => {
        this._estado.set(e);
        this.toast.success('Alerta de reloj reconocida.');
      })
    );
  }
}
