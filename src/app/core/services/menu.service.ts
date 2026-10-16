import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../models/pagina.model';
import { AuthService } from './auth.service';
import { AdminService } from './admin.service';

export interface MenuItem {
  clave: string;
  nombre: string;
  ruta: string;
  icono: string;
  adminOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly apiUrl = environment.apiBaseUrl;

  private readonly _paginasDisponibles = signal<Pagina[]>([]);
  public readonly paginasDisponibles = this._paginasDisponibles.asReadonly();
  public readonly cargando = signal<boolean>(false);

  // Mapeo canónico de módulos del sistema
  private readonly catalogoBase: MenuItem[] = [
    { clave: 'dashboard', nombre: 'Dashboard', ruta: '/dashboard', icono: 'layout-dashboard' },
    { clave: 'caja', nombre: 'Control de Caja', ruta: '/caja', icono: 'banknote' },
    { clave: 'pedidos', nombre: 'Punto de Venta (POS)', ruta: '/pos', icono: 'shopping-cart' },
    { clave: 'monitor-pedidos', nombre: 'Monitor de Pedidos', ruta: '/pedidos', icono: 'clipboard-list' },
    { clave: 'clientes', nombre: 'Clientes', ruta: '/clientes', icono: 'users' },
    { clave: 'stock', nombre: 'Inventario & Stock', ruta: '/stock', icono: 'warehouse', adminOnly: true },
    { clave: 'auditoria', nombre: 'Auditoría & Conteo Físico', ruta: '/auditoria', icono: 'clipboard-check', adminOnly: true },
    { clave: 'reportes', nombre: 'Reportes y Analítica', ruta: '/reportes', icono: 'bar-chart-3', adminOnly: true },
    { clave: 'sabores', nombre: 'Sabores', ruta: '/catalogos/sabores', icono: 'ice-cream' },
    { clave: 'presentaciones', nombre: 'Presentaciones', ruta: '/catalogos/presentaciones', icono: 'cup-soda' },
    { clave: 'toppings', nombre: 'Toppings', ruta: '/catalogos/toppings', icono: 'sparkles' },
    { clave: 'productos', nombre: 'Bebidas y Cafetería', ruta: '/catalogos/productos', icono: 'coffee' },
    { clave: 'impresoras', nombre: 'Impresoras ESC/POS', ruta: '/impresoras', icono: 'printer', adminOnly: true },
    { clave: 'usuarios', nombre: 'Usuarios', ruta: '/usuarios', icono: 'user', adminOnly: true },
    { clave: 'roles', nombre: 'Roles y Permisos', ruta: '/roles', icono: 'shield', adminOnly: true },
    { clave: 'licencia', nombre: 'Licencia', ruta: '/licencia', icono: 'verified', adminOnly: true },
    { clave: 'institucion', nombre: 'Datos del Negocio', ruta: '/institucion', icono: 'building', adminOnly: true },
    { clave: 'backup', nombre: 'Copias de Seguridad', ruta: '/backup', icono: 'database', adminOnly: true }
  ];

  public readonly menuItems = computed<MenuItem[]>(() => {
    const paginas = this._paginasDisponibles();
    const isAdminOrOwner = this.authService.isAdminOrOwner();

    // Claves licenciadas en el sistema
    const clavesDisponibles = new Set(paginas.map(p => p.clave?.toLowerCase()));

    return this.catalogoBase.filter(item => {
      const clave = item.clave.toLowerCase();

      // 1. Si no es admin ni owner, el rol del usuario DEBE tener explícitamente el permiso
      if (!isAdminOrOwner) {
        if (item.clave === 'monitor-pedidos') {
          if (!this.authService.hasPermission('pedidos')) return false;
        } else if (!this.authService.hasPermission(clave)) {
          return false;
        }
      }

      // 2. Módulos esenciales de administración para ADMIN / OWNER:
      if (isAdminOrOwner && ['stock', 'auditoria', 'reportes', 'impresoras', 'institucion', 'dashboard', 'caja', 'clientes', 'pedidos', 'backup'].includes(item.clave)) {
        return true;
      }

      // 3. Submódulo de monitor de pedidos vinculado a la clave 'pedidos'
      if (item.clave === 'monitor-pedidos') {
        return clavesDisponibles.size === 0 || clavesDisponibles.has('pedidos');
      }

      // 4. Si aún no hay páginas cargadas desde el backend, mostrar según rol
      if (clavesDisponibles.size === 0) {
        return true;
      }

      // 5. Módulos licenciados estándar en el plan
      return clavesDisponibles.has(clave);
    });
  });

  cargarPaginasDisponibles(): void {
    if (!this.authService.isAuthenticated()) return;
    // Si es un operador/cajero sin permisos de administración, no requiere consultar la licencia de páginas
    if (!this.authService.isAdminOrOwner() && !this.authService.hasPermission('roles') && !this.authService.hasPermission('licencia')) {
      return;
    }

    this.cargando.set(true);
    this.adminService.cargarRoles();

    this.http.get<Pagina[]>(`${this.apiUrl}/api/paginas/disponibles`).pipe(
      tap(paginas => {
        this._paginasDisponibles.set(paginas || []);
        this.cargando.set(false);
      }),
      catchError(err => {
        console.warn('No se pudieron obtener páginas por licencia. Usando catálogo predeterminado.', err);
        this.cargando.set(false);
        return of([]);
      })
    ).subscribe();
  }
}
