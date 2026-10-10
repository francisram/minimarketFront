import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteRequest } from '../models/cliente.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly clientes = signal<Cliente[]>([]);
  public readonly cargando = signal<boolean>(false);

  cargarClientes(filtro?: string): void {
    this.cargando.set(true);
    let params = new HttpParams();
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }

    this.http.get<Cliente[]>(`${this.apiUrl}/api/clientes`, { params }).subscribe({
      next: (data) => {
        this.clientes.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de clientes.');
        this.cargando.set(false);
      }
    });
  }

  listar(filtro?: string): Observable<Cliente[]> {
    let params = new HttpParams();
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    return this.http.get<Cliente[]>(`${this.apiUrl}/api/clientes`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  buscarPorRuc(ruc: string): Observable<Cliente | null> {
    if (!ruc || ruc.trim().length === 0) {
      return of(null);
    }
    const params = new HttpParams().set('ruc', ruc.trim());
    return this.http.get<Cliente>(`${this.apiUrl}/api/clientes/buscar`, { params }).pipe(
      catchError(() => of(null))
    );
  }

  crear(dto: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/api/clientes`, dto).pipe(
      tap((creado) => {
        this.toast.success(`Cliente "${creado.razonSocial}" registrado exitosamente.`);
        this.cargarClientes();
      })
    );
  }

  actualizar(id: number, dto: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/api/clientes/${id}`, dto).pipe(
      tap((actualizado) => {
        this.toast.success(`Cliente "${actualizado.razonSocial}" actualizado.`);
        this.cargarClientes();
      })
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}/api/clientes/${id}/estado`, null, {
      params: new HttpParams().set('activo', activo.toString())
    }).pipe(
      tap((actualizado) => {
        this.toast.success(`Cliente ${activo ? 'activado' : 'desactivado'}.`);
        this.cargarClientes();
      })
    );
  }
}
