import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CatalogosService } from '../../core/services/catalogos.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, AppIconComponent, AppCurrencyPipe],
  template: `
    <div class="catalogos-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo y Disponibilidad</h1>
          <p class="page-subtitle">Revisa el menú de sabores, envases, agregados y bebidas en stock</p>
        </div>

        <div class="tabs-nav">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="tabActiva() === 'sabores'"
            (click)="tabActiva.set('sabores')"
          >
            <app-icon name="ice-cream" [size]="16" />
            <span>Sabores ({{ catalogosService.sabores().length }})</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="tabActiva() === 'presentaciones'"
            (click)="tabActiva.set('presentaciones')"
          >
            <app-icon name="cup-soda" [size]="16" />
            <span>Envases ({{ catalogosService.presentaciones().length }})</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="tabActiva() === 'toppings'"
            (click)="tabActiva.set('toppings')"
          >
            <app-icon name="sparkles" [size]="16" />
            <span>Toppings ({{ catalogosService.toppings().length }})</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="tabActiva() === 'productos'"
            (click)="tabActiva.set('productos')"
          >
            <app-icon name="coffee" [size]="16" />
            <span>Cafetería ({{ catalogosService.productosSimples().length }})</span>
          </button>
        </div>
      </div>

      <!-- VISTA SABORES -->
      @if (tabActiva() === 'sabores') {
        <div class="card">
          <div class="card-header">
            <h3>Listado de Sabores de Helado</h3>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Sabor</th>
                  <th>Categoría</th>
                  <th>Dietario</th>
                  <th>Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                @for (sabor of catalogosService.sabores(); track sabor.id) {
                  <tr>
                    <td><strong>{{ sabor.nombre }}</strong></td>
                    <td><span class="category-chip">{{ sabor.categoria }}</span></td>
                    <td>
                      <div class="d-flex gap-1 flex-wrap">
                        @if (sabor.aptoCeliaco) { <span class="badge badge-celiaco">Sin TACC</span> }
                        @if (sabor.esVegano) { <span class="badge badge-vegano">Vegano</span> }
                        @if (sabor.sinAzucar) { <span class="badge badge-sinazucar">Sin Azúcar</span> }
                      </div>
                    </td>
                    <td>
                      @if (sabor.disponible) {
                        <span class="badge badge-listo">Disponible</span>
                      } @else {
                        <span class="badge badge-cancelado">Agotado</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA PRESENTACIONES -->
      @if (tabActiva() === 'presentaciones') {
        <div class="card">
          <div class="card-header">
            <h3>Tamaños y Envases</h3>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Máx. Sabores</th>
                  <th>Peso Aprox.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (pres of catalogosService.presentaciones(); track pres.id) {
                  <tr>
                    <td><strong>{{ pres.nombre }}</strong></td>
                    <td class="text-primary font-bold">{{ pres.precio | appCurrency }}</td>
                    <td>Hasta {{ pres.maxSabores }} sabores</td>
                    <td>{{ pres.pesoGramosAprox ? pres.pesoGramosAprox + 'g' : '-' }}</td>
                    <td>
                      <span class="badge" [ngClass]="pres.activo ? 'badge-listo' : 'badge-cancelado'">
                        {{ pres.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA TOPPINGS -->
      @if (tabActiva() === 'toppings') {
        <div class="card">
          <div class="card-header">
            <h3>Toppings y Agregados</h3>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio Extra</th>
                  <th>Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                @for (top of catalogosService.toppings(); track top.id) {
                  <tr>
                    <td><strong>{{ top.nombre }}</strong></td>
                    <td class="text-primary font-bold">+ {{ top.precioExtra | appCurrency }}</td>
                    <td>
                      <span class="badge" [ngClass]="top.disponible ? 'badge-listo' : 'badge-cancelado'">
                        {{ top.disponible ? 'Disponible' : 'Agotado' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA PRODUCTOS SIMPLES -->
      @if (tabActiva() === 'productos') {
        <div class="card">
          <div class="card-header">
            <h3>Bebidas y Cafetería Envasada</h3>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock Disponible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of catalogosService.productosSimples(); track prod.id) {
                  <tr>
                    <td><strong>{{ prod.nombre }}</strong></td>
                    <td class="text-primary font-bold">{{ prod.precio | appCurrency }}</td>
                    <td>
                      <span [class.text-danger]="prod.stock <= 5" class="font-bold">
                        {{ prod.stock }} unidades
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="prod.activo ? 'badge-listo' : 'badge-cancelado'">
                        {{ prod.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .catalogos-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      background: var(--bg-surface);
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.35rem;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.2rem 0 0;
    }

    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-btn:hover {
      background: var(--bg-subtle);
      color: var(--text-main);
    }

    .tab-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .table-custom {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .table-custom th, .table-custom td {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.875rem;
    }

    .table-custom th {
      background: var(--bg-subtle);
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    .table-custom tr:hover td {
      background: #fafafa;
    }

    .category-chip {
      background: var(--bg-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .text-primary { color: var(--primary); }
    .text-danger { color: var(--color-danger); }
    .font-bold { font-weight: 700; }
    .d-flex { display: flex; }
    .gap-1 { gap: 0.25rem; }
    .flex-wrap { flex-wrap: wrap; }
  `]
})
export class CatalogosComponent implements OnInit {
  public readonly catalogosService = inject(CatalogosService);
  private readonly route = inject(ActivatedRoute);

  public readonly tabActiva = signal<'sabores' | 'presentaciones' | 'toppings' | 'productos'>('sabores');

  ngOnInit(): void {
    // Escuchar parámetros de ruta si se accede por /catalogos/:seccion
    this.route.params.subscribe(params => {
      const seccion = params['seccion'];
      if (seccion && ['sabores', 'presentaciones', 'toppings', 'productos'].includes(seccion)) {
        this.tabActiva.set(seccion as any);
      }
    });

    this.catalogosService.cargarSabores();
    this.catalogosService.cargarPresentaciones();
    this.catalogosService.cargarToppings();
    this.catalogosService.cargarProductosSimples();
  }
}
