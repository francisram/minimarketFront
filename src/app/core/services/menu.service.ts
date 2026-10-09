import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../models/pagina.model';
import { AuthService } from './auth.service';

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
    { clave: 'stock', nombre: 'Control de Stock', ruta: '/stock', icono: 'warehouse', adminOnly: true },
    { clave: 'sabores', nombre: 'Sabores', ruta: '/catalogos/sabores', icono: 'ice-cream' },
    { clave: 'presentaciones', nombre: 'Presentaciones', ruta: '/catalogos/presentaciones', icono: 'cup-soda' },
    { clave: 'toppings', nombre: 'Toppings', ruta: '/catalogos/toppings', icono: 'sparkles' },
    { clave: 'productos', nombre: 'Bebidas y Cafetería', ruta: '/catalogos/productos', icono: 'coffee' },
    { clave: 'impresoras', nombre: 'Impresoras ESC/POS', ruta: '/impresoras', icono: 'printer', adminOnly: true },
    { clave: 'usuarios', nombre: 'Usuarios', ruta: '/usuarios', icono: 'user', adminOnly: true },
    { clave: 'roles', nombre: 'Roles y Permisos', ruta: '/roles', icono: 'shield', adminOnly: true },
    { clave: 'licencia', nombre: 'Licencia', ruta: '/licencia', icono: 'verified', adminOnly: true },
    { clave: 'institucion', nombre: 'Datos del Negocio', ruta: '/institucion', icono: 'building', adminOnly: true }
  ];

  public readonly menuItems = computed<MenuItem[]>(() => {
    const paginas = this._paginasDisponibles();
    const isAdminOrOwner = this.authService.isAdminOrOwner();

    // Si aún no hay páginas cargadas desde el backend, mostramos menú estándar según rol
    if (!paginas || paginas.length === 0) {
      return this.catalogoBase.filter(item => !item.adminOnly || isAdminOrOwner);
    }

    // Filtrar por páginas activas en la licencia y rol
    const clavesDisponibles = new Set(paginas.map(p => p.clave?.toLowerCase()));

    return this.catalogoBase.filter(item => {
      // 1. Si el módulo requiere ADMIN u OWNER y el usuario no lo es, nunca mostrar
      if (item.adminOnly && !isAdminOrOwner) {
        return false;
      }

      // 2. Módulos esenciales de administración para ADMIN / OWNER:
      // Control de Stock, Impresoras, Institución y Dashboard SIEMPRE deben estar disponibles para administradores,
      // garantizando que aparezcan aunque la tabla 'paginas' del backend no los tenga en su semilla inicial.
      if (isAdminOrOwner && ['stock', 'impresoras', 'institucion', 'dashboard', 'caja'].includes(item.clave)) {
        return true;
      }

      // 3. Submódulo de monitor de pedidos vinculado a la clave 'pedidos'
      if (item.clave === 'monitor-pedidos') {
        return clavesDisponibles.has('pedidos');
      }

      // 4. Módulos licenciados estándar (dashboard, sabores, presentaciones, toppings, productos, usuarios, roles, licencia)
      return clavesDisponibles.has(item.clave.toLowerCase());
    });
  });

  cargarPaginasDisponibles(): void {
    if (!this.authService.isAuthenticated()) return;
    this.cargando.set(true);

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
