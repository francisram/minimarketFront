import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ItemAlertaStock, TipoItemStock } from '../../core/models/stock.model';
import { Sabor } from '../../core/models/sabor.model';
import { Presentacion } from '../../core/models/presentacion.model';
import { ProductoSimple } from '../../core/models/producto-simple.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent, AppCurrencyPipe],
  template: `
    <div class="stock-page">
      <!-- ENCABEZADO -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Control Integral de Stock e Inventario</h1>
          <p class="page-subtitle">
            Gestión completa de bachas de helado por kg, envases/cucuruchos físicos y productos simples
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-outline" (click)="abrirModalSabor()">
            <app-icon name="plus" [size]="16" />
            <span>Nuevo Sabor</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="abrirModalProducto()">
            <app-icon name="plus" [size]="16" />
            <span>Nuevo Producto</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="abrirModalPresentacion()">
            <app-icon name="plus" [size]="16" />
            <span>Nuevo Envase</span>
          </button>
          <button type="button" class="btn btn-secondary" (click)="recargarTodo()">
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
            <span class="kpi-label">Bajo Stock Mínimo</span>
            <span class="kpi-val">{{ stockService.totalBajoStock() }}</span>
          </div>
        </div>
      </div>

      <!-- TABS Y LISTADO PRINCIPAL -->
      <div class="card">
        <div class="card-header space-between flex-wrap gap-2">
          <!-- TABS -->
          <div class="tabs-nav">
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'TODOS'"
              (click)="tabActiva.set('TODOS')"
            >
              <app-icon name="bell" [size]="16" />
              <span>Alertas Críticas</span>
              <span class="tab-badge" [class.badge-alert]="stockService.totalAlertas() > 0">
                {{ stockService.totalAlertas() }}
              </span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'SABOR'"
              (click)="tabActiva.set('SABOR')"
            >
              <app-icon name="ice-cream" [size]="16" />
              <span>Sabores en Bacha</span>
              <span class="tab-badge">{{ catalogosService.sabores().length }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'ENVASE'"
              (click)="tabActiva.set('ENVASE')"
            >
              <app-icon name="cup-soda" [size]="16" />
              <span>Envases y Cucuruchos</span>
              <span class="tab-badge">{{ catalogosService.presentaciones().length }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'PRODUCTO'"
              (click)="tabActiva.set('PRODUCTO')"
            >
              <app-icon name="coffee" [size]="16" />
              <span>Bebidas y Cafetería</span>
              <span class="tab-badge">{{ catalogosService.productosSimples().length }}</span>
            </button>
          </div>

          <!-- FILTRO VISUALIZACIÓN (SOLO PARA PESTAÑAS DE CATEGORÍA) -->
          @if (tabActiva() !== 'TODOS') {
            <div class="filter-switch">
              <button 
                type="button" 
                class="filter-btn" 
                [class.active]="filtroModo() === 'TODOS'"
                (click)="filtroModo.set('TODOS')"
              >
                Todos los ítems
              </button>
              <button 
                type="button" 
                class="filter-btn" 
                [class.active]="filtroModo() === 'ALERTAS'"
                (click)="filtroModo.set('ALERTAS')"
              >
                Solo bajo mínimo
              </button>
            </div>
          }
        </div>

        <!-- ==================== VISTA 1: ALERTAS CRÍTICAS ==================== -->
        @if (tabActiva() === 'TODOS') {
          <div class="table-responsive">
            @if (stockService.cargando()) {
              <div class="loading-state">
                <app-icon name="refresh" [size]="20" />
                <span>Cargando alertas de stock...</span>
              </div>
            } @else if (alertasFiltradas().length === 0) {
              <div class="empty-state">
                <div class="empty-icon text-success">
                  <app-icon name="check" [size]="40" />
                </div>
                <h3>¡Excelente! No hay alertas de stock pendientes</h3>
                <p>Todos los niveles de helado, envases y productos están por encima del umbral mínimo de reposición.</p>
                <div class="mt-3">
                  <button type="button" class="btn btn-secondary" (click)="tabActiva.set('SABOR')">
                    Ver Inventario de Sabores
                  </button>
                </div>
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
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of alertasFiltradas(); track item.tipo + '-' + item.id) {
                    <tr>
                      <td>
                        <div class="item-cell">
                          <strong>{{ item.nombre }}</strong>
                          <span class="sub-label">
                            {{ item.tipo === 'ENVASE' ? 'Cucurucho / Pote físico' : (item.tipo === 'SABOR' ? 'Helado en bacha' : 'Producto simple') }}
                          </span>
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
                          {{ item.estadoAlerta === 'AGOTADO' ? 'Agotado' : 'Bajo Mínimo' }}
                        </span>
                      </td>
                      <td class="text-right">
                        <button
                          type="button"
                          class="btn btn-sm btn-primary"
                          (click)="abrirModalAjuste(item)"
                        >
                          <app-icon name="package" [size]="14" />
                          <span>Reponer Stock</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }

        <!-- ==================== VISTA 2: SABORES EN BACHA ==================== -->
        @if (tabActiva() === 'SABOR') {
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Sabor</th>
                  <th>Categoría</th>
                  <th>Kilos Disponibles</th>
                  <th>Stock Mínimo</th>
                  <th>Dietario</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (sab of saboresFiltrados(); track sab.id) {
                  <tr>
                    <td>
                      <div class="item-cell">
                        <strong>{{ sab.nombre }}</strong>
                        @if (sab.descripcion) {
                          <span class="sub-label">{{ sab.descripcion }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="category-chip">{{ sab.categoria }}</span>
                    </td>
                    <td>
                      <div class="stock-progress-wrap">
                        <span class="stock-val" [class.val-danger]="(sab.stockKilos ?? 0) <= 0">
                          {{ sab.stockKilos ?? 0 }} kg
                        </span>
                        <div class="mini-bar">
                          <div 
                            class="mini-bar-fill" 
                            [style.width.%]="getPorcentajeBarra(sab.stockKilos, sab.stockMinimoKilos)"
                            [class.fill-danger]="(sab.stockKilos ?? 0) <= 0"
                            [class.fill-warning]="(sab.stockKilos ?? 0) > 0 && (sab.stockKilos ?? 0) <= (sab.stockMinimoKilos ?? 2)"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="min-val">{{ sab.stockMinimoKilos ?? 2.0 }} kg</span>
                    </td>
                    <td>
                      <div class="d-flex gap-1 flex-wrap">
                        @if (sab.aptoCeliaco) { <span class="badge badge-celiaco">Sin TACC</span> }
                        @if (sab.esVegano) { <span class="badge badge-vegano">Vegano</span> }
                        @if (sab.sinAzucar) { <span class="badge badge-sinazucar">Sin Azúcar</span> }
                      </div>
                    </td>
                    <td>
                      @if (!sab.disponible || (sab.stockKilos ?? 0) <= 0) {
                        <span class="badge badge-danger">Agotado</span>
                      } @else if ((sab.stockKilos ?? 0) <= (sab.stockMinimoKilos ?? 2)) {
                        <span class="badge badge-warning">Poco Stock</span>
                      } @else {
                        <span class="badge badge-listo">Disponible</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline"
                          (click)="abrirModalAjusteDesdeSabor(sab)"
                          title="Ajuste rápido de kilos"
                        >
                          <app-icon name="package" [size]="14" />
                          <span>Ajustar kg</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalSabor(sab)"
                          title="Modificar datos del sabor"
                        >
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarSabor(sab)"
                          title="Eliminar sabor"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- ==================== VISTA 3: ENVASES Y CUCURUCHOS ==================== -->
        @if (tabActiva() === 'ENVASE') {
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Envase / Presentación</th>
                  <th>Precio Venta</th>
                  <th>Existencia Física</th>
                  <th>Stock Mínimo</th>
                  <th>Capacidad</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (pres of presentacionesFiltradas(); track pres.id) {
                  <tr>
                    <td>
                      <div class="item-cell">
                        <strong>{{ pres.nombre }}</strong>
                        @if (pres.pesoGramosAprox) {
                          <span class="sub-label">~{{ pres.pesoGramosAprox }} gramos</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="text-primary font-bold">{{ pres.precio | appCurrency }}</span>
                    </td>
                    <td>
                      <span class="stock-val" [class.val-danger]="(pres.stock ?? 0) <= 0">
                        {{ pres.stock ?? 0 }} unid.
                      </span>
                    </td>
                    <td>
                      <span class="min-val">{{ pres.stockMinimo ?? 10 }} unid.</span>
                    </td>
                    <td>
                      <span class="feature-tag">Hasta {{ pres.maxSabores }} sabores</span>
                    </td>
                    <td>
                      @if (!pres.activo) {
                        <span class="badge badge-cancelado">Inactivo</span>
                      } @else if ((pres.stock ?? 0) <= 0) {
                        <span class="badge badge-danger">Sin envases</span>
                      } @else if ((pres.stock ?? 0) <= (pres.stockMinimo ?? 10)) {
                        <span class="badge badge-warning">Últimas unid.</span>
                      } @else {
                        <span class="badge badge-listo">En Mostrador</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline"
                          (click)="abrirModalAjusteDesdePresentacion(pres)"
                          title="Ajuste rápido de unidades"
                        >
                          <app-icon name="package" [size]="14" />
                          <span>Ajustar</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalPresentacion(pres)"
                          title="Modificar precio o datos del envase"
                        >
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarPresentacion(pres)"
                          title="Eliminar presentación"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- ==================== VISTA 4: PRODUCTOS Y CAFETERÍA ==================== -->
        @if (tabActiva() === 'PRODUCTO') {
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio Venta</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of productosFiltrados(); track prod.id) {
                  <tr>
                    <td>
                      <div class="item-cell">
                        <strong>{{ prod.nombre }}</strong>
                      </div>
                    </td>
                    <td>
                      <span class="category-chip">{{ prod.categoria || 'GENERAL' }}</span>
                    </td>
                    <td>
                      <span class="text-primary font-bold">{{ prod.precio | appCurrency }}</span>
                    </td>
                    <td>
                      <span class="stock-val" [class.val-danger]="prod.stock <= 0">
                        {{ prod.stock }} unid.
                      </span>
                    </td>
                    <td>
                      <span class="min-val">{{ prod.stockMinimo ?? 5 }} unid.</span>
                    </td>
                    <td>
                      @if (!prod.activo) {
                        <span class="badge badge-cancelado">Inactivo</span>
                      } @else if (prod.stock <= 0) {
                        <span class="badge badge-danger">Agotado</span>
                      } @else if (prod.stock <= (prod.stockMinimo ?? 5)) {
                        <span class="badge badge-warning">Bajo Stock</span>
                      } @else {
                        <span class="badge badge-listo">Disponible</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline"
                          (click)="abrirModalAjusteDesdeProducto(prod)"
                          title="Ajuste rápido de stock"
                        >
                          <app-icon name="package" [size]="14" />
                          <span>Ajustar</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalProducto(prod)"
                          title="Modificar precio o datos del producto"
                        >
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarProducto(prod)"
                          title="Eliminar producto"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
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
              <div class="ajuste-item-header">
                <div>
                  <h4>{{ item.nombre }}</h4>
                  <span class="sub-label">
                    Tipo: <strong>{{ item.tipo }}</strong> | Existencia actual: <strong>{{ item.stockActual }} {{ item.unidad }}</strong>
                  </span>
                </div>
              </div>
            </div>

            <!-- MODO DE AJUSTE -->
            <div class="form-group">
              <label class="form-label">Tipo de Modificación</label>
              <div class="segmented-control">
                <button
                  type="button"
                  [class.active]="tipoModificacion() === 'SUMAR'"
                  (click)="tipoModificacion.set('SUMAR')"
                >
                  ➕ Sumar ingreso (+mercadería)
                </button>
                <button
                  type="button"
                  [class.active]="tipoModificacion() === 'ABSOLUTO'"
                  (click)="tipoModificacion.set('ABSOLUTO')"
                >
                  ✏️ Sobreescribir stock absoluto
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="cantAjuste">
                {{ tipoModificacion() === 'SUMAR' ? 'Cantidad a Sumar' : 'Nuevo Stock Total' }} (en {{ item.unidad }}) *
              </label>
              <input
                id="cantAjuste"
                type="number"
                [step]="item.unidad === 'kg' ? '0.1' : '1'"
                class="form-control"
                [(ngModel)]="cantidadAjuste"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="minAjuste">Umbral de Alerta Mínima (en {{ item.unidad }})</label>
              <input
                id="minAjuste"
                type="number"
                [step]="item.unidad === 'kg' ? '0.1' : '1'"
                class="form-control"
                [(ngModel)]="stockMinimoAjuste"
              />
            </div>
          }
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalAjuste()">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="guardarAjuste()" [disabled]="guardandoAjuste()">
            <span>Guardar Ajuste</span>
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL CREAR / EDITAR SABOR ==================== -->
      <app-modal
        [isOpen]="modalSaborAbierto()"
        [title]="saborEditando?.id ? ('Modificar Sabor: ' + saborEditando?.nombre) : 'Nuevo Sabor de Helado'"
        size="lg"
        (close)="modalSaborAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="saborNombre">Nombre del Sabor *</label>
              <input
                id="saborNombre"
                type="text"
                class="form-control"
                placeholder="Ej. Dulce de Leche Tentación"
                [(ngModel)]="saborForm.nombre"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="saborCat">Categoría *</label>
              <select id="saborCat" class="form-control" [(ngModel)]="saborForm.categoria">
                <option value="CREMA">CREMA</option>
                <option value="CHOCOLATE">CHOCOLATE</option>
                <option value="DULCE_DE_LECHE">DULCE_DE_LECHE</option>
                <option value="FRUTAL">FRUTAL</option>
                <option value="ESPECIAL">ESPECIAL</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="saborDesc">Descripción / Ingredientes</label>
            <input
              id="saborDesc"
              type="text"
              class="form-control"
              placeholder="Ej. Elaborado con dulce de leche artesanal y nueces"
              [(ngModel)]="saborForm.descripcion"
            />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="saborKilos">Kilos Iniciales en Bacha *</label>
              <input
                id="saborKilos"
                type="number"
                step="0.1"
                class="form-control"
                [(ngModel)]="saborForm.stockKilos"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="saborMinKilos">Umbral Mínimo (Aviso bacha) *</label>
              <input
                id="saborMinKilos"
                type="number"
                step="0.1"
                class="form-control"
                [(ngModel)]="saborForm.stockMinimoKilos"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Propiedades y Dietario</label>
            <div class="checkboxes-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.aptoCeliaco" />
                <span>🌾 Sin TACC (Apto Celíaco)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.esVegano" />
                <span>🌱 Vegano</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.sinAzucar" />
                <span>🍃 Sin Azúcar</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.disponible" />
                <span>✅ Disponible en Mostrador</span>
              </label>
            </div>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalSaborAbierto.set(false)">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="guardarSabor()" [disabled]="guardandoItem()">
            <span>{{ saborEditando?.id ? 'Actualizar Sabor' : 'Guardar Sabor' }}</span>
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL CREAR / EDITAR PRODUCTO ==================== -->
      <app-modal
        [isOpen]="modalProductoAbierto()"
        [title]="productoEditando?.id ? ('Modificar Producto: ' + productoEditando?.nombre) : 'Nuevo Producto / Cafetería'"
        size="md"
        (close)="modalProductoAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="prodNombre">Nombre del Producto *</label>
            <input
              id="prodNombre"
              type="text"
              class="form-control"
              placeholder="Ej. Agua Mineral con gas 500ml"
              [(ngModel)]="productoForm.nombre"
            />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="prodPrecio">Precio de Venta (Gs.) *</label>
              <input
                id="prodPrecio"
                type="number"
                step="1000"
                class="form-control"
                placeholder="Ej. 10000"
                [(ngModel)]="productoForm.precio"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="prodCat">Categoría</label>
              <input
                id="prodCat"
                type="text"
                class="form-control"
                placeholder="BEBIDAS, CAFETERIA, ENVASADOS"
                [(ngModel)]="productoForm.categoria"
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="prodStock">Stock Actual (unidades) *</label>
              <input
                id="prodStock"
                type="number"
                class="form-control"
                [(ngModel)]="productoForm.stock"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="prodMin">Stock Mínimo (Alerta) *</label>
              <input
                id="prodMin"
                type="number"
                class="form-control"
                [(ngModel)]="productoForm.stockMinimo"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="productoForm.activo" />
              <span>✅ Producto Activo para la Venta</span>
            </label>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalProductoAbierto.set(false)">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="guardarProducto()" [disabled]="guardandoItem()">
            <span>{{ productoEditando?.id ? 'Actualizar Producto' : 'Guardar Producto' }}</span>
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL CREAR / EDITAR ENVASE ==================== -->
      <app-modal
        [isOpen]="modalPresentacionAbierto()"
        [title]="presentacionEditando?.id ? ('Modificar Envase: ' + presentacionEditando?.nombre) : 'Nuevo Envase / Cucurucho'"
        size="md"
        (close)="modalPresentacionAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="presNombre">Nombre de la Presentación / Envase *</label>
            <input
              id="presNombre"
              type="text"
              class="form-control"
              placeholder="Ej. Cucurucho 1 Bocha o Pote 1/4 Kg"
              [(ngModel)]="presentacionForm.nombre"
            />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="presPrecio">Precio de Venta (Gs.) *</label>
              <input
                id="presPrecio"
                type="number"
                step="1000"
                class="form-control"
                placeholder="Ej. 12000"
                [(ngModel)]="presentacionForm.precio"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="presMax">Máx. Sabores Permitidos *</label>
              <input
                id="presMax"
                type="number"
                min="1"
                max="6"
                class="form-control"
                [(ngModel)]="presentacionForm.maxSabores"
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="presPeso">Peso Aprox. en Gramos</label>
              <input
                id="presPeso"
                type="number"
                class="form-control"
                placeholder="Ej. 100, 250, 1000"
                [(ngModel)]="presentacionForm.pesoGramosAprox"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="presStock">Stock Físico (Potes/Conos) *</label>
              <input
                id="presStock"
                type="number"
                class="form-control"
                [(ngModel)]="presentacionForm.stock"
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="presMin">Stock Mínimo (Alerta) *</label>
              <input
                id="presMin"
                type="number"
                class="form-control"
                [(ngModel)]="presentacionForm.stockMinimo"
              />
            </div>
            <div class="form-group d-flex align-center">
              <label class="checkbox-label mt-4">
                <input type="checkbox" [(ngModel)]="presentacionForm.activo" />
                <span>✅ Activo en Mostrador</span>
              </label>
            </div>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalPresentacionAbierto.set(false)">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="guardarPresentacion()" [disabled]="guardandoItem()">
            <span>{{ presentacionEditando?.id ? 'Actualizar Envase' : 'Guardar Envase' }}</span>
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
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
    .icon-total { background: #fee2e2; color: #dc2626; }
    .icon-agotados { background: #fef2f2; color: #b91c1c; }
    .icon-bajo { background: #fef3c7; color: #b45309; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 500; }
    .kpi-val { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }

    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover { background: var(--bg-subtle); color: var(--text-main); }
    .tab-btn.active {
      background: #0f172a;
      border-color: #0f172a;
      color: #ffffff;
    }
    .tab-badge {
      background: rgba(0, 0, 0, 0.08);
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      font-size: 0.72rem;
    }
    .tab-btn.active .tab-badge {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
    .tab-badge.badge-alert {
      background: #dc2626;
      color: #ffffff;
    }

    .filter-switch {
      display: flex;
      background: var(--bg-subtle);
      border-radius: 6px;
      padding: 3px;
    }
    .filter-btn {
      border: none;
      background: none;
      padding: 0.3rem 0.65rem;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.15s;
    }
    .filter-btn.active {
      background: #ffffff;
      color: var(--text-main);
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }

    .item-cell { display: flex; flex-direction: column; gap: 0.2rem; }
    .sub-label { font-size: 0.75rem; color: var(--text-muted); }
    .type-chip {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .chip-envase { background: #e0e7ff; color: #4338ca; }
    .chip-sabor { background: #dcfce7; color: #15803d; }
    .chip-producto { background: #fef3c7; color: #b45309; }

    .category-chip {
      background: var(--bg-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .feature-tag {
      background: var(--bg-subtle);
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .stock-val { font-weight: 700; font-size: 0.9375rem; color: var(--text-main); }
    .val-danger { color: var(--color-danger); }
    .min-val { font-size: 0.8125rem; color: var(--text-muted); }

    .stock-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 90px;
    }
    .mini-bar {
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      overflow: hidden;
    }
    .mini-bar-fill {
      height: 100%;
      background: #22c55e;
      border-radius: 2px;
    }
    .mini-bar-fill.fill-warning { background: #f59e0b; }
    .mini-bar-fill.fill-danger { background: #ef4444; }

    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.4rem;
    }
    .btn-icon-danger {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .btn-icon-danger:hover { background: #fee2e2; }

    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #dcfce7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }
    .text-success { color: #15803d; }
    .loading-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--text-muted);
    }

    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .checkboxes-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      background: var(--bg-subtle);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
    }
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      cursor: pointer;
      font-weight: 500;
    }
    .segmented-control {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .segmented-control button {
      padding: 0.6rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .segmented-control button.active {
      border-color: var(--primary);
      background: #fffbeb;
      color: #b45309;
    }
    .ajuste-banner {
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      margin-bottom: 1rem;
    }
    .text-right { text-align: right; }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .flex-wrap { flex-wrap: wrap; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }

    @media (max-width: 768px) {
      .form-row-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class StockComponent implements OnInit {
  public readonly stockService = inject(StockService);
  public readonly catalogosService = inject(CatalogosService);
  private readonly toast = inject(ToastService);

  public readonly tabActiva = signal<'TODOS' | 'ENVASE' | 'SABOR' | 'PRODUCTO'>('TODOS');
  public readonly filtroModo = signal<'TODOS' | 'ALERTAS'>('TODOS');

  // Modal Ajuste Rápido
  public readonly modalAjusteAbierto = signal<boolean>(false);
  public readonly itemSeleccionado = signal<ItemAlertaStock | null>(null);
  public readonly tipoModificacion = signal<'SUMAR' | 'ABSOLUTO'>('SUMAR');
  public cantidadAjuste: number = 0;
  public stockMinimoAjuste: number = 0;
  public readonly guardandoAjuste = signal<boolean>(false);

  // Modales Crear / Editar
  public readonly modalSaborAbierto = signal<boolean>(false);
  public readonly modalProductoAbierto = signal<boolean>(false);
  public readonly modalPresentacionAbierto = signal<boolean>(false);
  public readonly guardandoItem = signal<boolean>(false);

  public saborEditando: Partial<Sabor> | null = null;
  public saborForm: Partial<Sabor> = this.getSaborFormInicial();

  public productoEditando: Partial<ProductoSimple> | null = null;
  public productoForm: Partial<ProductoSimple> = this.getProductoFormInicial();

  public presentacionEditando: Partial<Presentacion> | null = null;
  public presentacionForm: Partial<Presentacion> = this.getPresentacionFormInicial();

  // Computed lists
  public readonly alertasFiltradas = computed(() => {
    const rep = this.stockService.reporte();
    if (!rep) return [];
    return [
      ...rep.presentacionesBajoStock,
      ...rep.saboresBajoStock,
      ...rep.productosBajoStock
    ];
  });

  public readonly saboresFiltrados = computed(() => {
    const todos = this.catalogosService.sabores();
    if (this.filtroModo() === 'ALERTAS') {
      return todos.filter(s => (s.stockKilos ?? 0) <= (s.stockMinimoKilos ?? 2) || !s.disponible);
    }
    return todos;
  });

  public readonly presentacionesFiltradas = computed(() => {
    const todos = this.catalogosService.presentaciones();
    if (this.filtroModo() === 'ALERTAS') {
      return todos.filter(p => (p.stock ?? 0) <= (p.stockMinimo ?? 10) || !p.activo);
    }
    return todos;
  });

  public readonly productosFiltrados = computed(() => {
    const todos = this.catalogosService.productosSimples();
    if (this.filtroModo() === 'ALERTAS') {
      return todos.filter(p => (p.stock ?? 0) <= (p.stockMinimo ?? 5) || !p.activo);
    }
    return todos;
  });

  ngOnInit(): void {
    this.recargarTodo();
  }

  recargarTodo(): void {
    this.stockService.cargarAlertas();
    this.catalogosService.cargarSabores();
    this.catalogosService.cargarPresentaciones();
    this.catalogosService.cargarProductosSimples();
  }

  getPorcentajeBarra(stock?: number, minimo?: number): number {
    const s = stock ?? 0;
    const m = minimo ?? 2;
    if (s <= 0) return 0;
    const maxKilosEstimados = Math.max(m * 3, 10);
    return Math.min(100, Math.round((s / maxKilosEstimados) * 100));
  }

  // ==================== AJUSTE RÁPIDO ====================
  abrirModalAjuste(item: ItemAlertaStock): void {
    this.itemSeleccionado.set(item);
    this.tipoModificacion.set('SUMAR');
    this.cantidadAjuste = item.unidad === 'kg' ? 5.0 : 20;
    this.stockMinimoAjuste = item.stockMinimo;
    this.modalAjusteAbierto.set(true);
  }

  abrirModalAjusteDesdeSabor(sabor: Sabor): void {
    const item: ItemAlertaStock = {
      id: sabor.id,
      nombre: sabor.nombre,
      tipo: 'SABOR',
      stockActual: sabor.stockKilos ?? 0,
      stockMinimo: sabor.stockMinimoKilos ?? 2.0,
      unidad: 'kg',
      estadoAlerta: (sabor.stockKilos ?? 0) <= 0 ? 'AGOTADO' : 'BAJO_STOCK',
      disponible: sabor.disponible
    };
    this.abrirModalAjuste(item);
  }

  abrirModalAjusteDesdePresentacion(pres: Presentacion): void {
    const item: ItemAlertaStock = {
      id: pres.id,
      nombre: pres.nombre,
      tipo: 'ENVASE',
      stockActual: pres.stock ?? 0,
      stockMinimo: pres.stockMinimo ?? 10,
      unidad: 'unid',
      estadoAlerta: (pres.stock ?? 0) <= 0 ? 'AGOTADO' : 'BAJO_STOCK',
      disponible: pres.activo
    };
    this.abrirModalAjuste(item);
  }

  abrirModalAjusteDesdeProducto(prod: ProductoSimple): void {
    const item: ItemAlertaStock = {
      id: prod.id,
      nombre: prod.nombre,
      tipo: 'PRODUCTO',
      stockActual: prod.stock ?? 0,
      stockMinimo: prod.stockMinimo ?? 5,
      unidad: 'unid',
      estadoAlerta: (prod.stock ?? 0) <= 0 ? 'AGOTADO' : 'BAJO_STOCK',
      disponible: prod.activo
    };
    this.abrirModalAjuste(item);
  }

  cerrarModalAjuste(): void {
    this.modalAjusteAbierto.set(false);
    this.itemSeleccionado.set(null);
  }

  guardarAjuste(): void {
    const item = this.itemSeleccionado();
    if (!item || !item.id) return;

    this.guardandoAjuste.set(true);
    const esSumar = this.tipoModificacion() === 'SUMAR';

    if (item.tipo === 'SABOR') {
      const nuevoStock = esSumar ? (item.stockActual + this.cantidadAjuste) : this.cantidadAjuste;
      this.stockService.ajustarStockSabor(item.id, {
        stockKilos: Math.max(0, Number(nuevoStock.toFixed(2))),
        stockMinimoKilos: Number(this.stockMinimoAjuste)
      }).subscribe({
        next: () => {
          this.guardandoAjuste.set(false);
          this.cerrarModalAjuste();
          this.catalogosService.cargarSabores();
        },
        error: () => this.guardandoAjuste.set(false)
      });
    } else if (item.tipo === 'ENVASE') {
      const nuevoStock = esSumar ? (item.stockActual + this.cantidadAjuste) : this.cantidadAjuste;
      this.stockService.ajustarStockPresentacion(item.id, {
        stock: Math.max(0, Math.round(nuevoStock)),
        stockMinimo: Math.round(this.stockMinimoAjuste)
      }).subscribe({
        next: () => {
          this.guardandoAjuste.set(false);
          this.cerrarModalAjuste();
          this.catalogosService.cargarPresentaciones();
        },
        error: () => this.guardandoAjuste.set(false)
      });
    } else if (item.tipo === 'PRODUCTO') {
      const nuevoStock = esSumar ? (item.stockActual + this.cantidadAjuste) : this.cantidadAjuste;
      this.stockService.ajustarStockProducto(item.id, {
        stock: Math.max(0, Math.round(nuevoStock)),
        stockMinimo: Math.round(this.stockMinimoAjuste)
      }).subscribe({
        next: () => {
          this.guardandoAjuste.set(false);
          this.cerrarModalAjuste();
          this.catalogosService.cargarProductosSimples();
        },
        error: () => this.guardandoAjuste.set(false)
      });
    }
  }

  // ==================== CRUD SABORES ====================
  private getSaborFormInicial(): Partial<Sabor> {
    return {
      nombre: '',
      descripcion: '',
      categoria: 'CREMA',
      stockKilos: 10.0,
      stockMinimoKilos: 2.0,
      aptoCeliaco: true,
      esVegano: false,
      sinAzucar: false,
      disponible: true
    };
  }

  abrirModalSabor(sabor?: Sabor): void {
    if (sabor) {
      this.saborEditando = sabor;
      this.saborForm = { ...sabor };
    } else {
      this.saborEditando = null;
      this.saborForm = this.getSaborFormInicial();
    }
    this.modalSaborAbierto.set(true);
  }

  guardarSabor(): void {
    if (!this.saborForm.nombre?.trim()) {
      this.toast.warning('Ingresa el nombre del sabor.');
      return;
    }

    this.guardandoItem.set(true);
    const op$ = this.saborEditando?.id
      ? this.catalogosService.actualizarSabor(this.saborEditando.id, this.saborForm)
      : this.catalogosService.crearSabor(this.saborForm);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalSaborAbierto.set(false);
        this.stockService.cargarAlertas();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        const msg = err.error?.mensaje || err.error?.error || 'Error al guardar el sabor.';
        this.toast.error(msg);
      }
    });
  }

  confirmarEliminarSabor(sab: Sabor): void {
    if (!sab.id) return;
    if (confirm(`¿Seguro que deseas eliminar el sabor "${sab.nombre}"?`)) {
      this.catalogosService.eliminarSabor(sab.id).subscribe({
        next: () => this.stockService.cargarAlertas()
      });
    }
  }

  // ==================== CRUD PRODUCTOS ====================
  private getProductoFormInicial(): Partial<ProductoSimple> {
    return {
      nombre: '',
      precio: 10000,
      categoria: 'BEBIDAS',
      stock: 30,
      stockMinimo: 5,
      activo: true
    };
  }

  abrirModalProducto(prod?: ProductoSimple): void {
    if (prod) {
      this.productoEditando = prod;
      this.productoForm = { ...prod };
    } else {
      this.productoEditando = null;
      this.productoForm = this.getProductoFormInicial();
    }
    this.modalProductoAbierto.set(true);
  }

  guardarProducto(): void {
    if (!this.productoForm.nombre?.trim() || !this.productoForm.precio) {
      this.toast.warning('Completa el nombre y el precio del producto.');
      return;
    }

    this.guardandoItem.set(true);
    const op$ = this.productoEditando?.id
      ? this.catalogosService.actualizarProductoSimple(this.productoEditando.id, this.productoForm)
      : this.catalogosService.crearProductoSimple(this.productoForm);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalProductoAbierto.set(false);
        this.stockService.cargarAlertas();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        const msg = err.error?.mensaje || err.error?.error || 'Error al guardar el producto.';
        this.toast.error(msg);
      }
    });
  }

  confirmarEliminarProducto(prod: ProductoSimple): void {
    if (!prod.id) return;
    if (confirm(`¿Seguro que deseas eliminar el producto "${prod.nombre}"?`)) {
      this.catalogosService.eliminarProductoSimple(prod.id).subscribe({
        next: () => this.stockService.cargarAlertas()
      });
    }
  }

  // ==================== CRUD PRESENTACIONES ====================
  private getPresentacionFormInicial(): Partial<Presentacion> {
    return {
      nombre: '',
      precio: 15000,
      maxSabores: 2,
      pesoGramosAprox: 200,
      stock: 50,
      stockMinimo: 10,
      activo: true
    };
  }

  abrirModalPresentacion(pres?: Presentacion): void {
    if (pres) {
      this.presentacionEditando = pres;
      this.presentacionForm = { ...pres };
    } else {
      this.presentacionEditando = null;
      this.presentacionForm = this.getPresentacionFormInicial();
    }
    this.modalPresentacionAbierto.set(true);
  }

  guardarPresentacion(): void {
    if (!this.presentacionForm.nombre?.trim() || !this.presentacionForm.precio) {
      this.toast.warning('Completa el nombre y el precio del envase.');
      return;
    }

    this.guardandoItem.set(true);
    const op$ = this.presentacionEditando?.id
      ? this.catalogosService.actualizarPresentacion(this.presentacionEditando.id, this.presentacionForm)
      : this.catalogosService.crearPresentacion(this.presentacionForm);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalPresentacionAbierto.set(false);
        this.stockService.cargarAlertas();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        const msg = err.error?.mensaje || err.error?.error || 'Error al guardar el envase.';
        this.toast.error(msg);
      }
    });
  }

  confirmarEliminarPresentacion(pres: Presentacion): void {
    if (!pres.id) return;
    if (confirm(`¿Seguro que deseas eliminar la presentación "${pres.nombre}"?`)) {
      this.catalogosService.eliminarPresentacion(pres.id).subscribe({
        next: () => this.stockService.cargarAlertas()
      });
    }
  }
}
