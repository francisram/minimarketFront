import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Producto, ProductoRequest, TipoArticulo, AsignarProveedorRequest } from '../models/producto.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = '/api/productos';

  // Signals de estado
  public readonly productos = signal<Producto[]>([]);
  public readonly cargando = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  // Computed signals por tipo de artículo
  public readonly ventaDirecta = computed(() =>
    this.productos().filter(p => p.tipoArticulo === 'VENTA_DIRECTA')
  );

  public readonly envases = computed(() =>
    this.productos().filter(p => p.tipoArticulo === 'ENVASE')
  );

  public readonly sabores = computed(() =>
    this.productos().filter(p => p.tipoArticulo === 'SABOR')
  );

  public readonly toppings = computed(() =>
    this.productos().filter(p => p.tipoArticulo === 'TOPPING')
  );

  public readonly insumos = computed(() =>
    this.productos().filter(p => p.tipoArticulo === 'INSUMO')
  );

  cargarProductos(filtros?: {
    tipo?: TipoArticulo;
    proveedorId?: number;
    soloActivos?: boolean;
    buscar?: string;
  }): void {
    this.cargando.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (filtros?.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros?.proveedorId) params = params.set('proveedorId', filtros.proveedorId.toString());
    if (filtros?.soloActivos !== undefined) params = params.set('soloActivos', filtros.soloActivos.toString());
    if (filtros?.buscar) params = params.set('buscar', filtros.buscar.trim());

    this.http.get<Producto[]>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set('No se pudieron cargar los artículos del catálogo maestro.');
        this.toast.error('Error al consultar catálogo de productos.');
      }
    });
  }

  obtenerPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  buscarPorCodigoBarra(codigo: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/codigo-barra/${encodeURIComponent(codigo)}`);
  }

  listarPorProveedor(proveedorId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/proveedor/${proveedorId}`);
  }

  crear(dto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, dto).pipe(
      tap((nuevo) => {
        this.productos.update(prev => [nuevo, ...prev]);
        this.toast.success(`Artículo "${nuevo.nombre}" creado exitosamente.`);
      })
    );
  }

  actualizar(id: number, dto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((actualizado) => {
        this.productos.update(prev => prev.map(p => p.id === id ? actualizado : p));
        this.toast.success(`Artículo "${actualizado.nombre}" actualizado.`);
      })
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.productos.update(prev => prev.filter(p => p.id !== id));
        this.toast.success('Artículo eliminado correctamente.');
      })
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<Producto> {
    const params = new HttpParams().set('activo', activo.toString());
    return this.http.patch<Producto>(`${this.apiUrl}/${id}/estado`, null, { params }).pipe(
      tap((actualizado) => {
        this.productos.update(prev => prev.map(p => p.id === id ? actualizado : p));
        this.toast.info(`Estado de "${actualizado.nombre}" cambiado a ${activo ? 'Activo' : 'Inactivo'}.`);
      })
    );
  }

  asociarProveedor(id: number, dto: AsignarProveedorRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/${id}/proveedores`, dto).pipe(
      tap((actualizado) => {
        this.productos.update(prev => prev.map(p => p.id === id ? actualizado : p));
        this.toast.success('Proveedor vinculado al producto.');
      })
    );
  }

  desasociarProveedor(id: number, proveedorId: number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}/proveedores/${proveedorId}`).pipe(
      tap((actualizado) => {
        this.productos.update(prev => prev.map(p => p.id === id ? actualizado : p));
        this.toast.info('Proveedor desasociado del producto.');
      })
    );
  }
}
