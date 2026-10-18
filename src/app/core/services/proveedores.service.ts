import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proveedor, ProveedorRequest } from '../models/proveedor.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly proveedores = signal<Proveedor[]>([]);
  public readonly cargando = signal<boolean>(false);

  cargarProveedores(filtro?: string, soloActivos?: boolean): void {
    this.cargando.set(true);
    let params = new HttpParams();
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    if (soloActivos) {
      params = params.set('soloActivos', 'true');
    }

    this.http.get<Proveedor[]>(`${this.apiUrl}/api/proveedores`, { params }).subscribe({
      next: (data) => {
        this.proveedores.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de proveedores.');
        this.cargando.set(false);
      }
    });
  }

  listar(filtro?: string, soloActivos?: boolean): Observable<Proveedor[]> {
    let params = new HttpParams();
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    if (soloActivos) {
      params = params.set('soloActivos', 'true');
    }
    return this.http.get<Proveedor[]>(`${this.apiUrl}/api/proveedores`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  buscarPorRuc(ruc: string): Observable<Proveedor | null> {
    if (!ruc || ruc.trim().length === 0) {
      return of(null);
    }
    const params = new HttpParams().set('ruc', ruc.trim());
    return this.http.get<Proveedor>(`${this.apiUrl}/api/proveedores/buscar`, { params }).pipe(
      catchError(() => of(null))
    );
  }

  crear(dto: ProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.apiUrl}/api/proveedores`, dto).pipe(
      tap((creado) => {
        this.toast.success(`Proveedor "${creado.razonSocial}" registrado exitosamente.`);
        this.cargarProveedores();
      })
    );
  }

  actualizar(id: number, dto: ProveedorRequest): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/api/proveedores/${id}`, dto).pipe(
      tap((actualizado) => {
        this.toast.success(`Proveedor "${actualizado.razonSocial}" actualizado.`);
        this.cargarProveedores();
      })
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.apiUrl}/api/proveedores/${id}/estado`, null, {
      params: new HttpParams().set('activo', activo.toString())
    }).pipe(
      tap((actualizado) => {
        this.toast.success(`Proveedor ${activo ? 'activado' : 'desactivado'}.`);
        this.cargarProveedores();
      })
    );
  }
}
