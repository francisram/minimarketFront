import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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
    this._session.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }
}
