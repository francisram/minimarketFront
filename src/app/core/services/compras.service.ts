import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Compra, RegistroCompraRequest } from '../models/compra.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly compras = signal<Compra[]>([]);
  public readonly cargando = signal<boolean>(false);

  cargarCompras(proveedorId?: number | null, fechaDesde?: string | null, fechaHasta?: string | null, buscar?: string | null): void {
    this.cargando.set(true);
    let params = new HttpParams();
    if (proveedorId) {
      params = params.set('proveedorId', proveedorId.toString());
    }
    if (fechaDesde) {
      params = params.set('fechaDesde', fechaDesde);
    }
    if (fechaHasta) {
      params = params.set('fechaHasta', fechaHasta);
    }
    if (buscar && buscar.trim().length > 0) {
      params = params.set('buscar', buscar.trim());
    }

    this.http.get<Compra[]>(`${this.apiUrl}/api/compras`, { params }).subscribe({
      next: (data) => {
        this.compras.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el listado de facturas de compra.');
        this.cargando.set(false);
      }
    });
  }

  obtenerPorId(id: number): Observable<Compra> {
    return this.http.get<Compra>(`${this.apiUrl}/api/compras/${id}`);
  }

  registrarCompra(request: RegistroCompraRequest): Observable<Compra> {
    return this.http.post<Compra>(`${this.apiUrl}/api/compras`, request).pipe(
      tap(() => {
        this.toast.success('Factura de compra registrada con éxito. Stock ingresado.');
        this.cargarCompras();
      })
    );
  }

  anularCompra(id: number, motivo?: string): Observable<Compra> {
    const body = motivo ? { motivo } : {};
    return this.http.post<Compra>(`${this.apiUrl}/api/compras/${id}/anular`, body).pipe(
      tap(() => {
        this.toast.warning('Factura de compra anulada y stock revertido.');
        this.cargarCompras();
      })
    );
  }
}
