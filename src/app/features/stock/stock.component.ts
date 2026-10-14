import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { InventarioService } from '../../core/services/inventario.service';
import { ReporteExportService } from '../../core/services/reporte-export.service';
import {
  ItemAlertaStock,
  TipoItemStock,
  TipoMovimientoStock,
  MovimientoStock,
  ReporteValorizacion,
  ValorizacionItem,
  ArticuloInventario,
  RegistrarMovimientoRequest
} from '../../core/models/stock.model';
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
            Kardex físico, valorización en Gs., bachas de helado por kg, envases y bebidas
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-primary" (click)="abrirModalMovimiento()">
            <app-icon name="plus" [size]="16" />
            <span>Registrar Movimiento</span>
          </button>
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
              (click)="cambiarTabStock('TODOS')"
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
              (click)="cambiarTabStock('SABOR')"
            >
              <app-icon name="ice-cream" [size]="16" />
              <span>Sabores en Bacha</span>
              <span class="tab-badge">{{ catalogosService.sabores().length }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'ENVASE'"
              (click)="cambiarTabStock('ENVASE')"
            >
              <app-icon name="cup-soda" [size]="16" />
              <span>Envases y Cucuruchos</span>
              <span class="tab-badge">{{ catalogosService.presentaciones().length }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'PRODUCTO'"
              (click)="cambiarTabStock('PRODUCTO')"
            >
              <app-icon name="coffee" [size]="16" />
              <span>Bebidas y Cafetería</span>
              <span class="tab-badge">{{ catalogosService.productosSimples().length }}</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'KARDEX'"
              (click)="cambiarTabStock('KARDEX')"
            >
              <app-icon name="clipboard-list" [size]="16" />
              <span>Movimientos & Kardex</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'VALORIZACION'"
              (click)="cambiarTabStock('VALORIZACION')"
            >
              <app-icon name="warehouse" [size]="16" />
              <span>Valorización en Gs.</span>
            </button>
          </div>

          <!-- FILTRO VISUALIZACIÓN (SOLO PARA PESTAÑAS DE CATEGORÍA) -->
          @if (tabActiva() === 'SABOR' || tabActiva() === 'ENVASE' || tabActiva() === 'PRODUCTO') {
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

        <!-- ==================== VISTA 5: KARDEX DE MOVIMIENTOS ==================== -->
        @if (tabActiva() === 'KARDEX') {
          <div class="kardex-view">
            <!-- FILTROS DE KARDEX -->
            <div class="kardex-filters-bar">
              <div class="filter-group">
                <label>Tipo Ítem:</label>
                <select class="form-control-sm" [(ngModel)]="filtroKardexTipo" (ngModelChange)="aplicarFiltrosKardex()">
                  <option value="TODOS">Todos los tipos</option>
                  <option value="SABOR">Sabores de Helado (kg)</option>
                  <option value="ENVASE">Envases y Cucuruchos (unid)</option>
                  <option value="PRODUCTO">Productos Simples (unid)</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Tipo Movimiento:</label>
                <select class="form-control-sm" [(ngModel)]="filtroKardexMov" (ngModelChange)="aplicarFiltrosKardex()">
                  <option value="TODOS">Todos los movimientos</option>
                  <option value="ENTRADA_COMPRA">Entrada por Compra</option>
                  <option value="ENTRADA_PRODUCCION">Entrada por Producción</option>
                  <option value="SALIDA_VENTA">Salida por Venta POS</option>
                  <option value="SALIDA_MERMA">Baja por Merma / Rotura</option>
                  <option value="AJUSTE_INVENTARIO">Ajuste por Conteo Físico</option>
                  <option value="REINTEGRO_CANCELACION">Reintegro por Cancelación</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Desde:</label>
                <input type="date" class="form-control-sm" [(ngModel)]="filtroKardexInicio" (ngModelChange)="aplicarFiltrosKardex()" />
              </div>

              <div class="filter-group">
                <label>Hasta:</label>
                <input type="date" class="form-control-sm" [(ngModel)]="filtroKardexFin" (ngModelChange)="aplicarFiltrosKardex()" />
              </div>

              <div class="filter-actions-inline">
                <button type="button" class="btn btn-outline btn-sm" (click)="exportarKardexCsv()" title="Exportar movimientos a CSV / Excel">
                  <app-icon name="file-spreadsheet" [size]="14" />
                  <span>CSV</span>
                </button>
                <button type="button" class="btn btn-primary btn-sm" (click)="exportarKardexPdf()" title="Descargar Kardex en PDF A4">
                  <app-icon name="file-text" [size]="14" />
                  <span>PDF A4</span>
                </button>
              </div>
            </div>

            <!-- TABLA DE KARDEX -->
            @if (inventarioService.cargandoKardex()) {
              <div class="loading-state">
                <app-icon name="refresh" [size]="20" class="spinning" />
                <span>Cargando movimientos del Kardex...</span>
              </div>
            } @else if (inventarioService.kardex().length === 0) {
              <div class="empty-state">
                <div class="empty-icon text-muted">
                  <app-icon name="clipboard-list" [size]="40" />
                </div>
                <h3>No hay movimientos registrados en el período</h3>
                <p>Registra compras, producción artesanal, bajas por merma o ventas desde el POS para ver el flujo aquí.</p>
                <button type="button" class="btn btn-primary mt-2" (click)="abrirModalMovimiento()">
                  <app-icon name="plus" [size]="16" />
                  <span>Registrar Movimiento Ahora</span>
                </button>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Fecha / Hora</th>
                      <th>Tipo Movimiento</th>
                      <th>Artículo</th>
                      <th class="text-right">Cantidad</th>
                      <th class="text-center">Stock Antes &rarr; Después</th>
                      <th>Motivo / Referencia</th>
                      <th class="text-right">Costo Unit. (Gs.)</th>
                      <th class="text-right">Total (Gs.)</th>
                      <th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (mov of inventarioService.kardex(); track mov.id) {
                      <tr>
                        <td class="font-mono text-sm whitespace-nowrap">
                          {{ mov.fecha | date:'dd/MM/yyyy HH:mm' }}
                        </td>
                        <td>
                          <span class="kardex-badge" [ngClass]="getClaseTipoMovimiento(mov.tipoMovimiento)">
                            {{ getEtiquetaTipoMovimiento(mov.tipoMovimiento) }}
                          </span>
                        </td>
                        <td>
                          <div class="item-cell">
                            <strong>{{ mov.itemNombre }}</strong>
                            <span class="sub-label">
                              <span class="type-chip" [ngClass]="getClaseTipoItem(mov.tipoItem)">{{ mov.tipoItem }}</span>
                            </span>
                          </div>
                        </td>
                        <td class="text-right font-bold whitespace-nowrap" [class.text-success]="mov.cantidad > 0" [class.text-danger]="mov.cantidad < 0">
                          {{ mov.cantidad > 0 ? '+' : '' }}{{ mov.tipoItem === 'SABOR' ? (mov.cantidad | number:'1.2-3') : mov.cantidad }} {{ mov.unidad }}
                        </td>
                        <td class="text-center font-mono text-sm">
                          <span class="text-muted">{{ mov.tipoItem === 'SABOR' ? (mov.stockAnterior | number:'1.2-3') : mov.stockAnterior }}</span>
                          <span class="mx-1">&rarr;</span>
                          <strong>{{ mov.tipoItem === 'SABOR' ? (mov.stockPosterior | number:'1.2-3') : mov.stockPosterior }}</strong>
                        </td>
                        <td class="text-sm max-w-xs truncate" [title]="mov.motivo || ''">
                          {{ mov.motivo || '-' }}
                        </td>
                        <td class="text-right font-mono text-sm">
                          {{ mov.costoUnitario ? (mov.costoUnitario | appCurrency) : '-' }}
                        </td>
                        <td class="text-right font-mono text-sm font-bold">
                          {{ (mov.costoUnitario && mov.cantidad) ? ((mov.costoUnitario * mov.cantidad) | appCurrency) : '-' }}
                        </td>
                        <td class="text-sm text-muted">
                          {{ mov.usuario || 'Sistema' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- ==================== VISTA 6: VALORIZACIÓN DE STOCK ==================== -->
        @if (tabActiva() === 'VALORIZACION') {
          <div class="valorizacion-view">
            @if (inventarioService.cargandoValorizacion()) {
              <div class="loading-state">
                <app-icon name="refresh" [size]="20" class="spinning" />
                <span>Calculando valorización del inventario...</span>
              </div>
            } @else if (inventarioService.valorizacion(); as val) {
              <!-- RESUMEN DE VALORIZACIÓN -->
              <div class="val-summary-cards">
                <div class="val-card border-costo">
                  <span class="val-label">Valor Total en Stock (a Costo)</span>
                  <span class="val-amount text-primary">{{ val.totalValorizadoGeneral | appCurrency }}</span>
                  <span class="val-sub">{{ val.totalArticulos }} artículos físicos contabilizados</span>
                </div>
                <div class="val-card border-venta">
                  <span class="val-label">Artículos en Alerta Crítica</span>
                  <span class="val-amount text-danger">{{ val.totalBajoMinimo + val.totalAgotados }}</span>
                  <span class="val-sub">{{ val.totalAgotados }} agotados &bull; {{ val.totalBajoMinimo }} bajo mínimo</span>
                </div>
                <div class="val-card border-margen">
                  <span class="val-label">Artículos con Stock Óptimo</span>
                  <span class="val-amount text-success">{{ val.totalArticulos - val.totalBajoMinimo - val.totalAgotados }}</span>
                  <span class="val-sub">Existencia física normal</span>
                </div>
              </div>

              <!-- DESGLOSE POR CATEGORÍA -->
              <div class="val-categories-breakdown">
                <div class="cat-pill">
                  <app-icon name="ice-cream" [size]="16" />
                  <span>Sabores de Helado: <strong>{{ subtotalSabores() | appCurrency }}</strong></span>
                </div>
                <div class="cat-pill">
                  <app-icon name="cup-soda" [size]="16" />
                  <span>Envases / Cucuruchos: <strong>{{ subtotalPresentaciones() | appCurrency }}</strong></span>
                </div>
                <div class="cat-pill">
                  <app-icon name="coffee" [size]="16" />
                  <span>Productos Simples: <strong>{{ subtotalProductos() | appCurrency }}</strong></span>
                </div>
              </div>

              <!-- ACCIONES DE EXPORTACIÓN Y BÚSQUEDA -->
              <div class="val-toolbar">
                <div class="search-box">
                  <app-icon name="search" [size]="16" />
                  <input
                    type="text"
                    class="form-control-sm"
                    placeholder="Buscar artículo..."
                    [(ngModel)]="busquedaValorizacion"
                  />
                </div>

                <div class="filter-group">
                  <select class="form-control-sm" [(ngModel)]="filtroValorizacionTipo">
                    <option value="TODOS">Todos los tipos</option>
                    <option value="SABOR">Sabores de Helado</option>
                    <option value="ENVASE">Envases</option>
                    <option value="PRODUCTO">Productos Simples</option>
                  </select>
                </div>

                <div class="export-buttons-group">
                  <button type="button" class="btn btn-outline btn-sm" (click)="exportarValorizacionCsv()">
                    <app-icon name="file-spreadsheet" [size]="14" />
                    <span>Exportar CSV</span>
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" (click)="exportarValorizacionPdf()">
                    <app-icon name="file-text" [size]="14" />
                    <span>Descargar PDF A4</span>
                  </button>
                </div>
              </div>

              <!-- TABLA DE ARTÍCULOS VALORADOS -->
              <div class="table-responsive">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Artículo</th>
                      <th>Tipo</th>
                      <th class="text-right">Stock Actual</th>
                      <th class="text-right">Costo / Precio Unit.</th>
                      <th class="text-right">Total Valorado (Gs.)</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of itemsValorizacionFiltrados(); track item.tipoItem + '-' + item.id) {
                      <tr>
                        <td>
                          <strong>{{ item.nombre }}</strong>
                        </td>
                        <td>
                          <span class="type-chip" [ngClass]="getClaseTipoItem(item.tipoItem)">{{ item.tipoItem }}</span>
                        </td>
                        <td class="text-right font-mono font-bold">
                          {{ item.tipoItem === 'SABOR' ? (item.stockActual | number:'1.2-3') : item.stockActual }} {{ item.unidad }}
                        </td>
                        <td class="text-right font-mono text-sm">
                          {{ item.precioUnitario | appCurrency }}
                        </td>
                        <td class="text-right font-mono font-bold text-primary">
                          {{ item.totalValorizado | appCurrency }}
                        </td>
                        <td>
                          @if (item.estadoStock === 'AGOTADO') {
                            <span class="badge-status badge-danger">Agotado</span>
                          } @else if (item.estadoStock === 'BAJO') {
                            <span class="badge-status badge-warning">Bajo Mínimo</span>
                          } @else {
                            <span class="badge-status badge-success">Óptimo</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
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

      <!-- ==================== MODAL REGISTRAR MOVIMIENTO MANUAL ==================== -->
      <app-modal
        [isOpen]="modalMovimientoAbierto()"
        title="Registrar Movimiento de Inventario / Kardex"
        size="md"
        (close)="cerrarModalMovimiento()"
      >
        <div body class="form-grid">
          <!-- TIPO DE ÍTEM -->
          <div class="form-group">
            <label class="form-label">Tipo de Artículo *</label>
            <div class="segmented-control">
              <button
                type="button"
                [class.active]="movimientoTipoItem() === 'PRODUCTO'"
                (click)="cambiarTipoItemMovimiento('PRODUCTO')"
              >
                ☕ Producto Simple
              </button>
              <button
                type="button"
                [class.active]="movimientoTipoItem() === 'SABOR'"
                (click)="cambiarTipoItemMovimiento('SABOR')"
              >
                🍨 Helado en Bacha
              </button>
              <button
                type="button"
                [class.active]="movimientoTipoItem() === 'ENVASE'"
                (click)="cambiarTipoItemMovimiento('ENVASE')"
              >
                🥡 Envase / Pote
              </button>
            </div>
          </div>

          <!-- SELECTOR DE ARTÍCULO -->
          <div class="form-group">
            <label class="form-label" for="movItemId">Seleccionar Artículo *</label>
            <select
              id="movItemId"
              class="form-control"
              [(ngModel)]="movimientoItemId"
              (ngModelChange)="onArticuloMovimientoCambiado()"
            >
              <option [ngValue]="null" disabled>-- Seleccione un artículo --</option>
              @for (art of articulosFiltradosParaModal(); track art.id) {
                <option [ngValue]="art.id">
                  {{ art.nombre }} (Stock: {{ art.tipoItem === 'SABOR' ? (art.stockActual | number:'1.2-3') : art.stockActual }} {{ art.unidad }})
                </option>
              }
            </select>
          </div>

          <!-- TIPO DE MOVIMIENTO -->
          <div class="form-group">
            <label class="form-label" for="movTipoMov">Tipo de Movimiento *</label>
            <select
              id="movTipoMov"
              class="form-control"
              [(ngModel)]="movimientoTipoMov"
            >
              <option value="ENTRADA_COMPRA">➕ Entrada por Compra a Proveedor</option>
              <option value="ENTRADA_PRODUCCION">🍨 Entrada por Elaboración / Producción</option>
              <option value="SALIDA_MERMA">⚠️ Salida por Merma / Vencimiento / Rotura</option>
              <option value="AJUSTE_INVENTARIO">📋 Ajuste por Conteo Físico</option>
            </select>
          </div>

          <!-- CANTIDAD Y UNIDAD -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="movCantidad">
                Cantidad a {{ esMovimientoSalida() ? 'Descontar' : 'Ingresar' }} ({{ getUnidadMovimientoActual() }}) *
              </label>
              <input
                id="movCantidad"
                type="number"
                [step]="movimientoTipoItem() === 'SABOR' ? '0.1' : '1'"
                min="0.001"
                class="form-control"
                placeholder="Ej. 5"
                [(ngModel)]="movimientoCantidad"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="movCosto">Costo Unitario en Gs. (Opcional)</label>
              <input
                id="movCosto"
                type="number"
                step="500"
                class="form-control"
                placeholder="Ej. 18000"
                [(ngModel)]="movimientoCostoUnitario"
              />
            </div>
          </div>

          <!-- MOTIVO O JUSTIFICACIÓN -->
          <div class="form-group">
            <label class="form-label" for="movMotivo">Motivo / Justificación *</label>
            <textarea
              id="movMotivo"
              class="form-control"
              rows="3"
              placeholder="Ej: Factura compra N° 001-002-1234, o Descongelamiento accidental en heladera 2"
              [(ngModel)]="movimientoMotivo"
            ></textarea>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalMovimiento()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="guardarMovimiento()"
            [disabled]="inventarioService.guardandoMovimiento() || !movimientoItemId || !movimientoMotivo.trim() || movimientoCantidad <= 0"
          >
            <span>{{ inventarioService.guardandoMovimiento() ? 'Registrando...' : 'Confirmar Movimiento' }}</span>
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

    /* KARDEX Y VALORIZACIÓN STYLES */
    .kardex-view, .valorizacion-view {
      padding: 0.5rem 0;
    }
    .kardex-filters-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .form-control-sm {
      padding: 0.35rem 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      color: var(--text-main);
      font-size: 0.8125rem;
      outline: none;
    }
    .filter-actions-inline {
      margin-left: auto;
      display: flex;
      gap: 0.5rem;
    }
    .kardex-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .badge-compra { background: #dcfce7; color: #15803d; }
    .badge-produccion { background: #d1fae5; color: #065f46; }
    .badge-venta { background: #e0f2fe; color: #0369a1; }
    .badge-merma { background: #fee2e2; color: #b91c1c; }
    .badge-ajuste { background: #f3e8ff; color: #7e22ce; }
    .badge-reintegro { background: #fef3c7; color: #b45309; }

    .val-summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .val-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      box-shadow: var(--shadow-sm);
    }
    .border-costo { border-left: 4px solid #3b82f6; }
    .border-venta { border-left: 4px solid #10b981; }
    .border-margen { border-left: 4px solid #8b5cf6; }
    .val-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 500; }
    .val-amount { font-size: 1.5rem; font-weight: 800; }
    .val-sub { font-size: 0.75rem; color: var(--text-muted); }
    .text-purple { color: #8b5cf6; }

    .val-categories-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .cat-pill {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 9999px;
      padding: 0.4rem 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-main);
    }

    .val-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.65rem;
      color: var(--text-muted);
    }
    .search-box input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.8125rem;
      color: var(--text-main);
    }
    .export-buttons-group {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }
    .spinning {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class StockComponent implements OnInit {
  public readonly stockService = inject(StockService);
  public readonly catalogosService = inject(CatalogosService);
  public readonly inventarioService = inject(InventarioService);
  public readonly exportService = inject(ReporteExportService);
  private readonly toast = inject(ToastService);

  public readonly tabActiva = signal<'TODOS' | 'ENVASE' | 'SABOR' | 'PRODUCTO' | 'KARDEX' | 'VALORIZACION'>('TODOS');
  public readonly filtroModo = signal<'TODOS' | 'ALERTAS'>('TODOS');

  // Modal Registrar Movimiento Manual (Kardex)
  public readonly modalMovimientoAbierto = signal<boolean>(false);
  public readonly movimientoTipoItem = signal<'PRODUCTO' | 'SABOR' | 'ENVASE'>('PRODUCTO');
  public movimientoItemId: number | null = null;
  public movimientoTipoMov: TipoMovimientoStock = 'ENTRADA_COMPRA';
  public movimientoCantidad: number = 1;
  public movimientoMotivo: string = '';
  public movimientoCostoUnitario?: number;

  // Filtros Kardex
  public filtroKardexTipo: string = 'TODOS';
  public filtroKardexMov: string = 'TODOS';
  public filtroKardexInicio: string = '';
  public filtroKardexFin: string = '';

  // Filtros Valorización
  public busquedaValorizacion: string = '';
  public filtroValorizacionTipo: string = 'TODOS';

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
    this.inventarioService.listarArticulos().subscribe();
  }

  // ==================== MOVIMIENTOS & KARDEX LOGIC ====================
  public readonly articulosFiltradosParaModal = computed(() => {
    const tipo = this.movimientoTipoItem();
    return this.inventarioService.articulos().filter(a => a.tipoItem === tipo);
  });

  public readonly itemsValorizacionFiltrados = computed(() => {
    const val = this.inventarioService.valorizacion();
    if (!val || !val.items) return [];
    let items = val.items;

    if (this.filtroValorizacionTipo !== 'TODOS') {
      items = items.filter(i => i.tipoItem === this.filtroValorizacionTipo);
    }

    if (this.busquedaValorizacion.trim()) {
      const q = this.busquedaValorizacion.toLowerCase().trim();
      items = items.filter(i => i.nombre.toLowerCase().includes(q));
    }

    return items;
  });

  public readonly subtotalSabores = computed(() => {
    const items = this.inventarioService.valorizacion()?.items || [];
    return items.filter(i => i.tipoItem === 'SABOR').reduce((acc, i) => acc + (i.totalValorizado || 0), 0);
  });

  public readonly subtotalPresentaciones = computed(() => {
    const items = this.inventarioService.valorizacion()?.items || [];
    return items.filter(i => i.tipoItem === 'ENVASE').reduce((acc, i) => acc + (i.totalValorizado || 0), 0);
  });

  public readonly subtotalProductos = computed(() => {
    const items = this.inventarioService.valorizacion()?.items || [];
    return items.filter(i => i.tipoItem === 'PRODUCTO').reduce((acc, i) => acc + (i.totalValorizado || 0), 0);
  });

  cambiarTabStock(tab: 'TODOS' | 'ENVASE' | 'SABOR' | 'PRODUCTO' | 'KARDEX' | 'VALORIZACION'): void {
    this.tabActiva.set(tab);
    if (tab === 'KARDEX') {
      this.cargarKardex();
    } else if (tab === 'VALORIZACION') {
      this.cargarValorizacion();
    }
  }

  cargarKardex(): void {
    this.inventarioService.obtenerKardex(
      this.filtroKardexInicio || undefined,
      this.filtroKardexFin || undefined,
      this.filtroKardexTipo,
      this.filtroKardexMov
    ).subscribe();
  }

  cargarValorizacion(): void {
    this.inventarioService.obtenerValorizacion().subscribe();
  }

  aplicarFiltrosKardex(): void {
    this.cargarKardex();
  }

  abrirModalMovimiento(): void {
    this.inventarioService.listarArticulos().subscribe(() => {
      this.cambiarTipoItemMovimiento('PRODUCTO');
      this.movimientoTipoMov = 'ENTRADA_COMPRA';
      this.movimientoCantidad = 1;
      this.movimientoMotivo = '';
      this.modalMovimientoAbierto.set(true);
    });
  }

  cerrarModalMovimiento(): void {
    this.modalMovimientoAbierto.set(false);
  }

  cambiarTipoItemMovimiento(tipo: 'PRODUCTO' | 'SABOR' | 'ENVASE'): void {
    this.movimientoTipoItem.set(tipo);
    const disponibles = this.articulosFiltradosParaModal();
    if (disponibles.length > 0) {
      this.movimientoItemId = disponibles[0].id;
      this.movimientoCostoUnitario = disponibles[0].precio || undefined;
    } else {
      this.movimientoItemId = null;
      this.movimientoCostoUnitario = undefined;
    }
    this.movimientoCantidad = tipo === 'SABOR' ? 5.0 : 1;
  }

  onArticuloMovimientoCambiado(): void {
    if (!this.movimientoItemId) return;
    const art = this.inventarioService.articulos().find(a => a.id === this.movimientoItemId && a.tipoItem === this.movimientoTipoItem());
    if (art && art.precio) {
      this.movimientoCostoUnitario = art.precio;
    }
  }

  esMovimientoSalida(): boolean {
    return this.movimientoTipoMov === 'SALIDA_MERMA';
  }

  getUnidadMovimientoActual(): string {
    return this.movimientoTipoItem() === 'SABOR' ? 'kg' : 'unid';
  }

  guardarMovimiento(): void {
    if (!this.movimientoItemId) {
      this.toast.warning('Selecciona un artículo válido.');
      return;
    }
    if (!this.movimientoMotivo.trim()) {
      this.toast.warning('El motivo o justificación del movimiento es obligatorio.');
      return;
    }
    if (this.movimientoCantidad <= 0) {
      this.toast.warning('La cantidad debe ser mayor a 0.');
      return;
    }

    const request: RegistrarMovimientoRequest = {
      tipoItem: this.movimientoTipoItem(),
      itemId: this.movimientoItemId,
      tipoMovimiento: this.movimientoTipoMov,
      cantidad: this.movimientoCantidad,
      motivo: this.movimientoMotivo.trim(),
      costoUnitario: this.movimientoCostoUnitario
    };

    this.inventarioService.registrarMovimiento(request).subscribe({
      next: () => {
        this.cerrarModalMovimiento();
        this.recargarTodo();
        if (this.tabActiva() === 'KARDEX') {
          this.cargarKardex();
        } else if (this.tabActiva() === 'VALORIZACION') {
          this.cargarValorizacion();
        }
      }
    });
  }

  getClaseTipoMovimiento(tipo: TipoMovimientoStock): string {
    switch (tipo) {
      case 'ENTRADA_COMPRA': return 'badge-compra';
      case 'ENTRADA_PRODUCCION': return 'badge-produccion';
      case 'SALIDA_VENTA': return 'badge-venta';
      case 'SALIDA_MERMA': return 'badge-merma';
      case 'AJUSTE_INVENTARIO': return 'badge-ajuste';
      case 'REINTEGRO_CANCELACION': return 'badge-reintegro';
      default: return '';
    }
  }

  getEtiquetaTipoMovimiento(tipo: TipoMovimientoStock): string {
    switch (tipo) {
      case 'ENTRADA_COMPRA': return 'Entrada Compra';
      case 'ENTRADA_PRODUCCION': return 'Producción Helado';
      case 'SALIDA_VENTA': return 'Venta POS';
      case 'SALIDA_MERMA': return 'Baja / Merma';
      case 'AJUSTE_INVENTARIO': return 'Ajuste Conteo';
      case 'REINTEGRO_CANCELACION': return 'Reintegro Cancelación';
      default: return tipo;
    }
  }

  getClaseTipoItem(tipo: TipoItemStock): string {
    switch (tipo) {
      case 'SABOR': return 'chip-sabor';
      case 'ENVASE': return 'chip-envase';
      case 'PRODUCTO': return 'chip-producto';
      default: return '';
    }
  }

  exportarKardexCsv(): void {
    this.exportService.exportarKardexCsv(
      this.inventarioService.kardex(),
      { inicio: this.filtroKardexInicio, fin: this.filtroKardexFin }
    );
  }

  exportarKardexPdf(): void {
    this.exportService.exportarKardexPdf(
      this.inventarioService.kardex(),
      { inicio: this.filtroKardexInicio, fin: this.filtroKardexFin }
    );
  }

  exportarValorizacionCsv(): void {
    const val = this.inventarioService.valorizacion();
    if (val) this.exportService.exportarValorizacionCsv(val);
  }

  exportarValorizacionPdf(): void {
    const val = this.inventarioService.valorizacion();
    if (val) this.exportService.exportarValorizacionPdf(val);
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
