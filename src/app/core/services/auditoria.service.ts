import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditoriaLog, ResumenAuditoria, FiltrosAuditoria } from '../models/auditoria.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auditoria`;

  public readonly logs = signal<AuditoriaLog[]>([]);
  public readonly resumen = signal<ResumenAuditoria | null>(null);
  public readonly cargando = signal<boolean>(false);
  public readonly usuarios = signal<string[]>([]);
  public readonly modulos = signal<string[]>([]);
  public readonly acciones = signal<string[]>([]);
  public readonly filtros = signal<FiltrosAuditoria>({});

  cargarLogs(filtros: FiltrosAuditoria = {}): void {
    this.cargando.set(true);
    this.filtros.set(filtros);

    let params = new HttpParams();
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.usuario && filtros.usuario !== 'TODOS') params = params.set('usuario', filtros.usuario);
    if (filtros.modulo && filtros.modulo !== 'TODOS') params = params.set('modulo', filtros.modulo);
    if (filtros.accion && filtros.accion !== 'TODOS') params = params.set('accion', filtros.accion);
    if (filtros.buscar && filtros.buscar.trim()) params = params.set('buscar', filtros.buscar.trim());

    this.http.get<AuditoriaLog[]>(this.apiUrl, { params }).pipe(
      tap(data => {
        this.logs.set(data || []);
        this.cargando.set(false);
      }),
      catchError(err => {
        console.error('Error cargando logs de auditoría:', err);
        this.toast.error('Error al cargar la bitácora de auditoría');
        this.logs.set([]);
        this.cargando.set(false);
        return of([]);
      })
    ).subscribe();

    this.http.get<ResumenAuditoria>(`${this.apiUrl}/resumen`, { params }).pipe(
      tap(res => this.resumen.set(res)),
      catchError(() => of(null))
    ).subscribe();
  }

  cargarFiltrosMetadatos(): void {
    this.http.get<string[]>(`${this.apiUrl}/usuarios`).pipe(
      tap(users => this.usuarios.set(users || [])),
      catchError(() => of([]))
    ).subscribe();

    this.http.get<string[]>(`${this.apiUrl}/modulos`).pipe(
      tap(mods => this.modulos.set(mods || [])),
      catchError(() => of([]))
    ).subscribe();

    this.http.get<string[]>(`${this.apiUrl}/acciones`).pipe(
      tap(accs => this.acciones.set(accs || [])),
      catchError(() => of([]))
    ).subscribe();
  }
}
