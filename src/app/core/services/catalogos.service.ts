import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sabor } from '../models/sabor.model';
import { Presentacion } from '../models/presentacion.model';
import { Topping } from '../models/topping.model';
import { ProductoSimple } from '../models/producto-simple.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogosService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly sabores = signal<Sabor[]>([]);
  public readonly presentaciones = signal<Presentacion[]>([]);
  public readonly toppings = signal<Topping[]>([]);
  public readonly productosSimples = signal<ProductoSimple[]>([]);
  public readonly cargando = signal<boolean>(false);

  cargarSabores(): void {
    this.cargando.set(true);
    this.http.get<Sabor[]>(`${this.apiUrl}/api/sabores`).subscribe({
      next: (data) => {
        this.sabores.set(data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  crearSabor(payload: Partial<Sabor>): Observable<Sabor> {
    return this.http.post<Sabor>(`${this.apiUrl}/api/sabores`, payload).pipe(
      tap((creado) => {
        this.toast.success(`Sabor "${creado.nombre}" agregado al menú.`);
        this.cargarSabores();
      })
    );
  }

  actualizarSabor(id: number, payload: Partial<Sabor>): Observable<Sabor> {
    return this.http.put<Sabor>(`${this.apiUrl}/api/sabores/${id}`, payload).pipe(
      tap((actualizado) => {
        this.toast.success(`Sabor "${actualizado.nombre}" actualizado.`);
        this.cargarSabores();
      })
    );
  }

  eliminarSabor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/sabores/${id}`).pipe(
      tap(() => {
        this.toast.success('Sabor eliminado del catálogo.');
        this.cargarSabores();
      })
    );
  }

  toggleDisponibilidadSabor(id: number, disponible: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/api/sabores/${id}/disponibilidad`, { disponible }).pipe(
      tap(() => {
        this.toast.success('Disponibilidad actualizada.');
        this.cargarSabores();
      })
    );
  }

  cargarPresentaciones(): void {
    this.cargando.set(true);
    this.http.get<Presentacion[]>(`${this.apiUrl}/api/presentaciones`).subscribe({
      next: (data) => {
        this.presentaciones.set(data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  crearPresentacion(payload: Partial<Presentacion>): Observable<Presentacion> {
    return this.http.post<Presentacion>(`${this.apiUrl}/api/presentaciones`, payload).pipe(
      tap((creada) => {
        this.toast.success(`Presentación "${creada.nombre}" agregada.`);
        this.cargarPresentaciones();
      })
    );
  }

  actualizarPresentacion(id: number, payload: Partial<Presentacion>): Observable<Presentacion> {
    return this.http.put<Presentacion>(`${this.apiUrl}/api/presentaciones/${id}`, payload).pipe(
      tap((actualizada) => {
        this.toast.success(`Presentación "${actualizada.nombre}" actualizada.`);
        this.cargarPresentaciones();
      })
    );
  }

  eliminarPresentacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/presentaciones/${id}`).pipe(
      tap(() => {
        this.toast.success('Presentación eliminada.');
        this.cargarPresentaciones();
      })
    );
  }

  cargarToppings(): void {
    this.cargando.set(true);
    this.http.get<Topping[]>(`${this.apiUrl}/api/toppings`).subscribe({
      next: (data) => {
        this.toppings.set(data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  crearTopping(payload: Partial<Topping>): Observable<Topping> {
    return this.http.post<Topping>(`${this.apiUrl}/api/toppings`, payload).pipe(
      tap((creado) => {
        this.toast.success(`Topping "${creado.nombre}" agregado.`);
        this.cargarToppings();
      })
    );
  }

  actualizarTopping(id: number, payload: Partial<Topping>): Observable<Topping> {
    return this.http.put<Topping>(`${this.apiUrl}/api/toppings/${id}`, payload).pipe(
      tap((actualizado) => {
        this.toast.success(`Topping "${actualizado.nombre}" actualizado.`);
        this.cargarToppings();
      })
    );
  }

  eliminarTopping(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/toppings/${id}`).pipe(
      tap(() => {
        this.toast.success('Topping eliminado.');
        this.cargarToppings();
      })
    );
  }

  toggleDisponibilidadTopping(id: number, disponible: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/api/toppings/${id}/disponibilidad`, { disponible }).pipe(
      tap(() => {
        this.toast.success('Disponibilidad de topping actualizada.');
        this.cargarToppings();
      })
    );
  }

  cargarProductosSimples(): void {
    this.cargando.set(true);
    this.http.get<ProductoSimple[]>(`${this.apiUrl}/api/productos-simples`).subscribe({
      next: (data) => {
        this.productosSimples.set(data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  crearProductoSimple(payload: Partial<ProductoSimple>): Observable<ProductoSimple> {
    return this.http.post<ProductoSimple>(`${this.apiUrl}/api/productos-simples`, payload).pipe(
      tap((creado) => {
        this.toast.success(`Producto "${creado.nombre}" agregado.`);
        this.cargarProductosSimples();
      })
    );
  }

  actualizarProductoSimple(id: number, payload: Partial<ProductoSimple>): Observable<ProductoSimple> {
    return this.http.put<ProductoSimple>(`${this.apiUrl}/api/productos-simples/${id}`, payload).pipe(
      tap((actualizado) => {
        this.toast.success(`Producto "${actualizado.nombre}" actualizado.`);
        this.cargarProductosSimples();
      })
    );
  }

  eliminarProductoSimple(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/productos-simples/${id}`).pipe(
      tap(() => {
        this.toast.success('Producto eliminado.');
        this.cargarProductosSimples();
      })
    );
  }
}
