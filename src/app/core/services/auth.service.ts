import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap, map, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CambiarPasswordRequest, LoginRequest, LoginResponse, UserSession } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiBaseUrl;

  private readonly _session = signal<UserSession | null>(this.loadSessionFromStorage());
  public readonly session = this._session.asReadonly();

  private readonly _permisos = signal<string[]>(this.loadPermisosFromStorage());
  public readonly permisos = this._permisos.asReadonly();

  public readonly isAuthenticated = computed(() => !!this._session()?.token);
  public readonly token = computed(() => this._session()?.token ?? null);
  public readonly username = computed(() => this._session()?.username ?? '');
  public readonly role = computed(() => this._session()?.rol ?? '');
  public readonly isAdminOrOwner = computed(() => {
    const r = (this.role() || '').toUpperCase();
    return r === 'ADMIN' || r === 'OWNER' || r === 'ROLE_ADMIN' || r === 'ROLE_OWNER';
  });
  public readonly isCajero = computed(() => {
    const r = (this.role() || '').toUpperCase();
    return r === 'CAJERO' || r === 'ROLE_CAJERO';
  });

  constructor() {
    if (this.isAuthenticated()) {
      this.cargarPermisosDeRol().subscribe();
    }
  }

  private loadSessionFromStorage(): UserSession | null {
    try {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      const rol = localStorage.getItem('rol');
      if (token && username && rol) {
        return { token, username, rol };
      }
    } catch (e) {
      console.error('Error leyendo sesión del almacenamiento local', e);
    }
    return null;
  }

  private loadPermisosFromStorage(): string[] {
    try {
      const p = localStorage.getItem('permisos');
      if (p) return JSON.parse(p);
    } catch (e) {
      console.error('Error leyendo permisos del almacenamiento local', e);
    }
    return [];
  }

  public actualizarPermisos(paginas: string[]): void {
    const limpios = (paginas || []).map(p => p.toLowerCase());
    try {
      localStorage.setItem('permisos', JSON.stringify(limpios));
    } catch {}
    this._permisos.set(limpios);
  }

  public cargarPermisosDeRol(nombreRol?: string): Observable<string[]> {
    const rolBuscado = (nombreRol || this.role() || '').toUpperCase();
    if (!rolBuscado) return of([]);
    return this.http.get<any[]>(`${this.apiUrl}/api/roles`).pipe(
      map((roles) => {
        const miRol = roles.find(r => (r.nombre || '').toUpperCase() === rolBuscado);
        if (miRol && miRol.paginas) {
          this.actualizarPermisos(miRol.paginas);
          return miRol.paginas;
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  public hasPermission(clave: string): boolean {
    if (this.isAdminOrOwner()) {
      return true;
    }
    const c = (clave || '').toLowerCase();
    // 'pos' y 'monitor-pedidos' se autorizan bajo 'pedidos' o sus claves directas
    if (c === 'pos' || c === 'monitor-pedidos') {
      return this._permisos().some(p => p === 'pedidos' || p === 'pos' || p === c);
    }
    if (c === 'compras') {
      return this._permisos().some(p => p === 'compras' || p === 'proveedores' || p === 'stock');
    }
    if (c === 'catalogos') {
      return this._permisos().some(p => ['catalogos', 'productos', 'sabores', 'presentaciones', 'toppings', 'categorias'].includes(p));
    }
    if (c === 'categorias') {
      return this._permisos().some(p => p === 'categorias' || p === 'productos' || p === 'sabores');
    }
    return this._permisos().some(p => p === c);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/login`, credentials).pipe(
      tap(res => {
        const session: UserSession = {
          token: res.token,
          username: res.username,
          rol: res.rol
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', res.username);
        localStorage.setItem('rol', res.rol);
        this._session.set(session);
      }),
      switchMap(res => {
        if (this.isAdminOrOwner()) {
          return of(res);
        }
        return this.cargarPermisosDeRol(res.rol).pipe(
          map(() => res)
        );
      })
    );
  }

  cambiarPassword(request: CambiarPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/auth/cambiar-password`, request);
  }

  logout(redirect: boolean = true): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('rol');
    localStorage.removeItem('permisos');
    this._session.set(null);
    this._permisos.set([]);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }
}
