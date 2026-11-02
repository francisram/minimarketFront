import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PuntoExpedicion, PuntoExpedicionRequest } from '../models/punto-expedicion.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PuntoExpedicionService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiBaseUrl}/api/puntos-expedicion`;

  public readonly puntos = signal<PuntoExpedicion[]>([]);
  public readonly puntosDisponibles = signal<PuntoExpedicion[]>([]);
  public readonly cargando = signal<boolean>(false);

  listarTodos(): Observable<PuntoExpedicion[]> {
    this.cargando.set(true);
    return this.http.get<PuntoExpedicion[]>(this.apiUrl).pipe(
      tap({
        next: (data) => {
          this.puntos.set(data || []);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      })
    );
  }

  listarDisponibles(): Observable<PuntoExpedicion[]> {
    return this.http.get<PuntoExpedicion[]>(`${this.apiUrl}/disponibles`).pipe(
      tap((data) => this.puntosDisponibles.set(data || []))
    );
  }

  obtenerPorId(id: number): Observable<PuntoExpedicion> {
    return this.http.get<PuntoExpedicion>(`${this.apiUrl}/${id}`);
  }

  crear(req: PuntoExpedicionRequest): Observable<PuntoExpedicion> {
    return this.http.post<PuntoExpedicion>(this.apiUrl, req).pipe(
      tap((nuevo) => {
        this.toast.success(`Punto de expedición ${nuevo.prefijoLegal} (${nuevo.nombre}) creado correctamente.`);
        this.listarTodos().subscribe();
      })
    );
  }

  actualizar(id: number, req: PuntoExpedicionRequest): Observable<PuntoExpedicion> {
    return this.http.put<PuntoExpedicion>(`${this.apiUrl}/${id}`, req).pipe(
      tap((actualizado) => {
        this.toast.success(`Punto de expedición ${actualizado.prefijoLegal} actualizado.`);
        this.listarTodos().subscribe();
      })
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<PuntoExpedicion> {
    return this.http.patch<PuntoExpedicion>(`${this.apiUrl}/${id}/estado`, { activo }).pipe(
      tap((actualizado) => {
        this.toast.info(`Punto ${actualizado.prefijoLegal} ${activo ? 'activado' : 'desactivado'}.`);
        this.listarTodos().subscribe();
      })
    );
  }
}
