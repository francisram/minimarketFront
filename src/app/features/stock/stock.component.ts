import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { ToastService } from '../../core/services/toast.service';
import { ItemAlertaStock, TipoItemStock } from '../../core/models/stock.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="stock-page">
      <!-- ENCABEZADO -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Control Integral de Stock e Inventario</h1>
          <p class="page-subtitle">
            Monitoreo en tiempo real de bachas de helado por kilo, existencia física de cucuruchos/envases y productos simples
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="stockService.cargarAlertas()">
            <app-icon name="refresh" [size]="16" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS DE RESUMEN KPI -->
      <div class="kpi-grid">
        <div class="kpi-card card-total">
          <div class="kpi-icon icon-total">
            <app-icon name="bell" [size]="24" />
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Alertas Activas</span>
            <span class="kpi-val">{{ stockService.totalAlertas() }}</span>
          </div>
        </div>

        <div class="kpi-card card-agotados">
          <div class="kpi-icon icon-agotados">
            <app-icon name="alert-triangle" [size]="24" />
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Artículos Agotados</span>
            <span class="kpi-val">{{ stockService.totalAgotados() }}</span>
          </div>
        </div>

        <div class="kpi-card card-bajo">
          <div class="kpi-icon icon-bajo">
            <app-icon name="package" [size]="24" />
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Por Debajo de Stock Mínimo</span>
            <span class="kpi-val">{{ stockService.totalBajoStock() }}</span>
          </div>
        </div>
      </div>

      <!-- TABS Y LISTADO DE ALERTAS -->
      <div class="card">
        <div class="card-header space-between flex-wrap gap-2">
          <div class="tabs-nav">
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'TODOS'"
              (click)="tabActiva.set('TODOS')"
            >
              <span>Todas las Alertas</span>
              <span class="tab-badge">{{ stockService.totalAlertas() }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'ENVASE'"
              (click)="tabActiva.set('ENVASE')"
            >
              <app-icon name="cup-soda" [size]="16" />
              <span>Envases y Cucuruchos</span>
              <span class="tab-badge">{{ stockService.presentacionesBajoStock().length }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'SABOR'"
              (click)="tabActiva.set('SABOR')"
            >
              <app-icon name="ice-cream" [size]="16" />
              <span>Sabores en Bacha</span>
              <span class="tab-badge">{{ stockService.saboresBajoStock().length }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'PRODUCTO'"
              (click)="tabActiva.set('PRODUCTO')"
            >
              <app-icon name="coffee" [size]="16" />
              <span>Productos y Cafetería</span>
              <span class="tab-badge">{{ stockService.productosBajoStock().length }}</span>
            </button>
          </div>
        </div>

        <!-- TABLA DE ALERTAS -->
        <div class="table-responsive">
          @if (stockService.cargando()) {
            <div class="loading-state">
              <app-icon name="refresh" [size]="20" />
              <span>Cargando inventario...</span>
            </div>
          } @else if (itemsFiltrados().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <app-icon name="check" [size]="40" />
              </div>
              <h3>¡Excelente! No hay alertas de stock en esta sección</h3>
              <p>Todos los niveles de inventario se encuentran por encima de sus umbrales mínimos.</p>
            </div>
          } @else {
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Artículo / Recurso</th>
                  <th>Tipo</th>
                  <th>Existencia Actual</th>
                  <th>Umbral Mínimo</th>
                  <th>Estado</th>
                  <th class="text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody>
                @for (item of itemsFiltrados(); track item.tipo + '-' + item.id) {
                  <tr>
                    <td>
                      <div class="item-cell">
                        <strong>{{ item.nombre }}</strong>
                        @if (item.tipo === 'ENVASE') {
                          <span class="sub-label">Cucurucho / Pote / Vaso</span>
                        } @else if (item.tipo === 'SABOR') {
                          <span class="sub-label">Helado artesanal en bacha</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="type-chip" [ngClass]="'chip-' + item.tipo.toLowerCase()">
                        {{ item.tipo }}
                      </span>
                    </td>
                    <td>
                      <span class="stock-val" [class.val-danger]="item.stockActual <= 0">
                        {{ item.stockActual }} {{ item.unidad }}
                      </span>
                    </td>
                    <td>
                      <span class="min-val">{{ item.stockMinimo }} {{ item.unidad }}</span>
                    </td>
                    <td>
                      <span 
                        class="badge" 
                        [ngClass]="item.estadoAlerta === 'AGOTADO' ? 'badge-danger' : 'badge-warning'"
                      >
                        {{ item.estadoAlerta === 'AGOTADO' ? 'Agotado' : 'Bajo Stock' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        (click)="abrirModalAjuste(item)"
                      >
                        <app-icon name="package" [size]="14" />
                        <span>Ajustar / Reponer</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <!-- ==================== MODAL DE AJUSTE RÁPIDO ==================== -->
      <app-modal
        [isOpen]="modalAjusteAbierto()"
        [title]="'Ajuste Rápido de Stock: ' + (itemSeleccionado()?.nombre || '')"
        size="md"
        (close)="cerrarModalAjuste()"
      >
        <div body class="ajuste-form">
          @if (itemSeleccionado(); as item) {
            <div class="ajuste-banner">
              <div>
                <span class="banner-title">{{ item.nombre }}</span>
                <span class="banner-sub">Tipo: {{ item.tipo }} | Stock Actual: {{ item.stockActual }} {{ item.unidad }}</span>
              </div>
              <span class="badge" [ngClass]="item.estadoAlerta === 'AGOTADO' ? 'badge-danger' : 'badge-warning'">
                {{ item.estadoAlerta }}
              </span>
            </div>

            <!-- FORMULARIO SEGÚN TIPO -->
            @if (item.tipo === 'ENVASE') {
              <div class="form-group">
                <label class="form-label" for="nuevoStockEnvase">
                  Nueva existencia de Envases / Cucuruchos (Unidades) *
                </label>
                <input
                  id="nuevoStockEnvase"
                  type="number"
                  class="form-control"
                  [(ngModel)]="ajusteData.stock"
                  placeholder="Ej. 100"
                  min="0"
                />
                <small class="field-hint">Actualiza el inventario físico de potes o cucuruchos disponibles en el mostrador.</small>
              </div>

              <div class="form-group">
                <label class="form-label" for="nuevoStockMinimoEnvase">
                  Umbral de Stock Mínimo (Opcional)
                </label>
                <input
                  id="nuevoStockMinimoEnvase"
                  type="number"
                  class="form-control"
                  [(ngModel)]="ajusteData.stockMinimo"
                  placeholder="Ej. 15"
                  min="0"
                />
              </div>
            }

            @if (item.tipo === 'SABOR') {
              <div class="form-group">
                <label class="form-label" for="nuevoStockKilos">
                  Kilos de Helado en Bacha (Kg) *
                </label>
                <input
                  id="nuevoStockKilos"
                  type="number"
                  step="0.1"
                  class="form-control"
                  [(ngModel)]="ajusteData.stockKilos"
                  placeholder="Ej. 12.5"
                  min="0"
                />
                <small class="field-hint">
                  Al ingresar un valor mayor a 0, el sabor se reactiva automáticamente como <strong>Disponible</strong> en el POS.
                </small>
              </div>
            }

            @if (item.tipo === 'PRODUCTO') {
              <div class="form-group">
                <label class="form-label" for="nuevoStockProd">
                  Nueva existencia de Producto (Unidades) *
                </label>
                <input
                  id="nuevoStockProd"
                  type="number"
                  class="form-control"
                  [(ngModel)]="ajusteData.stock"
                  placeholder="Ej. 48"
                  min="0"
                />
              </div>
            }
          }
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalAjuste()" [disabled]="guardando()">
            Cancelar
          </button>
          <button type="button" class="btn btn-success" (click)="guardarAjuste()" [disabled]="guardando()">
            @if (guardando()) {
              <span>Guardando ajuste...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>Guardar Stock</span>
            }
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .stock-page {
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

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-total { background: #fef3c7; color: #b45309; }
    .icon-agotados { background: #fee2e2; color: #dc2626; }
    .icon-bajo { background: #ffedd5; color: #ea580c; }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
    }

    /* TABS */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.45rem;
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

    .tab-badge {
      background: rgba(0, 0, 0, 0.08);
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.72rem;
    }

    .tab-btn.active .tab-badge {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    /* TABLA */
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

    .item-cell {
      display: flex;
      flex-direction: column;
    }

    .sub-label {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .type-chip {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    .chip-envase { background: #e0e7ff; color: #4338ca; }
    .chip-sabor { background: #dcfce7; color: #166534; }
    .chip-producto { background: #fef3c7; color: #92400e; }

    .stock-val {
      font-weight: 700;
      color: var(--text-main);
    }

    .val-danger {
      color: var(--color-danger);
    }

    .min-val {
      color: var(--text-muted);
    }

    .text-right {
      text-align: right;
    }

    .empty-state {
      text-align: center;
      padding: 3.5rem 1.5rem;
      color: var(--text-muted);
    }

    .empty-icon {
      color: var(--color-success);
      margin-bottom: 0.75rem;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 3rem;
      color: var(--text-muted);
    }

    /* AJUSTE MODAL */
    .ajuste-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .ajuste-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }

    .banner-title {
      font-weight: 700;
      display: block;
      font-size: 0.95rem;
    }

    .banner-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
      display: block;
    }

    .space-between {
      justify-content: space-between;
    }

    .flex-wrap { flex-wrap: wrap; }
    .gap-2 { gap: 0.5rem; }
  `]
})
export class StockComponent implements OnInit {
  public readonly stockService = inject(StockService);
  private readonly toast = inject(ToastService);

  public readonly tabActiva = signal<'TODOS' | 'ENVASE' | 'SABOR' | 'PRODUCTO'>('TODOS');
  public readonly modalAjusteAbierto = signal<boolean>(false);
  public readonly itemSeleccionado = signal<ItemAlertaStock | null>(null);
  public readonly guardando = signal<boolean>(false);

  public ajusteData: {
    stock: number;
    stockMinimo?: number;
    stockKilos: number;
  } = {
    stock: 0,
    stockMinimo: 0,
    stockKilos: 0
  };

  ngOnInit(): void {
    this.stockService.cargarAlertas();
  }

  public readonly itemsFiltrados = computed<ItemAlertaStock[]>(() => {
    const tab = this.tabActiva();
    const envases = this.stockService.presentacionesBajoStock();
    const sabores = this.stockService.saboresBajoStock();
    const productos = this.stockService.productosBajoStock();

    if (tab === 'ENVASE') return envases;
    if (tab === 'SABOR') return sabores;
    if (tab === 'PRODUCTO') return productos;

    return [...envases, ...sabores, ...productos];
  });

  abrirModalAjuste(item: ItemAlertaStock): void {
    this.itemSeleccionado.set(item);
    this.ajusteData = {
      stock: item.stockActual || 0,
      stockMinimo: item.stockMinimo || 0,
      stockKilos: item.stockActual || 0
    };
    this.modalAjusteAbierto.set(true);
  }

  cerrarModalAjuste(): void {
    this.modalAjusteAbierto.set(false);
    this.itemSeleccionado.set(null);
  }

  guardarAjuste(): void {
    const item = this.itemSeleccionado();
    if (!item) return;

    this.guardando.set(true);

    if (item.tipo === 'ENVASE') {
      this.stockService.ajustarStockPresentacion(item.id, {
        stock: Number(this.ajusteData.stock),
        stockMinimo: this.ajusteData.stockMinimo ? Number(this.ajusteData.stockMinimo) : undefined
      }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModalAjuste();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.mensaje || 'Error al actualizar stock de envase.';
          this.toast.error(msg);
        }
      });
    } else if (item.tipo === 'SABOR') {
      this.stockService.ajustarStockSabor(item.id, {
        stockKilos: Number(this.ajusteData.stockKilos)
      }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModalAjuste();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.mensaje || 'Error al actualizar kilos de helado.';
          this.toast.error(msg);
        }
      });
    } else if (item.tipo === 'PRODUCTO') {
      this.stockService.ajustarStockProducto(item.id, {
        stock: Number(this.ajusteData.stock)
      }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModalAjuste();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.mensaje || 'Error al actualizar stock de producto.';
          this.toast.error(msg);
        }
      });
    }
  }
}
