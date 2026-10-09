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
}
