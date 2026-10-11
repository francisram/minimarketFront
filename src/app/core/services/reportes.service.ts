import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardReporteDTO,
  ReporteVentasDTO,
  LibroVentasIvaDTO,
  ReporteCajasDTO,
  RankingProductosDTO,
  FiltroReportes,
  FiltroVentas,
  FiltroCajas
} from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly endpoint = `${this.apiUrl}/api/reportes`;

  obtenerDashboard(filtros: FiltroReportes): Observable<DashboardReporteDTO> {
    let params = this.construirParamsFechas(filtros);
    return this.http.get<DashboardReporteDTO>(`${this.endpoint}/dashboard`, { params });
  }

  obtenerVentas(filtros: FiltroVentas): Observable<ReporteVentasDTO> {
    let params = this.construirParamsFechas(filtros);
    if (filtros.metodoPago && filtros.metodoPago !== 'TODOS') {
      params = params.set('metodoPago', filtros.metodoPago);
    }
    if (filtros.tipoComprobante && filtros.tipoComprobante !== 'TODOS') {
      params = params.set('tipoComprobante', filtros.tipoComprobante);
    }
    if (filtros.tipoEntrega && filtros.tipoEntrega !== 'TODOS') {
      params = params.set('tipoEntrega', filtros.tipoEntrega);
    }
    if (filtros.cajero && filtros.cajero.trim() !== '') {
      params = params.set('cajero', filtros.cajero.trim());
    }
    if (filtros.trxId && filtros.trxId.trim() !== '') {
      params = params.set('trxId', filtros.trxId.trim());
    }
    return this.http.get<ReporteVentasDTO>(`${this.endpoint}/ventas`, { params });
  }

  obtenerLibroIva(filtros: FiltroReportes): Observable<LibroVentasIvaDTO> {
    let params = this.construirParamsFechas(filtros);
    return this.http.get<LibroVentasIvaDTO>(`${this.endpoint}/libro-iva`, { params });
  }

  descargarLibroIvaCsv(filtros: FiltroReportes): Observable<Blob> {
    let params = this.construirParamsFechas(filtros);
    return this.http.get(`${this.endpoint}/libro-iva/csv`, {
      params,
      responseType: 'blob'
    });
  }

  obtenerCajas(filtros: FiltroCajas): Observable<ReporteCajasDTO> {
    let params = this.construirParamsFechas(filtros);
    if (filtros.usuario && filtros.usuario.trim() !== '') {
      params = params.set('usuario', filtros.usuario.trim());
      params = params.set('cajero', filtros.usuario.trim());
    }
    return this.http.get<ReporteCajasDTO>(`${this.endpoint}/cajas`, { params });
  }

  obtenerRankingProductos(filtros: FiltroReportes, limite: number = 10): Observable<RankingProductosDTO> {
    let params = this.construirParamsFechas(filtros);
    params = params.set('limite', limite.toString());
    return this.http.get<RankingProductosDTO>(`${this.endpoint}/ranking-productos`, { params });
  }

  descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private construirParamsFechas(filtros: FiltroReportes): HttpParams {
    let params = new HttpParams();
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
      params = params.set('desde', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
      params = params.set('hasta', filtros.fechaFin);
    }
    return params;
  }
}
