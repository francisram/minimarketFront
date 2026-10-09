import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ReporteAlertasStock, 
  AjusteStockPresentacion, 
  AjusteStockSabor, 
  AjusteStockProducto 
} from '../models/stock.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly reporte = signal<ReporteAlertasStock | null>(null);
  public readonly cargando = signal<boolean>(false);

  public readonly totalAlertas = computed(() => this.reporte()?.totalAlertas ?? 0);
  public readonly totalAgotados = computed(() => this.reporte()?.totalAgotados ?? 0);
  public readonly totalBajoStock = computed(() => this.reporte()?.totalBajoStock ?? 0);

  public readonly presentacionesBajoStock = computed(() => this.reporte()?.presentacionesBajoStock ?? []);
  public readonly saboresBajoStock = computed(() => this.reporte()?.saboresBajoStock ?? []);
  public readonly productosBajoStock = computed(() => this.reporte()?.productosBajoStock ?? []);

  cargarAlertas(): void {
    this.cargando.set(true);
    this.http.get<ReporteAlertasStock>(`${this.apiUrl}/api/stock/alertas`).pipe(
      tap(data => {
        this.reporte.set(data || {
          productosBajoStock: [],
          saboresBajoStock: [],
          presentacionesBajoStock: [],
          totalAlertas: 0,
          totalAgotados: 0,
          totalBajoStock: 0
        });
        this.cargando.set(false);
      }),
      catchError(err => {
        console.warn('Error al consultar alertas de stock:', err);
        this.cargando.set(false);
        return of(null);
      })
    ).subscribe();
  }

  ajustarStockPresentacion(id: number, payload: AjusteStockPresentacion): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/stock/presentaciones/${id}`, payload).pipe(
      tap(() => {
        this.toast.success('Stock de envase / cucurucho actualizado.');
        this.cargarAlertas();
      })
    );
  }

  ajustarStockSabor(id: number, payload: AjusteStockSabor): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/stock/sabores/${id}`, payload).pipe(
      tap(() => {
        this.toast.success('Kilos de sabor en bacha actualizados.');
        this.cargarAlertas();
      })
    );
  }

  ajustarStockProducto(id: number, payload: AjusteStockProducto): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/stock/productos/${id}`, payload).pipe(
      tap(() => {
        this.toast.success('Stock de producto simple actualizado.');
        this.cargarAlertas();
      })
    );
  }
}
