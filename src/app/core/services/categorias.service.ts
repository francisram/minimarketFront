import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, CategoriaRequest } from '../models/categoria.model';
import { TipoArticulo } from '../models/producto.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly categorias = signal<Categoria[]>([]);
  public readonly cargando = signal<boolean>(false);

  // Computeds útiles para selectores
  public readonly categoriasSabores = computed(() =>
    this.categorias().filter(c => c.activo && (!c.tipoArticulo || c.tipoArticulo === 'SABOR'))
  );

  public readonly categoriasVentaDirecta = computed(() =>
    this.categorias().filter(c => c.activo && (!c.tipoArticulo || c.tipoArticulo === 'VENTA_DIRECTA'))
  );

  public readonly categoriasEnvases = computed(() =>
    this.categorias().filter(c => c.activo && (!c.tipoArticulo || c.tipoArticulo === 'ENVASE'))
  );

  public readonly categoriasToppings = computed(() =>
    this.categorias().filter(c => c.activo && (!c.tipoArticulo || c.tipoArticulo === 'TOPPING'))
  );

  public readonly categoriasInsumos = computed(() =>
    this.categorias().filter(c => c.activo && (!c.tipoArticulo || c.tipoArticulo === 'INSUMO'))
  );

  cargarCategorias(filtro?: string, tipo?: TipoArticulo, soloActivos?: boolean): void {
    this.cargando.set(true);
    let params = new HttpParams();
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    if (tipo) {
      params = params.set('tipo', tipo);
    }
    if (soloActivos) {
      params = params.set('soloActivos', 'true');
    }

    this.http.get<Categoria[]>(`${this.apiUrl}/api/categorias`, { params }).subscribe({
      next: (data) => {
        this.categorias.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de categorías.');
        this.cargando.set(false);
      }
    });
  }

  listar(filtro?: string, tipo?: TipoArticulo, soloActivos?: boolean): Observable<Categoria[]> {
    let params = new HttpParams();
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    if (tipo) {
      params = params.set('tipo', tipo);
    }
    if (soloActivos) {
      params = params.set('soloActivos', 'true');
    }
    return this.http.get<Categoria[]>(`${this.apiUrl}/api/categorias`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  crear(payload: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.apiUrl}/api/categorias`, payload).pipe(
      tap((creada) => {
        this.toast.success(`Categoría "${creada.nombre}" creada con éxito.`);
        this.cargarCategorias();
      })
    );
  }

  actualizar(id: number, payload: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/api/categorias/${id}`, payload).pipe(
      tap((actualizada) => {
        this.toast.success(`Categoría "${actualizada.nombre}" actualizada.`);
        this.cargarCategorias();
      })
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.apiUrl}/api/categorias/${id}/estado`, { activo }).pipe(
      tap((actualizada) => {
        this.toast.success(`Categoría "${actualizada.nombre}" ${actualizada.activo ? 'activada' : 'desactivada'}.`);
        this.cargarCategorias();
      })
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/categorias/${id}`).pipe(
      tap(() => {
        this.toast.success('Categoría eliminada.');
        this.cargarCategorias();
      })
    );
  }
}
