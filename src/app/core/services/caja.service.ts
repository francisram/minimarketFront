import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';
import {
  EstadoCaja,
  ResumenCaja,
  SesionCaja,
  AbrirCajaRequest,
  CerrarCajaRequest
} from '../models/caja.model';

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  private readonly _estadoCaja = signal<EstadoCaja | null>(null);
  public readonly estadoCaja = this._estadoCaja.asReadonly();

  private readonly _resumenCaja = signal<ResumenCaja | null>(null);
  public readonly resumenCaja = this._resumenCaja.asReadonly();

  private readonly _historial = signal<SesionCaja[]>([]);
  public readonly historial = this._historial.asReadonly();

  private readonly _cajasAbiertas = signal<SesionCaja[]>([]);
  public readonly cajasAbiertas = this._cajasAbiertas.asReadonly();

  public readonly cargando = signal<boolean>(false);
  public readonly procesando = signal<boolean>(false);

  // Computeds reactivos
  public readonly cajaAbierta = computed(() => {
    return this._estadoCaja()?.abierta ?? false;
  });

  public readonly sesionActivaId = computed(() => {
    return this._estadoCaja()?.sesionId ?? null;
  });

  public readonly cajeroActivo = computed(() => {
    return this._estadoCaja()?.cajeroApertura ?? '';
  });

  public readonly fechaAperturaActiva = computed(() => {
    return this._estadoCaja()?.fechaApertura ?? null;
  });

  public readonly montoInicialActivo = computed(() => {
    return this._estadoCaja()?.montoInicial ?? 0;
  });

  cargarEstado(): Observable<EstadoCaja> {
    return this.http.get<EstadoCaja>(`${this.apiUrl}/api/caja/estado`).pipe(
      tap(estado => {
        this._estadoCaja.set(estado);
        if (estado.abierta) {
          this.cargarResumen().subscribe();
        } else {
          this._resumenCaja.set(null);
        }
        this.cargarCajasAbiertas().subscribe();
      }),
      catchError(err => {
        console.warn('Error al verificar estado de caja:', err);
        this.cargarCajasAbiertas().subscribe();
        return of({ abierta: false, sesionId: null, cajeroApertura: null, fechaApertura: null, montoInicial: null });
      })
    );
  }

  cargarResumen(sesionId?: number): Observable<ResumenCaja> {
    const url = sesionId ? `${this.apiUrl}/api/caja/resumen?sesionId=${sesionId}` : `${this.apiUrl}/api/caja/resumen`;
    return this.http.get<ResumenCaja>(url).pipe(
      tap(resumen => {
        this._resumenCaja.set(resumen);
      }),
      catchError(err => {
        console.warn('Error al cargar resumen de caja:', err);
        return of({} as ResumenCaja);
      })
    );
  }

  cargarCajasAbiertas(): Observable<SesionCaja[]> {
    return this.http.get<SesionCaja[]>(`${this.apiUrl}/api/caja/abiertas`).pipe(
      tap(cajas => {
        this._cajasAbiertas.set(cajas || []);
      }),
      catchError(() => {
        // Fallback: extraer las sesiones abiertas del historial si el endpoint específico no está listo
        const abiertas = this._historial().filter(s => s.estado === 'ABIERTA');
        this._cajasAbiertas.set(abiertas);
        return of(abiertas);
      })
    );
  }

  abrirCaja(request: AbrirCajaRequest): Observable<SesionCaja> {
    this.procesando.set(true);
    return this.http.post<SesionCaja>(`${this.apiUrl}/api/caja/abrir`, request).pipe(
      tap(sesion => {
        this.procesando.set(false);
        this._estadoCaja.set({
          abierta: true,
          sesionId: sesion.id,
          cajeroApertura: sesion.usuarioApertura,
          fechaApertura: sesion.fechaApertura,
          montoInicial: sesion.montoInicial
        });
        this.cargarResumen().subscribe();
        this.cargarCajasAbiertas().subscribe();
        this.cargarHistorial().subscribe();
      }),
      catchError(err => {
        this.procesando.set(false);
        return throwError(() => err);
      })
    );
  }

  cerrarCaja(request: CerrarCajaRequest): Observable<SesionCaja> {
    this.procesando.set(true);
    return this.http.post<SesionCaja>(`${this.apiUrl}/api/caja/cerrar`, request).pipe(
      tap(sesion => {
        this.procesando.set(false);
        // Si el usuario cerró su propia caja o no especificó ID, limpiar estado local
        if (!request.sesionId || request.sesionId === this.sesionActivaId()) {
          this._estadoCaja.set({
            abierta: false,
            sesionId: null,
            cajeroApertura: null,
            fechaApertura: null,
            montoInicial: null
          });
          this._resumenCaja.set(null);
        }
        // Refrescar estado global del usuario, historial y lista de cajas abiertas
        this.cargarEstado().subscribe();
        this.cargarCajasAbiertas().subscribe();
        this.cargarHistorial().subscribe();
      }),
      catchError(err => {
        this.procesando.set(false);
        return throwError(() => err);
      })
    );
  }

  cargarHistorial(): Observable<SesionCaja[]> {
    this.cargando.set(true);
    return this.http.get<SesionCaja[]>(`${this.apiUrl}/api/caja/historial`).pipe(
      tap(historial => {
        this._historial.set(historial || []);
        this.cargando.set(false);
      }),
      catchError(err => {
        this.cargando.set(false);
        console.warn('Error al cargar historial de caja:', err);
        return of([]);
      })
    );
  }

  obtenerDetalle(id: number): Observable<SesionCaja> {
    return this.http.get<SesionCaja>(`${this.apiUrl}/api/caja/${id}`);
  }
}
