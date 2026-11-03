import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmitirNotaCreditoRequest, FacturaParaNotaCredito, NotaCredito, SerieNotaCredito } from '../models/nota-credito.model';

@Injectable({ providedIn: 'root' })
export class NotasCreditoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/notas-credito`;

  facturaDePedido(pedidoId: number): Observable<FacturaParaNotaCredito> {
    return this.http.get<FacturaParaNotaCredito>(`${this.base}/pedido/${pedidoId}`);
  }

  emitir(pedidoId: number, request: EmitirNotaCreditoRequest): Observable<NotaCredito> {
    return this.http.post<NotaCredito>(`${this.base}/pedido/${pedidoId}`, request);
  }

  guardarSerie(puntoId: number, serie: SerieNotaCredito): Observable<SerieNotaCredito> {
    return this.http.put<SerieNotaCredito>(`${this.base}/serie/${puntoId}`, serie);
  }
}
