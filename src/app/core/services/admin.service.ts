import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, Rol, Licencia, PlanLicencia, Pagina } from '../models/admin.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly usuarios = signal<Usuario[]>([]);
  public readonly roles = signal<Rol[]>([]);
  public readonly paginasDisponibles = signal<Pagina[]>([]);
  public readonly licencia = signal<Licencia | null>(null);
  public readonly planesLicencia = signal<PlanLicencia[]>([]);
  public readonly cargando = signal<boolean>(false);

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.http.get<Usuario[]>(`${this.apiUrl}/api/usuarios`).subscribe({
      next: (data) => {
        this.usuarios.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de usuarios.');
        this.cargando.set(false);
      }
    });
  }

  crearUsuario(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/api/usuarios`, usuario).pipe(
      tap((creado) => {
        this.toast.success(`Usuario "${creado.username}" creado exitosamente.`);
        this.cargarUsuarios();
      })
    );
  }

  actualizarUsuario(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/api/usuarios/${id}`, usuario).pipe(
      tap((actualizado) => {
        this.toast.success(`Usuario "${actualizado.username}" actualizado.`);
        this.cargarUsuarios();
      })
    );
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/usuarios/${id}`).pipe(
      tap(() => {
        this.toast.success('Usuario eliminado.');
        this.cargarUsuarios();
      })
    );
  }

  cargarRoles(): void {
    this.http.get<Rol[]>(`${this.apiUrl}/api/roles`).subscribe({
      next: (data) => this.roles.set(data || []),
      error: () => this.toast.error('No se pudieron cargar los roles.')
    });
  }

  crearRol(rol: { nombre: string; paginas: string[] }): Observable<Rol> {
    return this.http.post<Rol>(`${this.apiUrl}/api/roles`, rol).pipe(
      tap((creado) => {
        this.toast.success(`Rol "${creado.nombre}" creado exitosamente.`);
        this.cargarRoles();
      })
    );
  }

  actualizarRol(id: number, rol: Partial<Rol>): Observable<Rol> {
    return this.http.put<Rol>(`${this.apiUrl}/api/roles/${id}`, rol).pipe(
      tap((actualizado) => {
        this.toast.success(`Rol "${actualizado.nombre}" actualizado.`);
        this.cargarRoles();
      })
    );
  }

  eliminarRol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/roles/${id}`).pipe(
      tap(() => {
        this.toast.success('Rol eliminado.');
        this.cargarRoles();
      })
    );
  }

  cargarPaginasDisponibles(): void {
    this.http.get<Pagina[]>(`${this.apiUrl}/api/paginas/disponibles`).subscribe({
      next: (data) => this.paginasDisponibles.set(data || []),
      error: () => {}
    });
  }

  cargarLicencia(): void {
    this.http.get<Licencia>(`${this.apiUrl}/api/licencia`).subscribe({
      next: (data) => this.licencia.set(data || null),
      error: () => this.toast.error('No se pudo obtener la información de licencia.')
    });

    this.http.get<PlanLicencia[]>(`${this.apiUrl}/api/planes-licencia`).subscribe({
      next: (data) => this.planesLicencia.set(data || []),
      error: () => {}
    });
  }
}
