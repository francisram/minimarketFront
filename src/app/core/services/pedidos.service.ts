import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoPedido, Pedido, CancelarPedidoRequest } from '../models/pedido.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly pedidos = signal<Pedido[]>([]);
  public readonly cargando = signal<boolean>(false);

  // Obtener fecha actual en formato YYYY-MM-DD
  private getTodayString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  public readonly fechaFiltro = signal<string>(this.getTodayString());
  public readonly estadoFiltro = signal<string>('TODOS');

  cargarPedidos(): void {
    this.cargando.set(true);
    let params = new HttpParams();

    const fecha = this.fechaFiltro();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    const estado = this.estadoFiltro();
    if (estado && estado !== 'TODOS') {
      params = params.set('estado', estado);
    }

    this.http.get<Pedido[]>(`${this.apiUrl}/api/pedidos`, { params }).subscribe({
      next: (data) => {
        this.pedidos.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la lista de pedidos.');
        this.cargando.set(false);
      }
    });
  }

  cambiarEstado(pedidoId: number, nuevoEstado: 'PREPARANDO' | 'LISTO' | 'ENTREGADO'): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/api/pedidos/${pedidoId}/estado`, { nuevoEstado }).pipe(
      tap(() => {
        this.toast.success(`Pedido #${pedidoId} actualizado a ${nuevoEstado}`);
        this.cargarPedidos();
      })
    );
  }

  cancelarPedido(pedidoId: number, dto?: CancelarPedidoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/pedidos/${pedidoId}/cancelar`, dto || {}).pipe(
      tap(() => {
        this.toast.warning(`Pedido #${pedidoId} cancelado y stock reintegrado.`);
        this.cargarPedidos();
      })
    );
  }

  obtenerPorId(pedidoId: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/api/pedidos/${pedidoId}`);
  }

  imprimirTicket(pedidoId: number, impresoraId?: number): Observable<void> {
    let params = new HttpParams();
    if (impresoraId) {
      params = params.set('impresoraId', impresoraId);
    }
    return this.http.post<void>(`${this.apiUrl}/api/pedidos/${pedidoId}/imprimir`, {}, { params }).pipe(
      tap(() => {
        this.toast.success(`Comprobante del pedido #${pedidoId} enviado a la impresora.`);
      })
    );
  }
}
