import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap, map, of, catchError, throwError, finalize, shareReplay } from 'rxjs';
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
  public readonly isOwner = computed(() => {
    const r = (this.role() || '').toUpperCase();
    return r === 'OWNER' || r === 'ROLE_OWNER';
  });
  public readonly isCajero = computed(() => {
    const r = (this.role() || '').toUpperCase();
    return r === 'CAJERO' || r === 'ROLE_CAJERO';
  });

  /** Renovación en curso: las peticiones que fallan a la vez comparten una sola llamada. */
  private renovacion$: Observable<string> | null = null;
  private temporizadorRenovacion: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (this.isAuthenticated()) {
      this.cargarPermisosDeRol().subscribe();
      this.programarRenovacion();
    }
    // Otra pestaña renovó o cerró la sesión: esta se alinea en vez de usar un token de refresco ya rotado
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', e => {
        if (e.key === 'token' || e.key === 'refreshToken') {
          this._session.set(this.loadSessionFromStorage());
          this.programarRenovacion();
        }
      });
    }
  }

  private loadSessionFromStorage(): UserSession | null {
    try {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      const rol = localStorage.getItem('rol');
      if (token && username && rol) {
        return { token, username, rol, refreshToken: localStorage.getItem('refreshToken') ?? undefined };
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

  /** Usuario del último intento de login: si el servidor exige cambiar la contraseña, la pantalla de cambio lo reutiliza. */
  public static readonly CLAVE_USUARIO_PENDIENTE = 'login_usuario_pendiente';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    sessionStorage.setItem(AuthService.CLAVE_USUARIO_PENDIENTE, credentials.username);
    return this.iniciarSesion(this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/login`, credentials));
  }

  /** Cambia la contraseña (obligatoria o voluntaria) y, si el servidor lo acepta, deja la sesión iniciada. */
  cambiarPassword(request: CambiarPasswordRequest): Observable<LoginResponse> {
    return this.iniciarSesion(this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/cambiar-password`, request));
  }

  private iniciarSesion(respuesta$: Observable<LoginResponse>): Observable<LoginResponse> {
    return respuesta$.pipe(
      tap(res => {
        this.guardarSesion(res);
        sessionStorage.removeItem(AuthService.CLAVE_USUARIO_PENDIENTE);
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

  private guardarSesion(res: LoginResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('username', res.username);
    localStorage.setItem('rol', res.rol);
    if (res.refreshToken) {
      localStorage.setItem('refreshToken', res.refreshToken);
    }
    this._session.set({
      token: res.token,
      username: res.username,
      rol: res.rol,
      refreshToken: res.refreshToken ?? this._session()?.refreshToken
    });
    this.programarRenovacion();
  }

  /** Vencimiento (ms epoch) del token de acceso, leído de su claim "exp"; null si no se puede leer. */
  private vencimientoToken(token: string | null): number | null {
    try {
      const payload = JSON.parse(atob((token ?? '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /** Renueva el token un minuto antes de que venza para que el cajero nunca note el cambio. */
  private programarRenovacion(): void {
    if (this.temporizadorRenovacion) {
      clearTimeout(this.temporizadorRenovacion);
      this.temporizadorRenovacion = null;
    }
    const exp = this.vencimientoToken(this.token());
    if (!exp || !this._session()?.refreshToken) {
      return;
    }
    const espera = Math.max(exp - Date.now() - 60_000, 5_000);
    this.temporizadorRenovacion = setTimeout(() => {
      this.renovarToken().subscribe({ error: () => {} });
    }, espera);
  }

  /**
   * Pide un token de acceso nuevo con el de refresco. Si otra pestaña ya lo renovó, usa ese en vez de gastar
   * el token de refresco (que se rota y solo sirve una vez). Emite el token de acceso nuevo.
   */
  renovarToken(): Observable<string> {
    if (this.renovacion$) {
      return this.renovacion$;
    }
    const enMemoria = this._session();
    const enAlmacen = this.loadSessionFromStorage();
    if (enAlmacen && enMemoria && enAlmacen.token !== enMemoria.token) {
      const exp = this.vencimientoToken(enAlmacen.token);
      if (exp && exp > Date.now() + 5_000) {
        this._session.set(enAlmacen);
        this.programarRenovacion();
        return of(enAlmacen.token);
      }
    }
    const refreshToken = (enAlmacen ?? enMemoria)?.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('Sin token de renovación'));
    }
    this.renovacion$ = this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
      tap(res => this.guardarSesion(res)),
      map(res => res.token),
      finalize(() => { this.renovacion$ = null; }),
      shareReplay(1)
    );
    return this.renovacion$;
  }

  logout(redirect: boolean = true): void {
    // Cierra la sesión también en el servidor: el token copiado deja de servir aunque no haya vencido
    const refreshToken = this._session()?.refreshToken ?? localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/api/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    if (this.temporizadorRenovacion) {
      clearTimeout(this.temporizadorRenovacion);
      this.temporizadorRenovacion = null;
    }
    localStorage.removeItem('refreshToken');
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
