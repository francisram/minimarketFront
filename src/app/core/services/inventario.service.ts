import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MovimientoStock,
  RegistrarMovimientoRequest,
  ReporteValorizacion,
  KpisInventario,
  ArticuloInventario
} from '../models/stock.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly kardex = signal<MovimientoStock[]>([]);
  public readonly valorizacion = signal<ReporteValorizacion | null>(null);
  public readonly kpis = signal<KpisInventario | null>(null);
  public readonly articulos = signal<ArticuloInventario[]>([]);

  public readonly cargandoKardex = signal<boolean>(false);
  public readonly cargandoValorizacion = signal<boolean>(false);
  public readonly guardandoMovimiento = signal<boolean>(false);

  obtenerKardex(
    inicio?: string,
    fin?: string,
    tipoItem?: string,
    tipoMovimiento?: string,
    itemId?: number
  ): Observable<MovimientoStock[]> {
    this.cargandoKardex.set(true);
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fin) params = params.set('fin', fin);
    if (tipoItem && tipoItem !== 'TODOS') params = params.set('tipoItem', tipoItem);
    if (tipoMovimiento && tipoMovimiento !== 'TODOS') params = params.set('tipoMovimiento', tipoMovimiento);
    if (itemId) params = params.set('itemId', itemId.toString());

    return this.http.get<MovimientoStock[]>(`${this.apiUrl}/api/inventario/kardex`, { params }).pipe(
      tap(data => this.kardex.set(data || [])),
      catchError(err => {
        const msg = err.error?.mensaje || 'Error al obtener movimientos del Kardex';
        this.toast.error(msg);
        return throwError(() => err);
      }),
      finalize(() => this.cargandoKardex.set(false))
    );
  }

  obtenerValorizacion(): Observable<ReporteValorizacion> {
    this.cargandoValorizacion.set(true);
    return this.http.get<ReporteValorizacion>(`${this.apiUrl}/api/inventario/valorizacion`).pipe(
      tap(data => this.valorizacion.set(data)),
      catchError(err => {
        const msg = err.error?.mensaje || 'Error al consultar valorización del inventario';
        this.toast.error(msg);
        return throwError(() => err);
      }),
      finalize(() => this.cargandoValorizacion.set(false))
    );
  }

  obtenerKpis(inicio?: string, fin?: string): Observable<KpisInventario> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fin) params = params.set('fin', fin);

    return this.http.get<KpisInventario>(`${this.apiUrl}/api/inventario/kpis`, { params }).pipe(
      tap(data => this.kpis.set(data)),
      catchError(err => {
        console.warn('Error al obtener KPIs de inventario', err);
        return throwError(() => err);
      })
    );
  }

  listarArticulos(): Observable<ArticuloInventario[]> {
    return this.http.get<ArticuloInventario[]>(`${this.apiUrl}/api/inventario/articulos`).pipe(
      tap(data => this.articulos.set(data || []))
    );
  }

  registrarMovimiento(request: RegistrarMovimientoRequest): Observable<MovimientoStock> {
    this.guardandoMovimiento.set(true);
    return this.http.post<MovimientoStock>(`${this.apiUrl}/api/inventario/movimientos`, request).pipe(
      tap(res => {
        this.toast.success(`Movimiento '${res.tipoMovimiento}' registrado exitosamente para ${res.itemNombre}.`);
        this.kardex.update(prev => [res, ...prev]);
      }),
      catchError(err => {
        const msg = err.error?.mensaje || 'Error al registrar movimiento de inventario';
        this.toast.error(msg);
        return throwError(() => err);
      }),
      finalize(() => this.guardandoMovimiento.set(false))
    );
  }
}
