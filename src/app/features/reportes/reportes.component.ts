import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../core/services/reportes.service';
import { ToastService } from '../../core/services/toast.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';
import { PedidosService } from '../../core/services/pedidos.service';
import { ImpresorasService } from '../../core/services/impresoras.service';
import { ComprobanteModalComponent } from '../../shared/components/comprobante-modal/comprobante-modal.component';
import { Pedido } from '../../core/models/pedido.model';
import { InstitucionService } from '../../core/services/institucion.service';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { ReporteExportService } from '../../core/services/reporte-export.service';
import { InventarioService } from '../../core/services/inventario.service';
import { TipoMovimientoStock, TipoItemStock, TomaInventario } from '../../core/models/stock.model';
import {
  DashboardReporteDTO,
  ReporteVentasDTO,
  LibroVentasIvaDTO,
  ReporteCajasDTO,
  RankingProductosDTO,
  PresetFecha,
  VentaDiariaDTO,
  ItemRankingDTO,
  SaborRankingDTO,
  PedidoResumenReporteDTO
} from '../../core/models/reporte.model';

type TabReporte = 'dashboard' | 'ventas' | 'libro-iva' | 'cajas' | 'rankings' | 'reimpresiones' | 'talonarios' | 'inventario';

interface DonutSegment {
  label: string;
  monto: number;
  porcentaje: number;
  color: string;
  dashArray: string;
  dashOffset: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, AppIconComponent, AppCurrencyPipe, ComprobanteModalComponent, AppModalComponent],
  template: `
    <div class="reportes-page">
      <!-- HEADER PRINCIPAL -->
      <header class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="bar-chart-3" [size]="28" class="title-icon" />
            <span>Módulo de Reportes y Analítica</span>
          </h1>
          <p class="page-subtitle">
            Inteligencia de ventas, auditoría de turnos de caja y libro fiscal SET / DNIT
          </p>
        </div>

        <!-- ACCIONES RÁPIDAS DE CABECERA -->
        <div class="header-actions">
          <button type="button" class="btn btn-outline" (click)="refrescar()" [disabled]="cargando()">
            <app-icon name="refresh" [size]="16" [class.spinning]="cargando()" />
            <span>Actualizar</span>
          </button>

          @if (tabActiva() === 'ventas' && ventasData()) {
            <button type="button" class="btn btn-outline" (click)="exportarVentasCsv()" title="Descargar listado de ventas en formato CSV / Excel">
              <app-icon name="file-spreadsheet" [size]="16" />
              <span>Exportar CSV</span>
            </button>
            <button type="button" class="btn btn-primary" (click)="exportarVentasPdf()" [disabled]="descargandoPdf()" title="Descargar reporte detallado de ventas en PDF tamaño A4">
              <app-icon name="file-text" [size]="16" />
              <span>{{ descargandoPdf() ? 'Generando PDF...' : 'Descargar PDF (A4)' }}</span>
            </button>
          }

          @if (tabActiva() === 'libro-iva' && libroIvaData()) {
            <button type="button" class="btn btn-outline" (click)="descargarCsvLibroIva()" [disabled]="descargandoCsv()" title="Descargar Libro IVA en formato CSV Hechauka/Excel">
              <app-icon name="file-spreadsheet" [size]="16" />
              <span>{{ descargandoCsv() ? 'Generando...' : 'Descargar CSV' }}</span>
            </button>
            <button type="button" class="btn btn-primary" (click)="exportarLibroIvaPdf()" [disabled]="descargandoPdf()" title="Descargar Libro de Ventas IVA en PDF tamaño A4">
              <app-icon name="file-text" [size]="16" />
              <span>{{ descargandoPdf() ? 'Generando PDF...' : 'Descargar PDF (A4)' }}</span>
            </button>
          }

          @if (tabActiva() === 'cajas' && cajasData()) {
            <button type="button" class="btn btn-outline" (click)="exportarCajasCsv()" title="Descargar auditoría de cajas en formato CSV / Excel">
              <app-icon name="file-spreadsheet" [size]="16" />
              <span>Exportar CSV</span>
            </button>
            <button type="button" class="btn btn-primary" (click)="exportarCajasPdf()" [disabled]="descargandoPdf()" title="Descargar auditoría de cajas en PDF tamaño A4">
              <app-icon name="file-text" [size]="16" />
              <span>{{ descargandoPdf() ? 'Generando PDF...' : 'Descargar PDF (A4)' }}</span>
            </button>
          }

          @if (tabActiva() === 'inventario') {
            <button type="button" class="btn btn-outline" (click)="exportarInventarioCsv()" title="Descargar reporte de inventario en CSV">
              <app-icon name="file-spreadsheet" [size]="16" />
              <span>Exportar CSV</span>
            </button>
            <button type="button" class="btn btn-primary" (click)="exportarInventarioPdf()" [disabled]="descargandoPdf()" title="Descargar reporte de inventario en PDF tamaño A4">
              <app-icon name="file-text" [size]="16" />
              <span>{{ descargandoPdf() ? 'Generando PDF...' : 'Descargar PDF (A4)' }}</span>
            </button>
          }
        </div>
      </header>

      <!-- BARRA DE FILTRO DE FECHAS GLOBAL -->
      <section class="filtro-fechas-card">
        <div class="preset-buttons">
          <button
            type="button"
            class="preset-btn"
            [class.active]="presetSeleccionado() === 'hoy'"
            (click)="aplicarPreset('hoy')"
          >
            Hoy
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="presetSeleccionado() === 'ayer'"
            (click)="aplicarPreset('ayer')"
          >
            Ayer
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="presetSeleccionado() === '7dias'"
            (click)="aplicarPreset('7dias')"
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="presetSeleccionado() === 'esteMes'"
            (click)="aplicarPreset('esteMes')"
          >
            Este Mes
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="presetSeleccionado() === 'mesAnterior'"
            (click)="aplicarPreset('mesAnterior')"
          >
            Mes Anterior
          </button>
        </div>

        <div class="fechas-inputs">
          <div class="input-date-group">
            <label for="fechaInicio">Desde:</label>
            <input
              id="fechaInicio"
              type="date"
              class="form-control"
              [(ngModel)]="fechaInicio"
              (ngModelChange)="onCambioFechaManual()"
            />
          </div>
          <div class="input-date-group">
            <label for="fechaFin">Hasta:</label>
            <input
              id="fechaFin"
              type="date"
              class="form-control"
              [(ngModel)]="fechaFin"
              (ngModelChange)="onCambioFechaManual()"
            />
          </div>
          <button type="button" class="btn btn-primary btn-sm" (click)="refrescar()">
            <app-icon name="filter" [size]="14" />
            <span>Filtrar</span>
          </button>
        </div>
      </section>

      <!-- BARRA DE NAVEGACIÓN ENTRE PESTAÑAS (TABS) -->
      <nav class="reportes-tabs" role="tablist">
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'dashboard'"
          (click)="cambiarTab('dashboard')"
        >
          <app-icon name="layout-dashboard" [size]="18" />
          <span>Dashboard Ejecutivo</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'ventas'"
          (click)="cambiarTab('ventas')"
        >
          <app-icon name="shopping-cart" [size]="18" />
          <span>Ventas Detalladas</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'libro-iva'"
          (click)="cambiarTab('libro-iva')"
        >
          <app-icon name="file-spreadsheet" [size]="18" />
          <span>Libro Ventas IVA (SET)</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'cajas'"
          (click)="cambiarTab('cajas')"
        >
          <app-icon name="banknote" [size]="18" />
          <span>Auditoría de Cajas</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'rankings'"
          (click)="cambiarTab('rankings')"
        >
          <app-icon name="award" [size]="18" />
          <span>Ranking Productos & Sabores</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'reimpresiones'"
          (click)="cambiarTab('reimpresiones')"
        >
          <app-icon name="printer" [size]="18" />
          <span>Reimpresiones</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'talonarios'"
          (click)="cambiarTab('talonarios')"
        >
          <app-icon name="file-text" [size]="18" />
          <span>Talonarios & Timbrado SET</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="tabActiva() === 'inventario'"
          (click)="cambiarTab('inventario')"
        >
          <app-icon name="warehouse" [size]="18" />
          <span>Inventario & Kardex</span>
        </button>
      </nav>

      <!-- INDICADOR DE CARGA (SKELETON) -->
      @if (cargando()) {
        <div class="skeleton-container">
          <div class="skeleton-kpis">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
          <div class="skeleton-chart"></div>
        </div>
      } @else {
        <!-- ============================================================= -->
        <!-- PESTAÑA 1: DASHBOARD EJECUTIVO -->
        <!-- ============================================================= -->
        @if (tabActiva() === 'dashboard') {
          <div class="tab-content dashboard-tab">
            @if (dashboardData()) {
              <!-- TARJETAS KPIS SUPERIORES -->
              <div class="kpi-grid">
                <div class="kpi-card kpi-primary">
                  <div class="kpi-icon">
                    <app-icon name="trending-up" [size]="24" />
                  </div>
                  <div class="kpi-details">
                    <span class="kpi-label">Total Recaudado</span>
                    <strong class="kpi-val">{{ dashboardData()!.totalVentas | appCurrency }}</strong>
                    <span class="kpi-sub">{{ dashboardData()!.cantidadVentas }} ventas confirmadas</span>
                  </div>
                </div>

                <div class="kpi-card">
                  <div class="kpi-icon kpi-orders">
                    <app-icon name="clipboard-list" [size]="24" />
                  </div>
                  <div class="kpi-details">
                    <span class="kpi-label">Transacciones</span>
                    <strong class="kpi-val">{{ dashboardData()!.cantidadVentas }}</strong>
                    <span class="kpi-sub">Tickets y Facturas</span>
                  </div>
                </div>

                <div class="kpi-card">
                  <div class="kpi-icon kpi-ticket">
                    <app-icon name="shopping-cart" [size]="24" />
                  </div>
                  <div class="kpi-details">
                    <span class="kpi-label">Ticket Promedio</span>
                    <strong class="kpi-val">{{ dashboardData()!.ticketPromedio | appCurrency }}</strong>
                    <span class="kpi-sub">Por transacción</span>
                  </div>
                </div>

                <div class="kpi-card kpi-iva">
                  <div class="kpi-icon kpi-fiscal">
                    <app-icon name="file-spreadsheet" [size]="24" />
                  </div>
                  <div class="kpi-details">
                    <span class="kpi-label">Total Débito Fiscal IVA</span>
                    <strong class="kpi-val">{{ dashboardData()!.totalIva | appCurrency }}</strong>
                    <span class="kpi-sub">Liquidación 10% y 5%</span>
                  </div>
                </div>
              </div>

              <!-- GRÁFICOS: EVOLUCIÓN DIARIA Y MÉTODOS DE PAGO -->
              <div class="charts-grid">
                <!-- GRÁFICO DE ÁREA / LÍNEA DE VENTAS DIARIAS -->
                <div class="card chart-card">
                  <div class="card-header space-between">
                    <div>
                      <h3 class="card-title">Evolución de Ventas Diarias</h3>
                      <p class="card-subtitle">Monto total facturado por día en el período seleccionado</p>
                    </div>
                    <span class="badge badge-info">{{ dashboardData()!.ventasPorDia.length }} días</span>
                  </div>
                  <div class="card-body">
                    @if (dashboardData()!.ventasPorDia.length === 0) {
                      <div class="empty-state-chart">
                        <app-icon name="calendar" [size]="36" />
                        <p>No hay ventas registradas en las fechas seleccionadas.</p>
                      </div>
                    } @else {
                      <div class="svg-chart-wrapper">
                        <svg class="svg-chart" viewBox="0 0 650 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="ventasGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.4" />
                              <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0" />
                            </linearGradient>
                          </defs>

                          <!-- Líneas de cuadrícula horizontal -->
                          <line x1="40" y1="30" x2="630" y2="30" stroke="#f1f5f9" stroke-dasharray="3 3" />
                          <line x1="40" y1="90" x2="630" y2="90" stroke="#f1f5f9" stroke-dasharray="3 3" />
                          <line x1="40" y1="150" x2="630" y2="150" stroke="#f1f5f9" stroke-dasharray="3 3" />

                          <!-- Área con degradé -->
                          <path [attr.d]="svgAreaPath()" fill="url(#ventasGrad)" />

                          <!-- Línea de trazado -->
                          <path
                            [attr.d]="svgLinePath()"
                            fill="none"
                            stroke="#d97706"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />

                          <!-- Puntos interactivos con tooltip -->
                          @for (pt of chartPoints(); track pt.fecha) {
                            <g class="chart-point-group" (mouseenter)="puntoHover.set(pt)" (mouseleave)="puntoHover.set(null)">
                              <circle
                                [attr.cx]="pt.x"
                                [attr.cy]="pt.y"
                                r="5"
                                fill="#ffffff"
                                stroke="#d97706"
                                stroke-width="2.5"
                              />
                            </g>
                          }
                        </svg>

                        <!-- Tooltip flotante al hacer hover en punto -->
                        @if (puntoHover()) {
                          <div class="chart-tooltip" [style.left.px]="puntoHover()!.x" [style.top.px]="puntoHover()!.y - 45">
                            <strong>{{ puntoHover()!.fecha | date:'dd/MM/yyyy' }}</strong>
                            <span>{{ puntoHover()!.total | appCurrency }} ({{ puntoHover()!.cantidadPedidos }} pedidos)</span>
                          </div>
                        }

                        <!-- Eje X: Etiquetas de fechas -->
                        <div class="chart-x-labels">
                          @for (pt of chartPoints(); track pt.fecha) {
                            <span class="x-label">{{ pt.fecha | date:'dd/MM' }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- GRÁFICO DE DONA: MÉTODOS DE PAGO -->
                <div class="card chart-card">
                  <div class="card-header">
                    <div>
                      <h3 class="card-title">Distribución por Método de Pago</h3>
                      <p class="card-subtitle">Participación porcentual de cada canal de cobro</p>
                    </div>
                  </div>
                  <div class="card-body donut-layout">
                    <div class="donut-svg-wrapper">
                      <svg class="donut-svg" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f5f9" stroke-width="18" />
                        @for (seg of donutSegments(); track seg.label) {
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="none"
                            [attr.stroke]="seg.color"
                            stroke-width="18"
                            [attr.stroke-dasharray]="seg.dashArray"
                            [attr.stroke-dashoffset]="seg.dashOffset"
                            transform="rotate(-90 60 60)"
                          />
                        }
                      </svg>
                      <div class="donut-center-info">
                        <span class="donut-center-label">Total</span>
                        <strong class="donut-center-val">{{ dashboardData()!.totalVentas | appCurrency }}</strong>
                      </div>
                    </div>

                    <div class="donut-legend">
                      @for (seg of donutSegments(); track seg.label) {
                        <div class="legend-row">
                          <span class="legend-dot" [style.background-color]="seg.color"></span>
                          <span class="legend-label">{{ seg.label }}</span>
                          <span class="legend-pct">{{ seg.porcentaje | number:'1.1-1' }}%</span>
                          <strong class="legend-val">{{ seg.monto | appCurrency }}</strong>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <!-- FILA INFERIOR: COMPARATIVA FACTURAS VS TICKETS & MINI-RANKINGS -->
              <div class="dashboard-bottom-grid">
                <!-- COMPARATIVA COMPROBANTES -->
                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">Tipos de Comprobante Emitidos</h3>
                  </div>
                  <div class="card-body">
                    <div class="comparativa-row">
                      <div class="comp-item">
                        <div class="comp-icon comp-factura">
                          <app-icon name="file-text" [size]="20" />
                        </div>
                        <div class="comp-info">
                          <span class="comp-label">Facturas Legales (con RUC)</span>
                          <strong class="comp-val">{{ dashboardData()!.totalFacturas }}</strong>
                        </div>
                      </div>
                      <div class="comp-bar-wrapper">
                        <div class="comp-bar bg-blue" [style.width.%]="calcularPorcentaje(dashboardData()!.totalFacturas, dashboardData()!.cantidadVentas)"></div>
                      </div>
                    </div>

                    <div class="comparativa-row mt-3">
                      <div class="comp-item">
                        <div class="comp-icon comp-ticket">
                          <app-icon name="clipboard-list" [size]="20" />
                        </div>
                        <div class="comp-info">
                          <span class="comp-label">Tickets al Portador (Consumidor Final)</span>
                          <strong class="comp-val">{{ dashboardData()!.totalTickets }}</strong>
                        </div>
                      </div>
                      <div class="comp-bar-wrapper">
                        <div class="comp-bar bg-amber" [style.width.%]="calcularPorcentaje(dashboardData()!.totalTickets, dashboardData()!.cantidadVentas)"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TOP 5 PRODUCTOS -->
                <div class="card">
                  <div class="card-header space-between">
                    <h3 class="card-title">Top 5 Productos Más Vendidos</h3>
                    <app-icon name="award" [size]="18" />
                  </div>
                  <div class="card-body p-0">
                    <div class="mini-table">
                      @for (p of dashboardData()!.topProductos.slice(0, 5); track p.id; let idx = $index) {
                        <div class="mini-table-row">
                          <span class="rank-badge">{{ idx + 1 }}</span>
                          <div class="mini-item-info">
                            <strong>{{ p.nombre }}</strong>
                            <span class="mini-sub">{{ p.cantidad }} unidades • {{ p.totalRecaudado | appCurrency }}</span>
                          </div>
                          <div class="mini-pct-bar">
                            <div class="bar-fill" [style.width.%]="p.porcentajeTotal || 20"></div>
                          </div>
                        </div>
                      }
                      @if (dashboardData()!.topProductos.length === 0) {
                        <div class="p-3 text-muted text-center">Sin datos de productos.</div>
                      }
                    </div>
                  </div>
                </div>

                <!-- TOP 5 SABORES DE HELADO -->
                <div class="card">
                  <div class="card-header space-between">
                    <h3 class="card-title">Top 5 Sabores Preferidos</h3>
                    <app-icon name="ice-cream" [size]="18" />
                  </div>
                  <div class="card-body p-0">
                    <div class="mini-table">
                      @for (s of dashboardData()!.topSabores.slice(0, 5); track s.id; let idx = $index) {
                        <div class="mini-table-row">
                          <span class="rank-badge rank-flavor">{{ idx + 1 }}</span>
                          <div class="mini-item-info">
                            <strong>{{ s.nombre }}</strong>
                            <span class="mini-sub">{{ s.categoria }} • {{ s.cantidadElecciones }} elecciones ({{ s.kilosEstimados | number:'1.1-2' }} kg)</span>
                          </div>
                          <div class="mini-pct-bar">
                            <div class="bar-fill bg-flavor" [style.width.%]="s.porcentajeTotal || 20"></div>
                          </div>
                        </div>
                      }
                      @if (dashboardData()!.topSabores.length === 0) {
                        <div class="p-3 text-muted text-center">Sin datos de sabores.</div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ============================================================= -->
        <!-- PESTAÑA 2: VENTAS DETALLADAS -->
        <!-- ============================================================= -->
        @if (tabActiva() === 'ventas') {
          <div class="tab-content ventas-tab">
            <!-- BARRA DE FILTROS ESPECÍFICOS -->
            <div class="filtros-secundarios-card">
              <div class="filter-item">
                <label for="filtroMetodo">Medio de Pago:</label>
                <select id="filtroMetodo" class="form-control" [(ngModel)]="filtroMetodoPago" (ngModelChange)="cargarVentas()">
                  <option value="TODOS">Todos los medios</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                  <option value="TRANSFERENCIA_BANCARIA_QR">QR / Transferencia</option>
                </select>
              </div>

              <div class="filter-item">
                <label for="filtroComp">Comprobante:</label>
                <select id="filtroComp" class="form-control" [(ngModel)]="filtroTipoComprobante" (ngModelChange)="cargarVentas()">
                  <option value="TODOS">Todos los comprobantes</option>
                  <option value="TICKET">Ticket al portador</option>
                  <option value="FACTURA">Factura Legal</option>
                </select>
              </div>

              <div class="filter-item">
                <label for="filtroEntrega">Entrega:</label>
                <select id="filtroEntrega" class="form-control" [(ngModel)]="filtroTipoEntrega" (ngModelChange)="cargarVentas()">
                  <option value="TODOS">Todas las entregas</option>
                  <option value="SALON">Salón</option>
                  <option value="PARA_LLEVAR">Para Llevar</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>

              <div class="filter-item">
                <label for="filtroCajero">Cajero:</label>
                <input
                  id="filtroCajero"
                  type="text"
                  class="form-control"
                  placeholder="Ej. admin"
                  [(ngModel)]="filtroCajero"
                  (keyup.enter)="cargarVentas()"
                />
              </div>

              <button type="button" class="btn btn-secondary btn-sm" (click)="limpiarFiltrosVentas()">
                <span>Limpiar</span>
              </button>
            </div>

            <!-- RESUMEN EN BADGES Y EXPORTACIÓN -->
            @if (ventasData()) {
              <div class="resumen-strip">
                <div class="resumen-badges">
                  <div class="resumen-pill">
                    <span>Total Facturado:</span>
                    <strong>{{ ventasData()!.totalVentas | appCurrency }}</strong>
                  </div>
                  <div class="resumen-pill">
                    <span>Transacciones:</span>
                    <strong>{{ ventasData()!.cantidadVentas }}</strong>
                  </div>
                </div>
                <div class="export-actions">
                  <button type="button" class="btn btn-outline btn-sm" (click)="exportarVentasCsv()" title="Exportar listado a CSV para Excel">
                    <app-icon name="file-spreadsheet" [size]="14" />
                    <span>CSV</span>
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" (click)="exportarVentasPdf()" [disabled]="descargandoPdf()" title="Descargar documento oficial en PDF tamaño A4">
                    <app-icon name="file-text" [size]="14" />
                    <span>PDF A4</span>
                  </button>
                </div>
              </div>

              <!-- TABLA DE VENTAS -->
              <div class="card table-card">
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th># ID</th>
                        <th>Fecha y Hora</th>
                        <th>Tipo Comprobante</th>
                        <th>Voucher POS</th>
                        <th>Cliente / RUC</th>
                        <th>Medio de Pago</th>
                        <th>Entrega</th>
                        <th>Cajero</th>
                        <th class="text-right">Monto Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of ventasPaginadas(); track p.id) {
                        <tr>
                          <td><strong>#{{ p.id }}</strong></td>
                          <td>{{ p.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>
                          <td>
                            @if (p.tipoComprobante === 'FACTURA') {
                              <span class="badge badge-primary">Factura {{ p.numeroFactura || '' }}</span>
                            } @else {
                              <span class="badge badge-secondary">Ticket</span>
                            }
                          </td>
                          <td>
                            @if (p.numeroVoucher) {
                              <span class="voucher-pill">#{{ p.numeroVoucher }}</span>
                            } @else {
                              <span class="text-muted">—</span>
                            }
                          </td>
                          <td>
                            <div>{{ p.clienteNombre || 'Consumidor Final' }}</div>
                            @if (p.clienteRuc) {
                              <small class="text-muted">{{ p.clienteRuc }}</small>
                            }
                          </td>
                          <td><span class="badge-tag">{{ formatearMedioPago(p.metodoPago) }}</span></td>
                          <td><small>{{ p.tipoEntrega }}</small></td>
                          <td>{{ p.cajero || '—' }}</td>
                          <td class="text-right"><strong>{{ p.total | appCurrency }}</strong></td>
                          <td>
                            <span class="badge" [class.badge-success]="p.estado === 'ENTREGADO'" [class.badge-warning]="p.estado === 'PENDIENTE'">
                              {{ p.estado }}
                            </span>
                          </td>
                        </tr>
                      }
                      @if (ventasData()!.pedidos.length === 0) {
                        <tr>
                          <td colspan="10" class="text-center p-4 text-muted">
                            No se encontraron ventas con los filtros indicados.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- PAGINACIÓN -->
                @if (ventasData()!.pedidos.length > tamanoPaginaVentas) {
                  <div class="table-pagination">
                    <span>Mostrando página {{ paginaVentas() }} de {{ totalPaginasVentas() }}</span>
                    <div class="pag-buttons">
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        [disabled]="paginaVentas() <= 1"
                        (click)="paginaVentas.set(paginaVentas() - 1)"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        [disabled]="paginaVentas() >= totalPaginasVentas()"
                        (click)="paginaVentas.set(paginaVentas() + 1)"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ============================================================= -->
        <!-- PESTAÑA 3: LIBRO DE VENTAS IVA (SET / DNIT) -->
        <!-- ============================================================= -->
        @if (tabActiva() === 'libro-iva') {
          <div class="tab-content libro-iva-tab">
            @if (libroIvaData()) {
              <!-- RESUMEN FISCAL EN TARJETAS -->
              <div class="fiscal-kpi-grid">
                <div class="fiscal-card">
                  <span class="fiscal-label">Gravadas 10%</span>
                  <strong class="fiscal-val">{{ libroIvaData()!.totalGravada10 | appCurrency }}</strong>
                  <span class="fiscal-sub">Débito 10%: {{ libroIvaData()!.totalIva10 | appCurrency }}</span>
                </div>
                <div class="fiscal-card">
                  <span class="fiscal-label">Gravadas 5%</span>
                  <strong class="fiscal-val">{{ libroIvaData()!.totalGravada5 | appCurrency }}</strong>
                  <span class="fiscal-sub">Débito 5%: {{ libroIvaData()!.totalIva5 | appCurrency }}</span>
                </div>
                <div class="fiscal-card">
                  <span class="fiscal-label">Ventas Exentas</span>
                  <strong class="fiscal-val">{{ libroIvaData()!.totalExentas | appCurrency }}</strong>
                  <span class="fiscal-sub">Tasa 0%</span>
                </div>
                <div class="fiscal-card fiscal-card-highlight">
                  <span class="fiscal-label">Total Débito Fiscal IVA</span>
                  <strong class="fiscal-val">{{ libroIvaData()!.totalIva | appCurrency }}</strong>
                  <span class="fiscal-sub">{{ libroIvaData()!.cantidadComprobantes }} comprobantes emitidos</span>
                </div>
                <div class="fiscal-card fiscal-card-total">
                  <span class="fiscal-label">Gran Total Facturado</span>
                  <strong class="fiscal-val">{{ libroIvaData()!.granTotal | appCurrency }}</strong>
                  <span class="fiscal-sub">Monto Bruto Total</span>
                </div>
              </div>

              <!-- TABLA OFICIAL LIBRO DE VENTAS -->
              <div class="card table-card mt-4">
                <div class="card-header space-between">
                  <div>
                    <h3 class="card-title">Libro de Ventas Fiscal (SET / DNIT)</h3>
                    <p class="card-subtitle">Desglose legal de débitos fiscales y operaciones gravadas/exentas</p>
                  </div>
                  <div class="card-actions-group">
                    <button type="button" class="btn btn-outline btn-sm" (click)="descargarCsvLibroIva()" [disabled]="descargandoCsv()" title="Exportar Libro de Ventas a CSV Hechauka/Excel">
                      <app-icon name="file-spreadsheet" [size]="14" />
                      <span>Exportar CSV</span>
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" (click)="exportarLibroIvaPdf()" [disabled]="descargandoPdf()" title="Descargar Libro de Ventas IVA en documento PDF tamaño A4">
                      <app-icon name="file-text" [size]="14" />
                      <span>PDF A4</span>
                    </button>
                  </div>
                </div>
                <div class="table-responsive">
                  <table class="data-table fiscal-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>N° Comprobante</th>
                        <th>RUC / C.I.</th>
                        <th>Razón Social / Cliente</th>
                        <th class="text-right">Exentas</th>
                        <th class="text-right">Gravada 5%</th>
                        <th class="text-right">IVA 5%</th>
                        <th class="text-right">Gravada 10%</th>
                        <th class="text-right">IVA 10%</th>
                        <th class="text-right">Total IVA</th>
                        <th class="text-right">Total General</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of libroIvaData()!.items; track item.pedidoId; let idx = $index) {
                        <tr>
                          <td>{{ idx + 1 }}</td>
                          <td>{{ item.fecha | date:'dd/MM/yyyy' }}</td>
                          <td><span class="badge" [class.badge-primary]="item.tipoComprobante === 'FACTURA'">{{ item.tipoComprobante }}</span></td>
                          <td><strong>{{ item.numeroComprobante || ('#' + item.pedidoId) }}</strong></td>
                          <td>{{ item.clienteRuc || 'X' }}</td>
                          <td>{{ item.clienteNombre || 'Consumidor Final' }}</td>
                          <td class="text-right">{{ item.exentas | appCurrency }}</td>
                          <td class="text-right">{{ item.gravada5 | appCurrency }}</td>
                          <td class="text-right text-muted">{{ item.iva5 | appCurrency }}</td>
                          <td class="text-right">{{ item.gravada10 | appCurrency }}</td>
                          <td class="text-right text-muted">{{ item.iva10 | appCurrency }}</td>
                          <td class="text-right text-warning"><strong>{{ item.totalIva | appCurrency }}</strong></td>
                          <td class="text-right"><strong>{{ item.total | appCurrency }}</strong></td>
                        </tr>
                      }
                      @if (libroIvaData()!.items.length === 0) {
                        <tr>
                          <td colspan="13" class="text-center p-4 text-muted">
                            No hay comprobantes tributarios para el período consultado.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }

        <!-- ============================================================= -->
        <!-- PESTAÑA 4: AUDITORÍA DE CAJAS -->
        <!-- ============================================================= -->
        @if (tabActiva() === 'cajas') {
          <div class="tab-content cajas-tab">
            @if (cajasData()) {
              <!-- RESUMEN DE DESCUADRES Y AUDITORÍA -->
              <div class="cajas-summary-grid">
                <div class="kpi-card">
                  <div class="kpi-icon kpi-orders">
                    <app-icon name="banknote" [size]="24" />
                  </div>
                  <div class="kpi-details">
                    <span class="kpi-label">Sesiones Auditadas</span>
                    <strong class="kpi-val">{{ cajasData()!.totalSesiones }} turnos</strong>
                    <span class="kpi-sub">Total en rango</span>
                  </div>
                </div>

                <div class="kpi-card">
                  <div class="kpi-icon kpi-primary">
                    <app-icon name="trending-up" [size]="24" />
                  </div>
                  <div class="kpi-details">
                    <span class="kpi-label">Ventas Totales en Caja</span>
                    <strong class="kpi-val">{{ cajasData()!.totalVentasGeneral | appCurrency }}</strong>
                    <span class="kpi-sub">Flujo de dinero</span>
                  </div>
                </div>

                <!-- CARD DE ESTADO DE CUADRE -->
                <div class="kpi-card" [class.border-danger]="cajasData()!.totalFaltante > 0" [class.border-success]="cajasData()!.totalFaltante === 0 && cajasData()!.totalSobrante === 0">
                  <div class="kpi-icon" [class.kpi-alert]="cajasData()!.totalFaltante > 0">
                    <app-icon [name]="cajasData()!.totalFaltante > 0 ? 'alert-triangle' : 'check'" [size]="24" />
                  </div>
                  <div class="kpi-details">
                    <span class="kpi-label">Balance de Descuadres</span>
                    @if (cajasData()!.totalFaltante > 0) {
                      <strong class="kpi-val text-danger">Faltante: -{{ cajasData()!.totalFaltante | appCurrency }}</strong>
                      @if (cajasData()!.totalSobrante > 0) {
                        <span class="kpi-sub text-warning">Sobrante: +{{ cajasData()!.totalSobrante | appCurrency }}</span>
                      }
                    } @else if (cajasData()!.totalSobrante > 0) {
                      <strong class="kpi-val text-warning">Sobrante: +{{ cajasData()!.totalSobrante | appCurrency }}</strong>
                      <span class="kpi-sub">Sin faltantes</span>
                    } @else {
                      <strong class="kpi-val text-success">Cajas Cuadradas</strong>
                      <span class="kpi-sub">Diferencia exacta 0</span>
                    }
                  </div>
                </div>
              </div>

              <!-- TABLA DE TURNOS Y ARQUEOS -->
              <div class="card table-card mt-4">
                <div class="card-header space-between">
                  <div>
                    <h3 class="card-title">Historial de Turnos y Cierres de Caja</h3>
                    <p class="card-subtitle">Comparativa entre efectivo esperado por ventas y efectivo real contado</p>
                  </div>
                  <div class="card-actions-group">
                    <button type="button" class="btn btn-outline btn-sm" (click)="exportarCajasCsv()" title="Exportar auditoría a CSV / Excel">
                      <app-icon name="file-spreadsheet" [size]="14" />
                      <span>Exportar CSV</span>
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" (click)="exportarCajasPdf()" [disabled]="descargandoPdf()" title="Descargar auditoría de cajas en PDF tamaño A4">
                      <app-icon name="file-text" [size]="14" />
                      <span>PDF A4</span>
                    </button>
                  </div>
                </div>
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th># Turno</th>
                        <th>Cajero Apertura</th>
                        <th>Cierre</th>
                        <th>Apertura</th>
                        <th>Cierre</th>
                        <th>Estado</th>
                        <th class="text-right">Fondo Inicial</th>
                        <th class="text-right">Efectivo Esperado</th>
                        <th class="text-right">Efectivo Real</th>
                        <th class="text-right">Diferencia</th>
                        <th class="text-right">Ventas Totales</th>
                        <th class="text-center">Pedidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of cajasData()!.sesiones; track s.id) {
                        <tr>
                          <td><strong>#{{ s.id }}</strong></td>
                          <td>{{ s.cajeroApertura }}</td>
                          <td>{{ s.usuarioCierre || '—' }}</td>
                          <td>{{ s.fechaApertura | date:'dd/MM/yyyy HH:mm' }}</td>
                          <td>{{ s.fechaCierre ? (s.fechaCierre | date:'dd/MM/yyyy HH:mm') : 'En curso' }}</td>
                          <td>
                            <span class="badge" [class.badge-success]="s.estado === 'ABIERTA'" [class.badge-secondary]="s.estado === 'CERRADA'">
                              {{ s.estado }}
                            </span>
                          </td>
                          <td class="text-right">{{ s.montoInicial | appCurrency }}</td>
                          <td class="text-right">{{ s.montoEsperadoEfectivo | appCurrency }}</td>
                          <td class="text-right">
                            @if (s.montoRealEfectivo !== null && s.montoRealEfectivo !== undefined) {
                              {{ s.montoRealEfectivo | appCurrency }}
                            } @else {
                              <span class="text-muted">—</span>
                            }
                          </td>
                          <td class="text-right">
                            @if (s.diferencia > 0) {
                              <strong class="text-success">+{{ s.diferencia | appCurrency }} (Sobrante)</strong>
                            } @else if (s.diferencia < 0) {
                              <strong class="text-danger">{{ s.diferencia | appCurrency }} (Faltante)</strong>
                            } @else if (s.diferencia === 0 && s.estado === 'CERRADA') {
                              <span class="text-muted">Exacto</span>
                            } @else {
                              <span class="text-muted">—</span>
                            }
                          </td>
                          <td class="text-right"><strong>{{ s.totalVentasGeneral | appCurrency }}</strong></td>
                          <td class="text-center">{{ s.cantidadPedidos }}</td>
                        </tr>
                      }
                      @if (cajasData()!.sesiones.length === 0) {
                        <tr>
                          <td colspan="12" class="text-center p-4 text-muted">
                            No se encontraron sesiones de caja en el período consultado.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }

        <!-- ============================================================= -->
        <!-- PESTAÑA 5: RANKINGS DE PRODUCTOS Y SABORES -->
        <!-- ============================================================= -->
        @if (tabActiva() === 'rankings') {
          <div class="tab-content rankings-tab">
            @if (rankingsData()) {
              <div class="rankings-grid">
                <!-- 1. PRESENTACIONES / POTES DE HELADO -->
                <div class="card">
                  <div class="card-header space-between">
                    <div>
                      <h3 class="card-title">Potes y Presentaciones de Helado</h3>
                      <p class="card-subtitle">Demanda de envases y cucuruchos</p>
                    </div>
                    <app-icon name="cup-soda" [size]="20" />
                  </div>
                  <div class="card-body p-0">
                    <div class="ranking-list">
                      @for (p of rankingsData()!.topPresentaciones; track p.id; let idx = $index) {
                        <div class="ranking-row">
                          <span class="rank-pos">{{ idx + 1 }}</span>
                          <div class="rank-main">
                            <div class="rank-name-row">
                              <strong>{{ p.nombre }}</strong>
                              <span class="rank-total">{{ p.totalRecaudado | appCurrency }}</span>
                            </div>
                            <div class="rank-bar-bg">
                              <div class="rank-bar-fill bg-amber" [style.width.%]="calcularPctRanking(p.cantidad, maxCantidadPresentaciones())"></div>
                            </div>
                            <div class="rank-meta">
                              <span>{{ p.cantidad }} unidades vendidas</span>
                              <span>{{ calcularPctRanking(p.cantidad, maxCantidadPresentaciones()) | number:'1.0-0' }}% de cuota</span>
                            </div>
                          </div>
                        </div>
                      }
                      @if (rankingsData()!.topPresentaciones.length === 0) {
                        <div class="p-3 text-muted text-center">Sin ventas de presentaciones.</div>
                      }
                    </div>
                  </div>
                </div>

                <!-- 2. PRODUCTOS SIMPLES (BEBIDAS, GOLOSINAS, CAFÉ) -->
                <div class="card">
                  <div class="card-header space-between">
                    <div>
                      <h3 class="card-title">Bebidas y Cafetería (Productos Simples)</h3>
                      <p class="card-subtitle">Artículos envasados e individuales</p>
                    </div>
                    <app-icon name="coffee" [size]="20" />
                  </div>
                  <div class="card-body p-0">
                    <div class="ranking-list">
                      @for (ps of rankingsData()!.topProductosSimples; track ps.id; let idx = $index) {
                        <div class="ranking-row">
                          <span class="rank-pos">{{ idx + 1 }}</span>
                          <div class="rank-main">
                            <div class="rank-name-row">
                              <strong>{{ ps.nombre }}</strong>
                              <span class="rank-total">{{ ps.totalRecaudado | appCurrency }}</span>
                            </div>
                            <div class="rank-bar-bg">
                              <div class="rank-bar-fill bg-blue" [style.width.%]="calcularPctRanking(ps.cantidad, maxCantidadSimples())"></div>
                            </div>
                            <div class="rank-meta">
                              <span>{{ ps.cantidad }} unidades vendidas</span>
                              <span>{{ calcularPctRanking(ps.cantidad, maxCantidadSimples()) | number:'1.0-0' }}% de cuota</span>
                            </div>
                          </div>
                        </div>
                      }
                      @if (rankingsData()!.topProductosSimples.length === 0) {
                        <div class="p-3 text-muted text-center">Sin ventas de productos simples.</div>
                      }
                    </div>
                  </div>
                </div>

                <!-- 3. SABORES DE HELADO -->
                <div class="card">
                  <div class="card-header space-between">
                    <div>
                      <h3 class="card-title">Sabores de Helado Más Populares</h3>
                      <p class="card-subtitle">Preferencia de sabores por elecciones y kilos despachados</p>
                    </div>
                    <app-icon name="ice-cream" [size]="20" />
                  </div>
                  <div class="card-body p-0">
                    <div class="ranking-list">
                      @for (s of rankingsData()!.topSabores; track s.id; let idx = $index) {
                        <div class="ranking-row">
                          <span class="rank-pos rank-pos-flavor">{{ idx + 1 }}</span>
                          <div class="rank-main">
                            <div class="rank-name-row">
                              <strong>{{ s.nombre }}</strong>
                              <span class="badge badge-secondary">{{ s.categoria }}</span>
                            </div>
                            <div class="rank-bar-bg">
                              <div class="rank-bar-fill bg-pink" [style.width.%]="calcularPctRanking(s.cantidadElecciones, maxEleccionesSabores())"></div>
                            </div>
                            <div class="rank-meta">
                              <span>{{ s.cantidadElecciones }} elecciones</span>
                              <span>~{{ s.kilosEstimados | number:'1.1-2' }} kg estimados</span>
                            </div>
                          </div>
                        </div>
                      }
                      @if (rankingsData()!.topSabores.length === 0) {
                        <div class="p-3 text-muted text-center">Sin datos de sabores elegidos.</div>
                      }
                    </div>
                  </div>
                </div>

                <!-- 4. TOPPINGS Y AGREGADOS -->
                <div class="card">
                  <div class="card-header space-between">
                    <div>
                      <h3 class="card-title">Toppings y Agregados Más Pedidos</h3>
                      <p class="card-subtitle">Salsas, baños y extras adicionales</p>
                    </div>
                    <app-icon name="sparkles" [size]="20" />
                  </div>
                  <div class="card-body p-0">
                    <div class="ranking-list">
                      @for (t of rankingsData()!.topToppings; track t.id; let idx = $index) {
                        <div class="ranking-row">
                          <span class="rank-pos">{{ idx + 1 }}</span>
                          <div class="rank-main">
                            <div class="rank-name-row">
                              <strong>{{ t.nombre }}</strong>
                              <span class="rank-total">{{ t.totalRecaudado | appCurrency }}</span>
                            </div>
                            <div class="rank-bar-bg">
                              <div class="rank-bar-fill bg-green" [style.width.%]="calcularPctRanking(t.cantidad, maxCantidadToppings())"></div>
                            </div>
                            <div class="rank-meta">
                              <span>{{ t.cantidad }} extras servidos</span>
                              <span>{{ calcularPctRanking(t.cantidad, maxCantidadToppings()) | number:'1.0-0' }}% de cuota</span>
                            </div>
                          </div>
                        </div>
                      }
                      @if (rankingsData()!.topToppings.length === 0) {
                        <div class="p-3 text-muted text-center">Sin registros de toppings vendidos.</div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ============================================================= -->
        <!-- PESTAÑA 6: REIMPRESIONES (TRX ID & TICKETS) -->
        <!-- ============================================================= -->
        @if (tabActiva() === 'reimpresiones') {
          <div class="tab-content reimpresiones-content">
            <!-- TARJETA SUPERIOR: HERO Y CONFIGURACIÓN DE IMPRESIÓN -->
            <div class="card p-4">
              <div class="reimpresion-hero">
                <div class="hero-text">
                  <div class="hero-badge">
                    <app-icon name="printer" [size]="14" />
                    <span>Auditoría & Re-emisión Térmica</span>
                  </div>
                  <h2 class="hero-title">Centro de Reimpresión de Comprobantes</h2>
                  <p class="hero-desc">
                    Busca por <strong>Trx ID</strong>, número de ticket o cliente para reenviar el ticket térmico ESC/POS a la ticketera seleccionada o previsualizar e imprimir en formato PDF.
                  </p>
                </div>

                <!-- CONTROLES DE IMPRESORA Y BÚSQUEDA -->
                <div class="reimpresion-controls">
                  <div class="control-printer">
                    <label for="selectPrinterReimp" class="control-label">
                      <app-icon name="printer" [size]="14" />
                      <span>Ticketera Destino:</span>
                    </label>
                    <select
                      id="selectPrinterReimp"
                      class="form-control"
                      [(ngModel)]="impresoraSeleccionadaId"
                    >
                      <option [ngValue]="null">Ticketera por defecto del sistema</option>
                      @for (imp of impresorasService.impresoras(); track imp.id) {
                        <option [ngValue]="imp.id">
                          🖨️ {{ imp.nombre }} ({{ imp.tipoConexion }})
                        </option>
                      }
                    </select>
                  </div>

                  <div class="search-input-box">
                    <div class="search-input-wrapper">
                      <app-icon name="search" [size]="18" class="search-icon" />
                      <input
                        type="text"
                        class="form-control input-lg"
                        placeholder="Buscar por Trx ID (ej: TRX-000101), N° de Ticket o Cliente..."
                        [(ngModel)]="busquedaReimpresion"
                      />
                      @if (busquedaReimpresion) {
                        <button type="button" class="btn-clear" (click)="busquedaReimpresion = ''">
                          <app-icon name="x" [size]="14" />
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TABLA DE TICKETS DISPONIBLES PARA REIMPRESIÓN -->
            <div class="card">
              <div class="card-header space-between">
                <div>
                  <h3 class="card-title">Comprobantes Listos para Reimpresión</h3>
                  <p class="card-subtitle">
                    {{ ticketsReimpresion().length }} comprobante(s) disponible(s) en el rango seleccionado
                    @if (busquedaReimpresion) {
                      • Coincidencias con <em>"{{ busquedaReimpresion }}"</em>
                    }
                  </p>
                </div>
                <button type="button" class="btn btn-outline btn-sm" (click)="cargarVentas()">
                  <app-icon name="refresh" [size]="14" />
                  <span>Actualizar Lista</span>
                </button>
              </div>

              <div class="table-container">
                <table class="reportes-table">
                  <thead>
                    <tr>
                      <th>Trx ID</th>
                      <th>N° Ticket / Factura</th>
                      <th>Fecha / Hora</th>
                      <th>Cajero</th>
                      <th>Cliente</th>
                      <th>Medio de Pago</th>
                      <th class="text-right">Total</th>
                      <th class="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of ticketsReimpresion(); track p.id) {
                      <tr>
                        <!-- TRX ID -->
                        <td>
                          <div class="trx-pill-wrapper">
                            <span class="trx-pill">{{ p.trxId || ('TRX-' + p.id.toString().padStart(6, '0')) }}</span>
                            <button
                              type="button"
                              class="btn-copy"
                              [title]="copiadoTrxId() === (p.trxId || ('TRX-' + p.id.toString().padStart(6, '0'))) ? '¡Copiado!' : 'Copiar Trx ID'"
                              (click)="copiarTrx(p.trxId || ('TRX-' + p.id.toString().padStart(6, '0')))"
                            >
                              @if (copiadoTrxId() === (p.trxId || ('TRX-' + p.id.toString().padStart(6, '0')))) {
                                <app-icon name="check" [size]="13" class="text-success" />
                              } @else {
                                <app-icon name="copy" [size]="13" />
                              }
                            </button>
                          </div>
                        </td>

                        <!-- TICKET / FACTURA -->
                        <td>
                          <div class="ticket-cell">
                            <strong>{{ p.tipoComprobante === 'FACTURA' ? (p.numeroFactura || ('Fac #' + p.id)) : ('Ticket #' + p.id) }}</strong>
                            <span class="badge" [class.badge-blue]="p.tipoComprobante === 'FACTURA'" [class.badge-gray]="p.tipoComprobante !== 'FACTURA'">
                              {{ p.tipoComprobante }}
                            </span>
                          </div>
                        </td>

                        <!-- FECHA -->
                        <td class="text-nowrap">{{ p.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>

                        <!-- CAJERO -->
                        <td>{{ p.cajero || 'Cajero' }}</td>

                        <!-- CLIENTE -->
                        <td>
                          <div>{{ p.clienteNombre || 'Consumidor Final' }}</div>
                          @if (p.clienteRuc) {
                            <div class="text-muted text-xs">RUC: {{ p.clienteRuc }}</div>
                          }
                        </td>

                        <!-- MEDIO DE PAGO & VOUCHER -->
                        <td>
                          <div class="pago-cell">
                            <span class="badge badge-subtle">{{ formatearMedioPago(p.metodoPago) }}</span>
                            @if (p.numeroVoucher) {
                              <span class="badge-voucher" title="Voucher POS">
                                <app-icon name="credit-card" [size]="11" />
                                <span>#{{ p.numeroVoucher }}</span>
                              </span>
                            }
                          </div>
                        </td>

                        <!-- TOTAL -->
                        <td class="text-right">
                          <strong class="text-success">{{ p.total | appCurrency }}</strong>
                        </td>

                        <!-- ACCIONES -->
                        <td class="text-center">
                          <div class="acciones-reimpresion">
                            <button
                              type="button"
                              class="btn btn-primary btn-sm btn-reimprimir"
                              (click)="reimprimirEnTicketera(p)"
                              [disabled]="reimprimiendoId() === p.id"
                              title="Reimprimir directamente en la ticketera térmica seleccionada"
                            >
                              <app-icon name="printer" [size]="14" [class.spinning]="reimprimiendoId() === p.id" />
                              <span>{{ reimprimiendoId() === p.id ? 'Imprimiendo...' : 'Reimprimir' }}</span>
                            </button>

                            <button
                              type="button"
                              class="btn btn-secondary btn-sm"
                              (click)="verComprobanteModal(p)"
                              [disabled]="cargandoDetallePedido()"
                              title="Ver comprobante en pantalla o generar PDF"
                            >
                              <app-icon name="file-text" [size]="14" />
                              <span>Ver / PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }

                    @if (ticketsReimpresion().length === 0) {
                      <tr>
                        <td colspan="8" class="text-center p-4 text-muted">
                          <div class="empty-reimpresion">
                            <app-icon name="search" [size]="32" class="text-muted" />
                            <p class="mt-2 mb-1"><strong>No se encontraron comprobantes para reimprimir</strong></p>
                            <p class="text-xs">
                              Prueba ampliando el rango de fechas en la barra superior o verificando el Trx ID ingresado.
                            </p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
        <!-- ============================================================= -->
        <!-- PESTAÑA 7: TALONARIOS Y TIMBRADO FISCAL SET / DNIT -->
        <!-- ============================================================= -->
        @if (tabActiva() === 'talonarios') {
          <div class="tab-content talonarios-content">
            <!-- BANNER DE DIAGNÓSTICO Y ACCIÓN -->
            <div class="card p-4">
              <div class="talonario-hero">
                <div class="talonario-header-info">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    @if (estadoTalonario() === 'VIGENTE') {
                      <span class="badge-status badge-success">
                        <app-icon name="check" [size]="14" />
                        <span>Timbrado Vigente & Talonario Activo</span>
                      </span>
                    } @else if (estadoTalonario() === 'POR_VENCER') {
                      <span class="badge-status badge-warning">
                        <app-icon name="alert-triangle" [size]="14" />
                        <span>Próximo a Vencer ({{ diasRestantesTimbrado() }} días restantes)</span>
                      </span>
                    } @else if (estadoTalonario() === 'POR_AGOTARSE') {
                      <span class="badge-status badge-warning">
                        <app-icon name="alert-triangle" [size]="14" />
                        <span>Talonario al Límite ({{ facturasRestantes() }} facturas restantes)</span>
                      </span>
                    } @else if (estadoTalonario() === 'VENCIDO') {
                      <span class="badge-status badge-danger">
                        <app-icon name="x" [size]="14" />
                        <span>Timbrado Vencido (Expiró el {{ fiscalTimbradoVencimiento | date:'dd/MM/yyyy' }})</span>
                      </span>
                    } @else if (estadoTalonario() === 'AGOTADO') {
                      <span class="badge-status badge-danger">
                        <app-icon name="x" [size]="14" />
                        <span>Talonario Agotado (Límite {{ fiscalNumeroFin }} alcanzado)</span>
                      </span>
                    }
                  </div>

                  <h2 class="hero-title mt-2">Control de Timbrado y Talonarios de Facturación Legal</h2>
                  <p class="hero-desc">
                    Parámetros tributarios de facturación preimpresa y autoimpresor según normativas SET / DNIT (Ley 6380). Controla los números correlativos, rangos habilitados y renueva talonarios al alcanzar el límite.
                  </p>
                </div>

                <div class="talonario-hero-actions">
                  <button type="button" class="btn btn-primary" (click)="abrirModalNuevoTalonario()">
                    <app-icon name="plus" [size]="16" />
                    <span>Habilitar Nuevo Talonario / Renovar Timbrado</span>
                  </button>
                </div>
              </div>

              <!-- 4 TARJETAS KPI FISCALES -->
              <div class="kpi-grid mt-4">
                <!-- 1. TIMBRADO -->
                <div class="kpi-card">
                  <div class="kpi-header">
                    <span class="kpi-title">Timbrado Oficial SET</span>
                    <app-icon name="file-text" [size]="20" class="text-primary" />
                  </div>
                  <div class="kpi-value font-mono">{{ fiscalTimbrado || 'Sin Timbrado' }}</div>
                  <div class="kpi-footer">
                    @if (fiscalTimbradoVencimiento) {
                      <span>Vence: <strong>{{ fiscalTimbradoVencimiento | date:'dd/MM/yyyy' }}</strong></span>
                      <span [class.text-danger]="diasRestantesTimbrado() <= 15" [class.text-warning]="diasRestantesTimbrado() <= 30 && diasRestantesTimbrado() > 15">
                        ({{ diasRestantesTimbrado() }} días)
                      </span>
                    } @else {
                      <span class="text-muted">Sin fecha configurada</span>
                    }
                  </div>
                </div>

                <!-- 2. PUNTO EXPEDICIÓN -->
                <div class="kpi-card">
                  <div class="kpi-header">
                    <span class="kpi-title">Punto de Expedición</span>
                    <app-icon name="building" [size]="20" class="text-blue" />
                  </div>
                  <div class="kpi-value font-mono">{{ fiscalEstablecimiento || '001' }}-{{ fiscalPuntoEmision || '001' }}</div>
                  <div class="kpi-footer">
                    <span>RUC: <strong>{{ fiscalRuc || 'No registrado' }}</strong></span>
                  </div>
                </div>

                <!-- 3. RANGO AUTORIZADO -->
                <div class="kpi-card">
                  <div class="kpi-header">
                    <span class="kpi-title">Rango Autorizado</span>
                    <app-icon name="clipboard-list" [size]="20" class="text-purple" />
                  </div>
                  <div class="kpi-value font-mono">
                    {{ (fiscalNumeroInicio || 1).toString().padStart(7, '0') }} al {{ (fiscalNumeroFin || 1000).toString().padStart(7, '0') }}
                  </div>
                  <div class="kpi-footer">
                    <span>Total folios: <strong>{{ ((fiscalNumeroFin || 1000) - (fiscalNumeroInicio || 1) + 1) | number }}</strong></span>
                  </div>
                </div>

                <!-- 4. PRÓXIMA FACTURA Y USO -->
                <div class="kpi-card">
                  <div class="kpi-header">
                    <span class="kpi-title">Próxima Factura a Emitir</span>
                    <app-icon name="printer" [size]="20" class="text-green" />
                  </div>
                  <div class="kpi-value font-mono text-success">{{ proximaFacturaPreview() }}</div>
                  <div class="kpi-footer">
                    <span>Quedan: <strong>{{ facturasRestantes() | number }}</strong> facturas</span>
                    <span class="text-muted">({{ porcentajeTalonarioUsado() }}% emitido)</span>
                  </div>
                  <div class="talonario-progress-bar mt-2">
                    <div
                      class="progress-fill"
                      [style.width.%]="porcentajeTalonarioUsado()"
                      [class.bg-green]="porcentajeTalonarioUsado() < 75"
                      [class.bg-yellow]="porcentajeTalonarioUsado() >= 75 && porcentajeTalonarioUsado() < 90"
                      [class.bg-red]="porcentajeTalonarioUsado() >= 90"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- PANEL DE CONFIGURACIÓN Y MODIFICACIÓN DEL TALONARIO -->
            <div class="card p-4">
              <div class="card-header space-between border-0 p-0 mb-4">
                <div>
                  <h3 class="card-title">Ajuste y Sincronización del Talonario Actual</h3>
                  <p class="card-subtitle">
                    Modifica los datos del timbrado vigente, actualiza la fecha de vencimiento o sincroniza el número correlativo si has emitido comprobantes manuales.
                  </p>
                </div>
              </div>

              <div class="fiscal-form-layout">
                <!-- FORMULARIO DE EDICIÓN -->
                <div class="fiscal-form-fields">
                  <div class="form-grid-3">
                    <div class="form-group">
                      <label class="form-label" for="fiscRuc">R.U.C. del Emisor *</label>
                      <input
                        id="fiscRuc"
                        type="text"
                        class="form-control"
                        placeholder="Ej. 80099887-1"
                        [(ngModel)]="fiscalRuc"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="fiscTimbrado">N° de Timbrado Vigente *</label>
                      <input
                        id="fiscTimbrado"
                        type="text"
                        class="form-control font-mono"
                        placeholder="Ej. 17894561"
                        [(ngModel)]="fiscalTimbrado"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="fiscInicio">Inicio de Vigencia</label>
                      <input
                        id="fiscInicio"
                        type="date"
                        class="form-control"
                        [(ngModel)]="fiscalTimbradoInicio"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="fiscVencimiento">Vencimiento del Timbrado *</label>
                      <input
                        id="fiscVencimiento"
                        type="date"
                        class="form-control"
                        [(ngModel)]="fiscalTimbradoVencimiento"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="fiscEstab">Establecimiento (3 dígitos) *</label>
                      <input
                        id="fiscEstab"
                        type="text"
                        class="form-control font-mono"
                        placeholder="001"
                        maxlength="3"
                        [(ngModel)]="fiscalEstablecimiento"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="fiscPunto">Punto de Emisión (3 dígitos) *</label>
                      <input
                        id="fiscPunto"
                        type="text"
                        class="form-control font-mono"
                        placeholder="001"
                        maxlength="3"
                        [(ngModel)]="fiscalPuntoEmision"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="fiscNumInicio">Talonario - Desde *</label>
                      <input
                        id="fiscNumInicio"
                        type="number"
                        min="1"
                        class="form-control font-mono"
                        placeholder="1"
                        [(ngModel)]="fiscalNumeroInicio"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="fiscNumFin">Talonario - Hasta (Límite) *</label>
                      <input
                        id="fiscNumFin"
                        type="number"
                        min="1"
                        class="form-control font-mono"
                        placeholder="1000"
                        [(ngModel)]="fiscalNumeroFin"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label text-warning" for="fiscUltimoNum">
                        Último N° Factura Emitido ⚠️
                      </label>
                      <input
                        id="fiscUltimoNum"
                        type="number"
                        min="0"
                        class="form-control font-mono"
                        [(ngModel)]="fiscalUltimoNumero"
                      />
                      <small class="field-hint text-warning">
                        Modificar solo para sincronizar talonarios físicos o manuales.
                      </small>
                    </div>
                  </div>

                  <div class="form-actions-fiscal mt-4">
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="guardarDatosFiscales()"
                      [disabled]="guardandoFiscal()"
                    >
                      <app-icon name="check" [size]="16" />
                      <span>{{ guardandoFiscal() ? 'Guardando...' : 'Guardar Configuración Fiscal' }}</span>
                    </button>
                  </div>
                </div>

                <!-- TICKET PREVIEW LATERAL -->
                <div class="fiscal-ticket-preview">
                  <div class="preview-title">
                    <app-icon name="printer" [size]="16" />
                    <span>Vista Previa Membrete Fiscal</span>
                  </div>
                  <div class="mini-ticket-paper">
                    <div class="text-center font-bold">{{ institucionService.institucion().nombre || 'Heladería Artesanal' }}</div>
                    <div class="text-center text-xs">RUC: {{ fiscalRuc || '80099887-1' }}</div>
                    <div class="text-center text-xs border-dashed-t border-dashed-b my-1 py-1">
                      <div>TIMBRADO N°: {{ fiscalTimbrado || '17894561' }}</div>
                      <div>Válido hasta: {{ fiscalTimbradoVencimiento || '2026-12-31' }}</div>
                      <div class="font-bold">IVA INCLUIDO</div>
                    </div>
                    <div class="text-center font-bold text-sm text-primary">
                      FACTURA N°: {{ proximaFacturaPreview() }}
                    </div>
                    <div class="text-center text-xxs text-muted mt-1">
                      (Próximo comprobante que emitirá el POS)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ==================== PESTAÑA: INVENTARIO & KARDEX ==================== -->
        @if (tabActiva() === 'inventario') {
          <div class="tab-content inventario-content">
            <!-- SUBTABS KARDEX VS VALORIZACION -->
            <div class="subtabs-bar">
              <button
                type="button"
                class="subtab-btn"
                [class.active]="subtabInventario() === 'kardex'"
                (click)="cambiarSubtabInventario('kardex')"
              >
                <app-icon name="clipboard-list" [size]="16" />
                <span>Kardex Analítico de Movimientos</span>
              </button>
              <button
                type="button"
                class="subtab-btn"
                [class.active]="subtabInventario() === 'valorizacion'"
                (click)="cambiarSubtabInventario('valorizacion')"
              >
                <app-icon name="warehouse" [size]="16" />
                <span>Inventario Físico Valorado (Gs.)</span>
              </button>
              <button
                type="button"
                class="subtab-btn"
                [class.active]="subtabInventario() === 'auditorias'"
                (click)="cambiarSubtabInventario('auditorias')"
              >
                <app-icon name="clipboard-check" [size]="16" />
                <span>Auditorías Físicas & Comparativos</span>
              </button>
            </div>

            <!-- 4 TARJETAS KPI DE INVENTARIO -->
            <div class="kpi-grid">
              <div class="kpi-card card-kpi-1">
                <div class="kpi-header">
                  <span class="kpi-title">Valorización de Stock Físico</span>
                  <app-icon name="warehouse" [size]="20" class="text-blue" />
                </div>
                <div class="kpi-value font-mono">
                  {{ (inventarioService.valorizacion()?.totalValorizadoGeneral || 0) | appCurrency }}
                </div>
                <div class="kpi-footer">
                  <span>{{ inventarioService.valorizacion()?.totalArticulos || 0 }} artículos en existencia</span>
                </div>
              </div>

              <div class="kpi-card card-kpi-2">
                <div class="kpi-header">
                  <span class="kpi-title">Movimientos en Período</span>
                  <app-icon name="clipboard-list" [size]="20" class="text-purple" />
                </div>
                <div class="kpi-value font-mono">
                  {{ inventarioService.kpis()?.totalMovimientos || inventarioService.kardex().length }}
                </div>
                <div class="kpi-footer">
                  <span>Entradas, salidas y ajustes</span>
                </div>
              </div>

              <div class="kpi-card card-kpi-3">
                <div class="kpi-header">
                  <span class="kpi-title">Entradas Registradas</span>
                  <app-icon name="plus" [size]="20" class="text-green" />
                </div>
                <div class="kpi-value font-mono text-success">
                  {{ inventarioService.kpis()?.totalEntradas || 0 }} operaciones
                </div>
                <div class="kpi-footer">
                  <span>Compras y producción</span>
                </div>
              </div>

              <div class="kpi-card card-kpi-4">
                <div class="kpi-header">
                  <span class="kpi-title">Mermas / Desechos</span>
                  <app-icon name="alert-triangle" [size]="20" class="text-danger" />
                </div>
                <div class="kpi-value font-mono text-danger">
                  {{ inventarioService.kpis()?.totalMermas || 0 }} registros
                </div>
                <div class="kpi-footer">
                  <span>Pérdidas y roturas reportadas</span>
                </div>
              </div>
            </div>

            <!-- SUBVISTA 1: KARDEX -->
            @if (subtabInventario() === 'kardex') {
              <div class="card p-4 mt-4">
                <div class="section-header space-between flex-wrap gap-2 mb-3">
                  <div>
                    <h3 class="section-title">Historial Completo de Movimientos (Kardex)</h3>
                    <p class="section-desc">Auditoría cronológica de ingresos por compra, producción artesanal, salidas POS y mermas.</p>
                  </div>
                  <div class="d-flex gap-2 flex-wrap align-center">
                    <select class="form-control form-control-sm" [(ngModel)]="filtroKardexTipo" (ngModelChange)="aplicarFiltrosKardex()">
                      <option value="TODOS">Todos los ítems</option>
                      <option value="SABOR">Sabores en Bacha</option>
                      <option value="ENVASE">Envases</option>
                      <option value="PRODUCTO">Productos Simples</option>
                    </select>

                    <select class="form-control form-control-sm" [(ngModel)]="filtroKardexMovimiento" (ngModelChange)="aplicarFiltrosKardex()">
                      <option value="TODOS">Todos los movimientos</option>
                      <option value="ENTRADA_COMPRA">Entrada Compra</option>
                      <option value="ENTRADA_PRODUCCION">Entrada Producción</option>
                      <option value="SALIDA_VENTA">Salida Venta POS</option>
                      <option value="SALIDA_MERMA">Baja Merma</option>
                      <option value="AJUSTE_INVENTARIO">Ajuste Físico</option>
                      <option value="REINTEGRO_CANCELACION">Reintegro Cancelación</option>
                    </select>
                  </div>
                </div>

                @if (inventarioService.cargandoKardex()) {
                  <div class="loading-state">
                    <app-icon name="refresh" [size]="20" class="spinning" />
                    <span>Cargando Kardex...</span>
                  </div>
                } @else if (inventarioService.kardex().length === 0) {
                  <div class="empty-state">
                    <app-icon name="clipboard-list" [size]="40" class="text-muted" />
                    <h4>Sin movimientos para los filtros seleccionados</h4>
                    <p class="text-muted">No se encontraron registros de inventario en este rango de fechas.</p>
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
                          <th class="text-center">Stock Físico (Antes &rarr; Después)</th>
                          <th>Motivo / Referencia</th>
                          <th class="text-right">Costo Unit.</th>
                          <th class="text-right">Total (Gs.)</th>
                          <th>Usuario</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (mov of inventarioService.kardex(); track mov.id) {
                          <tr>
                            <td class="font-mono text-sm whitespace-nowrap">
                              {{ mov.fecha | date:'dd/MM/yyyy HH:mm' }}
                            </td>
                            <td>
                              <span class="badge-status" [ngClass]="getClaseTipoMov(mov.tipoMovimiento)">
                                {{ getEtiquetaTipoMov(mov.tipoMovimiento) }}
                              </span>
                            </td>
                            <td>
                              <strong>{{ mov.itemNombre }}</strong>
                              <span class="d-block text-xs text-muted">
                                {{ mov.tipoItem }}
                              </span>
                            </td>
                            <td class="text-right font-mono font-bold" [class.text-success]="mov.cantidad > 0" [class.text-danger]="mov.cantidad < 0">
                              {{ mov.cantidad > 0 ? '+' : '' }}{{ mov.tipoItem === 'SABOR' ? (mov.cantidad | number:'1.2-3') : mov.cantidad }} {{ mov.unidad }}
                            </td>
                            <td class="text-center font-mono text-xs">
                              {{ mov.tipoItem === 'SABOR' ? (mov.stockAnterior | number:'1.2-3') : mov.stockAnterior }}
                              &rarr;
                              <strong>{{ mov.tipoItem === 'SABOR' ? (mov.stockPosterior | number:'1.2-3') : mov.stockPosterior }}</strong>
                            </td>
                            <td class="text-xs max-w-xs truncate" [title]="mov.motivo || ''">
                              {{ mov.motivo || '-' }}
                            </td>
                            <td class="text-right font-mono text-xs">
                              {{ mov.costoUnitario ? (mov.costoUnitario | appCurrency) : '-' }}
                            </td>
                            <td class="text-right font-mono text-xs font-bold">
                              {{ (mov.costoUnitario && mov.cantidad) ? ((mov.costoUnitario * mov.cantidad) | appCurrency) : '-' }}
                            </td>
                            <td class="text-xs text-muted">
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

            <!-- SUBVISTA 2: VALORIZACIÓN DE STOCK -->
            @if (subtabInventario() === 'valorizacion') {
              <div class="card p-4 mt-4">
                <div class="section-header space-between flex-wrap gap-2 mb-3">
                  <div>
                    <h3 class="section-title">Inventario Físico Valorado a Costo y Precio de Venta</h3>
                    <p class="section-desc">Balance total de mercadería disponible, valorizada al costo unitario registrado y valuación potencial de ventas.</p>
                  </div>
                  <div class="d-flex gap-2 align-center">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="Buscar por nombre..."
                      [(ngModel)]="busquedaValorizacion"
                    />
                  </div>
                </div>

                @if (inventarioService.cargandoValorizacion()) {
                  <div class="loading-state">
                    <app-icon name="refresh" [size]="20" class="spinning" />
                    <span>Cargando valorización...</span>
                  </div>
                } @else if (inventarioService.valorizacion(); as val) {
                  <!-- CATEGORÍAS RESUMEN -->
                  <div class="subtotales-val-grid mb-3">
                    <div class="subtotal-box">
                      <span class="sub-label">Sabores de Helado (Bachas)</span>
                      <span class="sub-val">{{ subtotalSabores() | appCurrency }}</span>
                    </div>
                    <div class="subtotal-box">
                      <span class="sub-label">Envases / Cucuruchos</span>
                      <span class="sub-val">{{ subtotalPresentaciones() | appCurrency }}</span>
                    </div>
                    <div class="subtotal-box">
                      <span class="sub-label">Productos Simples / Bebidas</span>
                      <span class="sub-val">{{ subtotalProductos() | appCurrency }}</span>
                    </div>
                    <div class="subtotal-box highlight">
                      <span class="sub-label">Total Costo Valorado</span>
                      <span class="sub-val text-primary font-bold">{{ val.totalValorizadoGeneral | appCurrency }}</span>
                    </div>
                  </div>

                  <div class="table-responsive">
                    <table class="table-custom">
                      <thead>
                        <tr>
                          <th>Artículo</th>
                          <th>Tipo</th>
                          <th class="text-right">Stock Físico</th>
                          <th class="text-right">Costo / Precio Unit. (Gs.)</th>
                          <th class="text-right">Total Valorado (Gs.)</th>
                          <th>Estado Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of itemsValorizacionFiltrados(); track item.tipoItem + '-' + item.id) {
                          <tr>
                            <td>
                              <strong>{{ item.nombre }}</strong>
                            </td>
                            <td>
                              <span class="badge-tipo-item">{{ item.tipoItem }}</span>
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

            <!-- SUBVISTA 3: AUDITORÍAS FÍSICAS HISTÓRICAS Y COMPARATIVOS -->
            @if (subtabInventario() === 'auditorias') {
              <div class="card p-4 mt-4">
                <div class="section-header space-between flex-wrap gap-2 mb-3">
                  <div>
                    <h3 class="section-title">Historial de Auditorías Físicas y Actas de Conteo</h3>
                    <p class="section-desc">Reportes oficiales de tomas físicas con comparación entre stock registrado en el sistema, conteo real, diferencias detectadas e impacto económico en Gs.</p>
                  </div>
                  <div>
                    <button type="button" class="btn btn-outline btn-sm" (click)="inventarioService.obtenerTomas().subscribe()">
                      <app-icon name="refresh" [size]="14" [class.spinning]="inventarioService.cargandoTomas()" />
                      <span>Actualizar Lista</span>
                    </button>
                  </div>
                </div>

                @if (inventarioService.cargandoTomas()) {
                  <div class="loading-state">
                    <app-icon name="refresh" [size]="20" class="spinning" />
                    <span>Cargando auditorías...</span>
                  </div>
                } @else if (inventarioService.tomasInventario().length === 0) {
                  <div class="empty-state py-4 text-center">
                    <app-icon name="clipboard-check" [size]="40" class="text-muted" />
                    <h4 class="mt-2">No se han registrado auditorías físicas todavía</h4>
                    <p class="text-muted text-sm">Las tomas de inventario se inician desde el módulo de <strong>Inventario & Stock</strong>.</p>
                  </div>
                } @else {
                  <div class="table-responsive">
                    <table class="table-custom">
                      <thead>
                        <tr>
                          <th>N° Acta</th>
                          <th>Fecha y Hora</th>
                          <th>Auditor</th>
                          <th>Observaciones</th>
                          <th class="text-center">Artículos</th>
                          <th class="text-center">Discrepancias</th>
                          <th class="text-right">Impacto Neto (Gs.)</th>
                          <th>Estado</th>
                          <th class="text-right">Exportar Acta</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (toma of inventarioService.tomasInventario(); track toma.id) {
                          <tr>
                            <td class="font-mono font-bold text-primary">#{{ toma.id }}</td>
                            <td class="font-mono text-sm whitespace-nowrap">{{ toma.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td class="font-medium">{{ toma.usuarioAuditor }}</td>
                            <td class="text-sm max-w-xs truncate" [title]="toma.observaciones || ''">{{ toma.observaciones || '—' }}</td>
                            <td class="text-center font-mono">{{ toma.totalArticulos }}</td>
                            <td class="text-center">
                              @if (toma.totalDiferencias === 0) {
                                <span class="badge-status badge-success">0 (Exacto)</span>
                              } @else {
                                <span class="badge-status badge-warning">{{ toma.totalDiferencias }}</span>
                              }
                            </td>
                            <td class="text-right font-mono font-bold" [class.text-danger]="toma.impactoNeto < 0" [class.text-success]="toma.impactoNeto > 0">
                              {{ toma.impactoNeto | appCurrency }}
                            </td>
                            <td>
                              <span class="badge-status badge-primary">{{ toma.estado }}</span>
                            </td>
                            <td class="text-right whitespace-nowrap">
                              <div class="d-flex gap-1 justify-end">
                                <button type="button" class="btn btn-outline btn-sm" (click)="exportarAuditoriaPdf(toma)" title="Descargar Acta en PDF A4">
                                  <app-icon name="printer" [size]="14" />
                                  <span>PDF A4</span>
                                </button>
                                <button type="button" class="btn btn-sm btn-icon" (click)="exportarAuditoriaCsv(toma)" title="Exportar CSV">
                                  <app-icon name="file-spreadsheet" [size]="14" />
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
            }
          </div>
        }
      }

      <!-- MODAL DE COMPROBANTE PARA VER / REIMPRIMIR EN PDF -->
      <app-comprobante-modal
        [isOpen]="modalComprobanteAbierto()"
        [pedido]="pedidoSeleccionadoParaModal()"
        (close)="cerrarComprobanteModal()"
      />

      <!-- MODAL PARA RENOVAR TIMBRADO / HABILITAR NUEVO TALONARIO -->
      <app-modal
        [isOpen]="modalNuevoTalonarioAbierto()"
        title="Renovación de Timbrado y Alta de Nuevo Talonario Fiscal"
        size="md"
        (close)="cerrarModalNuevoTalonario()"
      >
        <div body class="nuevo-talonario-modal-body">
          <p class="modal-instructions">
            Ingresa los datos del nuevo timbrado o talonario autorizado por la SET/DNIT. Al confirmar, el sistema actualizará los membretes de impresión y fijará el nuevo rango de facturación.
          </p>

          <div class="form-grid-modal">
            <div class="form-group">
              <label class="form-label" for="nuevoTimbrado">Nuevo N° de Timbrado *</label>
              <input
                id="nuevoTimbrado"
                type="text"
                class="form-control"
                placeholder="Ej. 18234567"
                [(ngModel)]="nuevoTimbrado"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoTimbradoInicio">Inicio de Vigencia</label>
              <input
                id="nuevoTimbradoInicio"
                type="date"
                class="form-control"
                [(ngModel)]="nuevoTimbradoInicio"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoTimbradoVencimiento">Vencimiento del Timbrado *</label>
              <input
                id="nuevoTimbradoVencimiento"
                type="date"
                class="form-control"
                [(ngModel)]="nuevoTimbradoVencimiento"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoEstablecimiento">Establecimiento (3 dígitos)</label>
              <input
                id="nuevoEstablecimiento"
                type="text"
                class="form-control"
                placeholder="001"
                maxlength="3"
                [(ngModel)]="nuevoEstablecimiento"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoPuntoEmision">Punto de Emisión (3 dígitos)</label>
              <input
                id="nuevoPuntoEmision"
                type="text"
                class="form-control"
                placeholder="001"
                maxlength="3"
                [(ngModel)]="nuevoPuntoEmision"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoNumeroInicio">N° Inicial del Talonario *</label>
              <input
                id="nuevoNumeroInicio"
                type="number"
                min="1"
                class="form-control"
                placeholder="1"
                [(ngModel)]="nuevoNumeroInicio"
                (ngModelChange)="onCambioRangoNuevoTalonario()"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoNumeroFin">N° Final del Talonario (Límite) *</label>
              <input
                id="nuevoNumeroFin"
                type="number"
                min="1"
                class="form-control"
                placeholder="1000"
                [(ngModel)]="nuevoNumeroFin"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoUltimoNumero">Último Número Emitido Previo</label>
              <input
                id="nuevoUltimoNumero"
                type="number"
                min="0"
                class="form-control"
                [(ngModel)]="nuevoUltimoNumero"
              />
              <small class="field-hint">
                Primera factura a emitir: <strong>{{ nuevoEstablecimiento || '001' }}-{{ nuevoPuntoEmision || '001' }}-{{ ((nuevoUltimoNumero || 0) + 1).toString().padStart(7, '0') }}</strong>
              </small>
            </div>
          </div>
        </div>

        <div footer class="modal-footer-actions">
          <button type="button" class="btn btn-secondary" (click)="cerrarModalNuevoTalonario()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="confirmarNuevoTalonario()"
            [disabled]="guardandoFiscal() || !nuevoTimbrado.trim() || !nuevoTimbradoVencimiento"
          >
            <app-icon name="check" [size]="16" />
            <span>{{ guardandoFiscal() ? 'Activando...' : 'Habilitar y Activar Talonario' }}</span>
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .reportes-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.75rem;
      display: flex;
      align-items: center;
      gap: 0.625rem;
      color: var(--text-main);
      margin: 0;
    }

    .title-icon {
      color: var(--primary, #d97706);
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* FILTRO DE FECHAS */
    .filtro-fechas-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.875rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      box-shadow: var(--shadow-sm);
    }

    .preset-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .preset-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-subtle);
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .preset-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-focus);
    }

    .preset-btn.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }

    .fechas-inputs {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .input-date-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .input-date-group .form-control {
      padding: 0.375rem 0.5rem;
      font-size: 0.8125rem;
      width: 140px;
    }

    /* TABS */
    .reportes-tabs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 0.25rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      position: relative;
    }

    .tab-btn:hover {
      color: var(--text-main);
      background: var(--bg-subtle);
    }

    .tab-btn.active {
      color: var(--primary);
      background: var(--bg-surface);
      border-bottom: 3px solid var(--primary);
      margin-bottom: -0.4rem;
    }

    /* KPIS DASHBOARD */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }

    .kpi-card.kpi-primary {
      border-left: 4px solid var(--primary);
    }

    .kpi-card.kpi-iva {
      border-left: 4px solid var(--color-info);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--primary-subtle);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon.kpi-orders {
      background: #e0f2fe;
      color: #0284c7;
    }

    .kpi-icon.kpi-ticket {
      background: #fef3c7;
      color: #d97706;
    }

    .kpi-icon.kpi-fiscal {
      background: #dbeafe;
      color: #2563eb;
    }

    .kpi-icon.kpi-alert {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    .kpi-details {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-val {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
      margin: 0.2rem 0;
    }

    .kpi-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* GRÁFICOS */
    .charts-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1.25rem;
      margin-top: 1rem;
    }

    @media (max-width: 992px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .card-header.space-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-main);
    }

    .card-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0.15rem 0 0;
    }

    .card-body {
      padding: 1.25rem;
    }

    .svg-chart-wrapper {
      position: relative;
      width: 100%;
    }

    .svg-chart {
      width: 100%;
      height: 180px;
      overflow: visible;
    }

    .chart-point-group circle {
      cursor: pointer;
      transition: r 0.15s ease, stroke-width 0.15s ease;
    }

    .chart-point-group:hover circle {
      r: 7;
      stroke-width: 3.5;
    }

    .chart-tooltip {
      position: absolute;
      background: #0f172a;
      color: #ffffff;
      padding: 0.35rem 0.65rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      pointer-events: none;
      transform: translateX(-50%);
      box-shadow: var(--shadow-md);
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      white-space: nowrap;
    }

    .chart-x-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      padding: 0 1rem;
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    /* DONUT */
    .donut-layout {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .donut-svg-wrapper {
      position: relative;
      width: 130px;
      height: 130px;
      flex-shrink: 0;
      margin: 0 auto;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .donut-center-info {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
    }

    .donut-center-label {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .donut-center-val {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .donut-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      min-width: 180px;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      color: var(--text-main);
    }

    .legend-pct {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .legend-val {
      font-weight: 600;
    }

    /* DASHBOARD BOTTOM */
    .dashboard-bottom-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.25rem;
      margin-top: 1.25rem;
    }

    .comparativa-row {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .comp-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .comp-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .comp-factura {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .comp-ticket {
      background: #fef3c7;
      color: #b45309;
    }

    .comp-info {
      display: flex;
      justify-content: space-between;
      flex: 1;
      align-items: center;
    }

    .comp-label {
      font-size: 0.8125rem;
      color: var(--text-main);
    }

    .comp-val {
      font-size: 1rem;
      font-weight: 700;
    }

    .comp-bar-wrapper {
      width: 100%;
      height: 8px;
      background: var(--bg-subtle);
      border-radius: 4px;
      overflow: hidden;
    }

    .comp-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .bg-blue { background: #2563eb; }
    .bg-amber { background: #d97706; }
    .bg-flavor { background: #db2777; }
    .bg-pink { background: #ec4899; }
    .bg-green { background: #16a34a; }

    /* MINI-TABLES */
    .mini-table {
      display: flex;
      flex-direction: column;
    }

    .mini-table-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .mini-table-row:last-child {
      border-bottom: none;
    }

    .rank-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--bg-subtle);
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .rank-badge.rank-flavor {
      background: #fce7f3;
      color: #be185d;
    }

    .mini-item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 0.8125rem;
    }

    .mini-sub {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .mini-pct-bar {
      width: 70px;
      height: 6px;
      background: var(--bg-subtle);
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 3px;
    }

    /* FILTROS SECUNDARIOS */
    .filtros-secundarios-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      box-shadow: var(--shadow-sm);
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .filter-item .form-control {
      padding: 0.35rem 0.6rem;
      font-size: 0.8125rem;
      min-width: 140px;
    }

    .resumen-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin: 0.75rem 0;
      flex-wrap: wrap;
    }

    .resumen-badges {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .export-actions,
    .card-actions-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .resumen-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      display: flex;
      gap: 0.35rem;
      align-items: center;
    }

    /* TABLAS */
    .table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }

    .data-table th {
      background: var(--bg-subtle);
      color: var(--text-muted);
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }

    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    .data-table tbody tr:hover {
      background: var(--bg-subtle);
    }

    .fiscal-table th, .fiscal-table td {
      padding: 0.6rem 0.75rem;
    }

    .voucher-pill {
      display: inline-block;
      padding: 0.15rem 0.4rem;
      font-size: 0.6875rem;
      font-weight: 700;
      border-radius: 4px;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    .badge-tag {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background: #f1f5f9;
      color: #334155;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .table-pagination {
      padding: 0.75rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .pag-buttons {
      display: flex;
      gap: 0.5rem;
    }

    /* FISCAL KPIS */
    .fiscal-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .fiscal-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      box-shadow: var(--shadow-sm);
    }

    .fiscal-card-highlight {
      border-left: 4px solid var(--color-warning);
    }

    .fiscal-card-total {
      border-left: 4px solid var(--color-success);
    }

    .fiscal-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .fiscal-val {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .fiscal-sub {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    /* CAJAS SUMMARY */
    .cajas-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }

    .border-danger { border-left: 4px solid var(--color-danger); }
    .border-success { border-left: 4px solid var(--color-success); }
    .text-danger { color: var(--color-danger); }
    .text-success { color: var(--color-success); }
    .text-warning { color: var(--color-warning); }

    /* RANKINGS GRID */
    .rankings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
    }

    .ranking-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .ranking-row:last-child {
      border-bottom: none;
    }

    .rank-pos {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--bg-subtle);
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.2rem;
    }

    .rank-pos-flavor {
      background: #fce7f3;
      color: #be185d;
    }

    .rank-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .rank-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .rank-total {
      font-weight: 700;
      color: var(--text-main);
    }

    .rank-bar-bg {
      width: 100%;
      height: 6px;
      background: var(--bg-subtle);
      border-radius: 3px;
      overflow: hidden;
    }

    .rank-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .rank-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    /* SKELETONS */
    .skeleton-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .skeleton-card {
      height: 90px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: pulse 1.5s infinite;
      border-radius: var(--radius-md);
    }

    .skeleton-chart {
      height: 240px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: pulse 1.5s infinite;
      border-radius: var(--radius-md);
    }

    @keyframes pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .empty-state-chart {
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    /* REIMPRESIONES */
    .reimpresion-hero {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .hero-text {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #eff6ff;
      color: #2563eb;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hero-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .hero-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
      max-width: 800px;
      line-height: 1.45;
    }

    .reimpresion-controls {
      display: grid;
      grid-template-columns: minmax(240px, 320px) 1fr;
      gap: 1rem;
      align-items: flex-end;
    }

    @media (max-width: 768px) {
      .reimpresion-controls {
        grid-template-columns: 1fr;
      }
    }

    .control-printer {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .control-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
    }

    .search-input-box {
      width: 100%;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .search-input-wrapper .search-icon {
      position: absolute;
      left: 0.85rem;
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input-wrapper .input-lg {
      padding-left: 2.6rem;
      padding-right: 2.5rem;
      height: 2.75rem;
      font-size: 0.9375rem;
      width: 100%;
    }

    .btn-clear {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border-radius: 50%;
    }

    .btn-clear:hover {
      background: #e2e8f0;
      color: var(--text-main);
    }

    .trx-pill-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .trx-pill {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.8125rem;
      background: #f1f5f9;
      color: #0f172a;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid #cbd5e1;
      letter-spacing: 0.5px;
    }

    .btn-copy {
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.35rem;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-copy:hover {
      background: #f8fafc;
      color: var(--primary);
      border-color: var(--primary);
    }

    .ticket-cell {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .pago-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
    }

    .badge-voucher {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 600;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      border-radius: 4px;
      padding: 0.1rem 0.35rem;
    }

    .acciones-reimpresion {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
    }

    .empty-reimpresion {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    /* TALONARIOS & TIMBRADO FISCAL */
    .talonario-hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .talonario-header-info {
      flex: 1;
      min-width: 280px;
    }

    .talonario-hero-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      letter-spacing: 0.3px;
    }

    .badge-status.badge-success {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .badge-status.badge-warning {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .badge-status.badge-danger {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .talonario-progress-bar {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .fiscal-form-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .fiscal-form-layout {
        grid-template-columns: 1fr;
      }
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .form-actions-fiscal {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .fiscal-ticket-preview {
      background: var(--bg-subtle, #f8fafc);
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px dashed var(--border-color);
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .mini-ticket-paper {
      background: #ffffff;
      color: #000;
      padding: 1rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.4;
    }

    .border-dashed-t { border-top: 1px dashed #888; }
    .border-dashed-b { border-bottom: 1px dashed #888; }
    .my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .font-mono { font-family: monospace; }
    .text-xxs { font-size: 0.6875rem; }

    .nuevo-talonario-modal-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .modal-instructions {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.45;
    }

    .form-grid-modal {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .form-grid-modal {
        grid-template-columns: 1fr;
      }
    }

    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
    }

    /* SUBTABS & INVENTARIO REPORT STYLES */
    .subtabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .subtab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }
    .subtab-btn:hover {
      background: var(--bg-subtle);
      color: var(--text-main);
    }
    .subtab-btn.active {
      background: #0f172a;
      border-color: #0f172a;
      color: #ffffff;
    }
    .subtotales-val-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .subtotal-box {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .subtotal-box.highlight {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .subtotal-box .sub-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .subtotal-box .sub-val {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .badge-tipo-item {
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--bg-subtle);
      color: var(--text-muted);
    }
    .badge-status.badge-info {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }
    .badge-status.badge-purple {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }
  `]
})
export class ReportesComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly toast = inject(ToastService);
  public readonly impresorasService = inject(ImpresorasService);
  private readonly pedidosService = inject(PedidosService);
  public readonly institucionService = inject(InstitucionService);
  public readonly exportService = inject(ReporteExportService);
  public readonly inventarioService = inject(InventarioService);

  // Estados principales
  public readonly tabActiva = signal<TabReporte>('dashboard');
  public readonly cargando = signal<boolean>(false);
  public readonly descargandoCsv = signal<boolean>(false);
  public readonly descargandoPdf = signal<boolean>(false);

  // Inventario & Kardex
  public readonly subtabInventario = signal<'kardex' | 'valorizacion' | 'auditorias'>('kardex');
  public filtroKardexTipo: string = 'TODOS';
  public filtroKardexMovimiento: string = 'TODOS';
  public busquedaValorizacion: string = '';

  // Filtros de fecha
  public readonly presetSeleccionado = signal<PresetFecha>('esteMes');
  public fechaInicio: string = '';
  public fechaFin: string = '';

  // Datos de cada pestaña
  public readonly dashboardData = signal<DashboardReporteDTO | null>(null);
  public readonly ventasData = signal<ReporteVentasDTO | null>(null);
  public readonly libroIvaData = signal<LibroVentasIvaDTO | null>(null);
  public readonly cajasData = signal<ReporteCajasDTO | null>(null);
  public readonly rankingsData = signal<RankingProductosDTO | null>(null);

  // Filtros específicos de ventas
  public filtroMetodoPago: string = 'TODOS';
  public filtroTipoComprobante: string = 'TODOS';
  public filtroTipoEntrega: string = 'TODOS';
  public filtroCajero: string = '';

  // Reimpresiones
  public busquedaReimpresion: string = '';
  public impresoraSeleccionadaId: number | null = null;
  public readonly reimprimiendoId = signal<number | null>(null);
  public readonly copiadoTrxId = signal<string | null>(null);
  public readonly modalComprobanteAbierto = signal<boolean>(false);
  public readonly pedidoSeleccionadoParaModal = signal<Pedido | null>(null);
  public readonly cargandoDetallePedido = signal<boolean>(false);

  // Talonarios y Timbrado SET
  public readonly modalNuevoTalonarioAbierto = signal<boolean>(false);
  public readonly guardandoFiscal = signal<boolean>(false);

  public fiscalRuc: string = '';
  public fiscalTimbrado: string = '';
  public fiscalTimbradoInicio: string = '';
  public fiscalTimbradoVencimiento: string = '';
  public fiscalEstablecimiento: string = '001';
  public fiscalPuntoEmision: string = '001';
  public fiscalNumeroInicio: number = 1;
  public fiscalNumeroFin: number = 1000;
  public fiscalUltimoNumero: number = 0;

  public nuevoTimbrado: string = '';
  public nuevoTimbradoInicio: string = '';
  public nuevoTimbradoVencimiento: string = '';
  public nuevoEstablecimiento: string = '001';
  public nuevoPuntoEmision: string = '001';
  public nuevoNumeroInicio: number = 1;
  public nuevoNumeroFin: number = 1000;
  public nuevoUltimoNumero: number = 0;

  // Paginación en ventas
  public readonly paginaVentas = signal<number>(1);
  public readonly tamanoPaginaVentas = 15;

  // Interacción en gráficos
  public readonly puntoHover = signal<{ fecha: string; total: number; cantidadPedidos: number; x: number; y: number } | null>(null);

  // Cálculos reactivos
  public readonly totalPaginasVentas = computed(() => {
    const pedidos = this.ventasData()?.pedidos || [];
    return Math.max(1, Math.ceil(pedidos.length / this.tamanoPaginaVentas));
  });

  public readonly ventasPaginadas = computed(() => {
    const pedidos = this.ventasData()?.pedidos || [];
    const inicio = (this.paginaVentas() - 1) * this.tamanoPaginaVentas;
    return pedidos.slice(inicio, inicio + this.tamanoPaginaVentas);
  });

  public readonly ticketsReimpresion = computed<PedidoResumenReporteDTO[]>(() => {
    const pedidos = this.ventasData()?.pedidos || [];
    const q = this.busquedaReimpresion.trim().toLowerCase();
    if (!q) {
      return pedidos;
    }
    return pedidos.filter(p => {
      const trx = (p.trxId || `TRX-${p.id.toString().padStart(6, '0')}`).toLowerCase();
      const idStr = p.id.toString();
      const cliente = (p.clienteNombre || '').toLowerCase();
      const ruc = (p.clienteRuc || '').toLowerCase();
      const nroFactura = (p.numeroFactura || '').toLowerCase();
      const nroVoucher = (p.numeroVoucher || '').toLowerCase();

      return trx.includes(q) ||
        idStr.includes(q) ||
        cliente.includes(q) ||
        ruc.includes(q) ||
        nroFactura.includes(q) ||
        nroVoucher.includes(q);
    });
  });

  public readonly diasRestantesTimbrado = computed<number>(() => {
    if (!this.fiscalTimbradoVencimiento) return 0;
    const partes = this.fiscalTimbradoVencimiento.split('-').map(Number);
    if (partes.length < 3) return 0;
    const fechaVenc = new Date(partes[0], partes[1] - 1, partes[2]);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffTime = fechaVenc.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  public readonly facturasRestantes = computed<number>(() => {
    const fin = this.fiscalNumeroFin || 1000;
    const actual = this.fiscalUltimoNumero || 0;
    return Math.max(0, fin - actual);
  });

  public readonly porcentajeTalonarioUsado = computed<number>(() => {
    const inicio = this.fiscalNumeroInicio || 1;
    const fin = this.fiscalNumeroFin || 1000;
    const actual = this.fiscalUltimoNumero || 0;
    const total = Math.max(1, fin - inicio + 1);
    const usados = Math.max(0, actual - inicio + 1);
    return Math.min(100, Math.round((usados / total) * 100));
  });

  public readonly estadoTalonario = computed<'VIGENTE' | 'POR_VENCER' | 'POR_AGOTARSE' | 'VENCIDO' | 'AGOTADO'>(() => {
    const dias = this.diasRestantesTimbrado();
    const restantes = this.facturasRestantes();
    const fin = this.fiscalNumeroFin || 1000;
    const actual = this.fiscalUltimoNumero || 0;

    if (dias < 0) return 'VENCIDO';
    if (actual >= fin && fin > 0) return 'AGOTADO';
    if (dias <= 30) return 'POR_VENCER';
    if (restantes <= 50 || this.porcentajeTalonarioUsado() >= 90) return 'POR_AGOTARSE';
    return 'VIGENTE';
  });

  public readonly proximaFacturaPreview = computed<string>(() => {
    const estab = this.fiscalEstablecimiento || '001';
    const punto = this.fiscalPuntoEmision || '001';
    const sig = (this.fiscalUltimoNumero || 0) + 1;
    return `${estab}-${punto}-${sig.toString().padStart(7, '0')}`;
  });

  // Puntos del gráfico SVG
  public readonly chartPoints = computed(() => {
    const dias = this.dashboardData()?.ventasPorDia || [];
    if (dias.length === 0) return [];

    const maxVal = Math.max(...dias.map(d => d.total), 1);
    const anchoUtil = 580;
    const altoUtil = 120;
    const paddingX = 40;
    const paddingY = 30;

    const step = dias.length > 1 ? anchoUtil / (dias.length - 1) : 0;

    return dias.map((d, idx) => {
      const x = paddingX + idx * step;
      const y = paddingY + altoUtil - (d.total / maxVal) * altoUtil;
      return { fecha: d.fecha, total: d.total, cantidadPedidos: d.cantidadPedidos, x, y };
    });
  });

  public readonly svgLinePath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return pts.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  });

  public readonly svgAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const line = pts.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    return `${line} L ${lastX} 160 L ${firstX} 160 Z`;
  });

  // Segmentos del Donut Chart
  public readonly donutSegments = computed<DonutSegment[]>(() => {
    const d = this.dashboardData();
    if (!d || d.totalVentas <= 0) return [];

    const circunferencia = 2 * Math.PI * 45; // ~282.74
    const total = d.totalVentas;

    const items = [
      { label: 'Efectivo', monto: d.totalEfectivo, color: '#16a34a' },
      { label: 'Tarjeta Débito', monto: d.totalTarjetaDebito, color: '#2563eb' },
      { label: 'Tarjeta Crédito', monto: d.totalTarjetaCredito, color: '#9333ea' },
      { label: 'QR / Transf.', monto: d.totalTransferenciaQr, color: '#d97706' }
    ].filter(i => i.monto > 0);

    let offsetAcumulado = 0;

    return items.map(item => {
      const pct = (item.monto / total) * 100;
      const strokeLength = (pct / 100) * circunferencia;
      const dashArray = `${strokeLength} ${circunferencia - strokeLength}`;
      const dashOffset = `-${offsetAcumulado}`;
      offsetAcumulado += strokeLength;

      return {
        label: item.label,
        monto: item.monto,
        porcentaje: pct,
        color: item.color,
        dashArray,
        dashOffset
      };
    });
  });

  // Máximos para barras relativas en Rankings
  public readonly maxCantidadPresentaciones = computed(() => {
    const list = this.rankingsData()?.topPresentaciones || [];
    return Math.max(...list.map(i => i.cantidad), 1);
  });

  public readonly maxCantidadSimples = computed(() => {
    const list = this.rankingsData()?.topProductosSimples || [];
    return Math.max(...list.map(i => i.cantidad), 1);
  });

  public readonly maxEleccionesSabores = computed(() => {
    const list = this.rankingsData()?.topSabores || [];
    return Math.max(...list.map(s => s.cantidadElecciones), 1);
  });

  public readonly maxCantidadToppings = computed(() => {
    const list = this.rankingsData()?.topToppings || [];
    return Math.max(...list.map(t => t.cantidad), 1);
  });

  public readonly itemsValorizacionFiltrados = computed(() => {
    const val = this.inventarioService.valorizacion();
    if (!val || !val.items) return [];
    let items = val.items;

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

  ngOnInit(): void {
    this.aplicarPreset('esteMes');
    this.impresorasService.cargarImpresoras();
    this.institucionService.obtenerInstitucion().subscribe(() => {
      this.cargarDatosFiscales();
    });
  }

  cambiarTab(tab: TabReporte): void {
    this.tabActiva.set(tab);
    this.cargarDatosTabActual();
  }

  aplicarPreset(preset: PresetFecha): void {
    this.presetSeleccionado.set(preset);
    const hoy = new Date();

    if (preset === 'hoy') {
      this.fechaInicio = this.formatoIsoFecha(hoy);
      this.fechaFin = this.formatoIsoFecha(hoy);
    } else if (preset === 'ayer') {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      this.fechaInicio = this.formatoIsoFecha(ayer);
      this.fechaFin = this.formatoIsoFecha(ayer);
    } else if (preset === '7dias') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 6);
      this.fechaInicio = this.formatoIsoFecha(d7);
      this.fechaFin = this.formatoIsoFecha(hoy);
    } else if (preset === 'esteMes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      this.fechaInicio = this.formatoIsoFecha(inicioMes);
      this.fechaFin = this.formatoIsoFecha(hoy);
    } else if (preset === 'mesAnterior') {
      const inicioMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const finMesAnt = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      this.fechaInicio = this.formatoIsoFecha(inicioMesAnt);
      this.fechaFin = this.formatoIsoFecha(finMesAnt);
    }

    this.cargarDatosTabActual();
  }

  onCambioFechaManual(): void {
    this.presetSeleccionado.set('personalizado');
  }

  refrescar(): void {
    this.cargarDatosTabActual();
  }

  cargarDatosTabActual(): void {
    const tab = this.tabActiva();
    if (tab === 'dashboard') {
      this.cargarDashboard();
    } else if (tab === 'ventas' || tab === 'reimpresiones') {
      this.cargarVentas();
    } else if (tab === 'libro-iva') {
      this.cargarLibroIva();
    } else if (tab === 'cajas') {
      this.cargarCajas();
    } else if (tab === 'rankings') {
      this.cargarRankings();
    } else if (tab === 'talonarios') {
      this.cargarDatosFiscales();
    } else if (tab === 'inventario') {
      this.cargarInventario();
    }
  }

  cambiarSubtabInventario(subtab: 'kardex' | 'valorizacion' | 'auditorias'): void {
    this.subtabInventario.set(subtab);
    if (subtab === 'auditorias') {
      this.inventarioService.obtenerTomas().subscribe({ error: () => {} });
    }
  }

  cargarInventario(): void {
    this.inventarioService.obtenerKpis(this.fechaInicio, this.fechaFin).subscribe({ error: () => {} });
    this.inventarioService.obtenerKardex(
      this.fechaInicio || undefined,
      this.fechaFin || undefined,
      this.filtroKardexTipo,
      this.filtroKardexMovimiento
    ).subscribe({ error: () => {} });
    this.inventarioService.obtenerValorizacion().subscribe({ error: () => {} });
    this.inventarioService.obtenerTomas().subscribe({ error: () => {} });
  }

  aplicarFiltrosKardex(): void {
    this.inventarioService.obtenerKardex(
      this.fechaInicio || undefined,
      this.fechaFin || undefined,
      this.filtroKardexTipo,
      this.filtroKardexMovimiento
    ).subscribe({ error: () => {} });
  }

  exportarInventarioCsv(): void {
    if (this.subtabInventario() === 'kardex') {
      this.exportService.exportarKardexCsv(
        this.inventarioService.kardex(),
        { inicio: this.fechaInicio, fin: this.fechaFin },
        this.inventarioService.kpis() ?? undefined
      );
    } else if (this.subtabInventario() === 'valorizacion') {
      const val = this.inventarioService.valorizacion();
      if (val) this.exportService.exportarValorizacionCsv(val);
    } else if (this.subtabInventario() === 'auditorias') {
      const tomas = this.inventarioService.tomasInventario();
      if (tomas.length > 0) {
        this.exportarAuditoriaCsv(tomas[0]);
      }
    }
  }

  exportarInventarioPdf(): void {
    this.descargandoPdf.set(true);
    try {
      if (this.subtabInventario() === 'kardex') {
        this.exportService.exportarKardexPdf(
          this.inventarioService.kardex(),
          { inicio: this.fechaInicio, fin: this.fechaFin },
          this.inventarioService.kpis() ?? undefined
        );
      } else if (this.subtabInventario() === 'valorizacion') {
        const val = this.inventarioService.valorizacion();
        if (val) this.exportService.exportarValorizacionPdf(val);
      } else if (this.subtabInventario() === 'auditorias') {
        const tomas = this.inventarioService.tomasInventario();
        if (tomas.length > 0) {
          this.exportarAuditoriaPdf(tomas[0]);
        }
      }
    } finally {
      this.descargandoPdf.set(false);
    }
  }

  exportarAuditoriaPdf(toma: TomaInventario): void {
    if (!toma.detalles || toma.detalles.length === 0) {
      this.inventarioService.obtenerTomaPorId(toma.id).subscribe(detalleToma => {
        this.exportService.exportarComparativoAuditoriaPdf(detalleToma);
      });
    } else {
      this.exportService.exportarComparativoAuditoriaPdf(toma);
    }
  }

  exportarAuditoriaCsv(toma: TomaInventario): void {
    if (!toma.detalles || toma.detalles.length === 0) {
      this.inventarioService.obtenerTomaPorId(toma.id).subscribe(detalleToma => {
        this.exportService.exportarComparativoAuditoriaCsv(detalleToma);
      });
    } else {
      this.exportService.exportarComparativoAuditoriaCsv(toma);
    }
  }

  getClaseTipoMov(tipo: string): string {
    switch (tipo) {
      case 'ENTRADA_COMPRA':
      case 'ENTRADA_PRODUCCION':
        return 'badge-success';
      case 'SALIDA_VENTA':
        return 'badge-info';
      case 'SALIDA_MERMA':
        return 'badge-danger';
      case 'AJUSTE_INVENTARIO':
        return 'badge-purple';
      case 'REINTEGRO_CANCELACION':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getEtiquetaTipoMov(tipo: string): string {
    switch (tipo) {
      case 'ENTRADA_COMPRA': return 'Entrada Compra';
      case 'ENTRADA_PRODUCCION': return 'Producción Helado';
      case 'SALIDA_VENTA': return 'Venta POS';
      case 'SALIDA_MERMA': return 'Baja / Merma';
      case 'AJUSTE_INVENTARIO': return 'Ajuste Físico';
      case 'REINTEGRO_CANCELACION': return 'Reintegro';
      default: return tipo;
    }
  }

  cargarDashboard(): void {
    this.cargando.set(true);
    this.reportesService.obtenerDashboard({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin }).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar las métricas del dashboard.');
      }
    });
  }

  cargarVentas(): void {
    this.cargando.set(true);
    this.paginaVentas.set(1);
    this.reportesService.obtenerVentas({
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      metodoPago: this.filtroMetodoPago,
      tipoComprobante: this.filtroTipoComprobante,
      tipoEntrega: this.filtroTipoEntrega,
      cajero: this.filtroCajero
    }).subscribe({
      next: (data) => {
        this.ventasData.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar el reporte de ventas.');
      }
    });
  }

  limpiarFiltrosVentas(): void {
    this.filtroMetodoPago = 'TODOS';
    this.filtroTipoComprobante = 'TODOS';
    this.filtroTipoEntrega = 'TODOS';
    this.filtroCajero = '';
    this.cargarVentas();
  }

  cargarLibroIva(): void {
    this.cargando.set(true);
    this.reportesService.obtenerLibroIva({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin }).subscribe({
      next: (data) => {
        this.libroIvaData.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo generar el Libro de Ventas IVA.');
      }
    });
  }

  // =========================================================================
  // MÉTODOS DE EXPORTACIÓN A CSV Y PDF (A4)
  // =========================================================================

  exportarVentasCsv(): void {
    const data = this.ventasData();
    if (!data || !data.pedidos || data.pedidos.length === 0) {
      this.toast.warning('No hay datos de ventas en el período seleccionado para exportar.');
      return;
    }
    this.exportService.exportarVentasCsv(
      data.pedidos,
      { inicio: this.fechaInicio, fin: this.fechaFin },
      { totalVentas: data.totalVentas, cantidadVentas: data.cantidadVentas }
    );
    this.toast.success('Reporte de ventas detalladas descargado en CSV.');
  }

  exportarVentasPdf(): void {
    const data = this.ventasData();
    if (!data || !data.pedidos || data.pedidos.length === 0) {
      this.toast.warning('No hay datos de ventas en el período seleccionado para generar el PDF.');
      return;
    }
    this.descargandoPdf.set(true);
    try {
      this.exportService.exportarVentasPdf(
        data.pedidos,
        { inicio: this.fechaInicio, fin: this.fechaFin },
        { totalVentas: data.totalVentas, cantidadVentas: data.cantidadVentas }
      );
      this.toast.success('Reporte de ventas detalladas generado en PDF tamaño A4.');
    } catch (e) {
      console.error('Error generando PDF de ventas', e);
      this.toast.error('Error al generar el documento PDF.');
    } finally {
      this.descargandoPdf.set(false);
    }
  }

  descargarCsvLibroIva(): void {
    this.descargandoCsv.set(true);
    this.reportesService.descargarLibroIvaCsv({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin }).subscribe({
      next: (blob) => {
        const nombre = `libro_ventas_iva_${this.fechaInicio}_al_${this.fechaFin}.csv`;
        this.reportesService.descargarBlob(blob, nombre);
        this.descargandoCsv.set(false);
        this.toast.success('Libro de Ventas descargado correctamente en CSV/Excel.');
      },
      error: () => {
        this.descargandoCsv.set(false);
        this.toast.error('Error al exportar el archivo CSV del Libro de Ventas.');
      }
    });
  }

  exportarLibroIvaPdf(): void {
    const data = this.libroIvaData();
    if (!data || !data.items || data.items.length === 0) {
      this.toast.warning('No hay registros fiscales en el período seleccionado para generar el PDF.');
      return;
    }
    this.descargandoPdf.set(true);
    try {
      this.exportService.exportarLibroIvaPdf(
        data,
        { inicio: this.fechaInicio, fin: this.fechaFin }
      );
      this.toast.success('Libro de Ventas IVA generado en PDF tamaño A4.');
    } catch (e) {
      console.error('Error generando PDF de libro IVA', e);
      this.toast.error('Error al generar el documento PDF del Libro de Ventas.');
    } finally {
      this.descargandoPdf.set(false);
    }
  }

  exportarCajasCsv(): void {
    const data = this.cajasData();
    if (!data || !data.sesiones || data.sesiones.length === 0) {
      this.toast.warning('No hay turnos o sesiones de caja para exportar en el período.');
      return;
    }
    this.exportService.exportarCajasCsv(
      data.sesiones,
      { inicio: this.fechaInicio, fin: this.fechaFin },
      {
        totalSesiones: data.totalSesiones,
        totalVentasGeneral: data.totalVentasGeneral,
        totalSobrante: data.totalSobrante,
        totalFaltante: data.totalFaltante
      }
    );
    this.toast.success('Auditoría de cajas descargada en CSV.');
  }

  exportarCajasPdf(): void {
    const data = this.cajasData();
    if (!data || !data.sesiones || data.sesiones.length === 0) {
      this.toast.warning('No hay sesiones de caja en el período para generar el PDF.');
      return;
    }
    this.descargandoPdf.set(true);
    try {
      this.exportService.exportarCajasPdf(
        data,
        { inicio: this.fechaInicio, fin: this.fechaFin }
      );
      this.toast.success('Auditoría de cajas generada en PDF tamaño A4.');
    } catch (e) {
      console.error('Error generando PDF de auditoría de cajas', e);
      this.toast.error('Error al generar el documento PDF de cajas.');
    } finally {
      this.descargandoPdf.set(false);
    }
  }

  cargarCajas(): void {
    this.cargando.set(true);
    this.reportesService.obtenerCajas({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin }).subscribe({
      next: (data) => {
        this.cajasData.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar la auditoría de cajas.');
      }
    });
  }

  cargarRankings(): void {
    this.cargando.set(true);
    this.reportesService.obtenerRankingProductos({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin }, 10).subscribe({
      next: (data) => {
        this.rankingsData.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudieron obtener los rankings.');
      }
    });
  }

  calcularPorcentaje(parcial: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round((parcial / total) * 100));
  }

  calcularPctRanking(val: number, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.min(100, (val / max) * 100);
  }

  formatearMedioPago(metodo: string): string {
    switch (metodo) {
      case 'EFECTIVO': return 'Efectivo';
      case 'TARJETA_DEBITO': return 'Tarjeta Débito';
      case 'TARJETA_CREDITO': return 'Tarjeta Crédito';
      case 'TRANSFERENCIA_BANCARIA_QR': return 'QR / Transferencia';
      default: return metodo;
    }
  }

  private formatoIsoFecha(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
  }

  copiarTrx(trxId: string): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(trxId);
    }
    this.copiadoTrxId.set(trxId);
    this.toast.success(`Trx ID copiado: ${trxId}`);
    setTimeout(() => {
      if (this.copiadoTrxId() === trxId) {
        this.copiadoTrxId.set(null);
      }
    }, 2000);
  }

  reimprimirEnTicketera(p: PedidoResumenReporteDTO): void {
    this.reimprimiendoId.set(p.id);
    const impId = this.impresoraSeleccionadaId || undefined;
    this.pedidosService.imprimirTicket(p.id, impId).subscribe({
      next: () => {
        this.toast.success(`Reimpresión del Ticket #${p.id} enviada exitosamente.`);
        this.reimprimiendoId.set(null);
      },
      error: (err) => {
        this.toast.error(`Error al enviar reimpresión del Ticket #${p.id}: ` + (err?.error?.message || err.message || 'Error de conexión'));
        this.reimprimiendoId.set(null);
      }
    });
  }

  verComprobanteModal(p: PedidoResumenReporteDTO): void {
    this.cargandoDetallePedido.set(true);
    this.pedidosService.obtenerPorId(p.id).subscribe({
      next: (pedidoCompleto) => {
        if (!pedidoCompleto.trxId && p.trxId) {
          pedidoCompleto.trxId = p.trxId;
        } else if (!pedidoCompleto.trxId) {
          pedidoCompleto.trxId = `TRX-${p.id.toString().padStart(6, '0')}`;
        }
        this.pedidoSeleccionadoParaModal.set(pedidoCompleto);
        this.modalComprobanteAbierto.set(true);
        this.cargandoDetallePedido.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el detalle completo del comprobante.');
        this.cargandoDetallePedido.set(false);
      }
    });
  }

  cerrarComprobanteModal(): void {
    this.modalComprobanteAbierto.set(false);
    this.pedidoSeleccionadoParaModal.set(null);
  }

  cargarDatosFiscales(): void {
    const inst = this.institucionService.institucion();
    this.fiscalRuc = inst.ruc || '';
    this.fiscalTimbrado = inst.timbrado || '';
    this.fiscalTimbradoInicio = inst.timbradoInicio || '';
    this.fiscalTimbradoVencimiento = inst.timbradoVencimiento || '';
    this.fiscalEstablecimiento = inst.establecimiento || '001';
    this.fiscalPuntoEmision = inst.puntoEmision || '001';
    this.fiscalNumeroInicio = inst.numeroInicioFactura ?? 1;
    this.fiscalNumeroFin = inst.numeroFinFactura ?? 1000;
    this.fiscalUltimoNumero = inst.ultimoNumeroFactura ?? 0;
  }

  guardarDatosFiscales(): void {
    if (!this.fiscalTimbrado.trim()) {
      this.toast.error('El número de timbrado es obligatorio.');
      return;
    }
    if (!this.fiscalTimbradoVencimiento) {
      this.toast.error('La fecha de vencimiento del timbrado es obligatoria.');
      return;
    }

    this.guardandoFiscal.set(true);
    const instActual = this.institucionService.institucion();
    this.institucionService.actualizar({
      ...instActual,
      ruc: this.fiscalRuc.trim(),
      timbrado: this.fiscalTimbrado.trim(),
      timbradoInicio: this.fiscalTimbradoInicio || undefined,
      timbradoVencimiento: this.fiscalTimbradoVencimiento,
      establecimiento: this.fiscalEstablecimiento.trim() || '001',
      puntoEmision: this.fiscalPuntoEmision.trim() || '001',
      numeroInicioFactura: this.fiscalNumeroInicio,
      numeroFinFactura: this.fiscalNumeroFin,
      ultimoNumeroFactura: this.fiscalUltimoNumero
    }).subscribe({
      next: () => {
        this.guardandoFiscal.set(false);
        this.cargarDatosFiscales();
        this.toast.success('Configuración fiscal y talonario actualizados exitosamente.');
      },
      error: (err) => {
        this.guardandoFiscal.set(false);
        this.toast.error('Error al actualizar datos fiscales: ' + (err?.error?.message || err.message || 'Error'));
      }
    });
  }

  abrirModalNuevoTalonario(): void {
    const inst = this.institucionService.institucion();
    this.nuevoTimbrado = '';
    this.nuevoTimbradoInicio = this.formatoIsoFecha(new Date());
    const unAno = new Date();
    unAno.setFullYear(unAno.getFullYear() + 1);
    this.nuevoTimbradoVencimiento = this.formatoIsoFecha(unAno);
    this.nuevoEstablecimiento = inst.establecimiento || '001';
    this.nuevoPuntoEmision = inst.puntoEmision || '001';

    const finPrevio = inst.numeroFinFactura || inst.ultimoNumeroFactura || 0;
    this.nuevoNumeroInicio = finPrevio + 1;
    this.nuevoNumeroFin = finPrevio + 1000;
    this.nuevoUltimoNumero = finPrevio;
    this.modalNuevoTalonarioAbierto.set(true);
  }

  onCambioRangoNuevoTalonario(): void {
    if (this.nuevoNumeroInicio) {
      this.nuevoUltimoNumero = this.nuevoNumeroInicio - 1;
      if (!this.nuevoNumeroFin || this.nuevoNumeroFin <= this.nuevoNumeroInicio) {
        this.nuevoNumeroFin = this.nuevoNumeroInicio + 999;
      }
    }
  }

  cerrarModalNuevoTalonario(): void {
    this.modalNuevoTalonarioAbierto.set(false);
  }

  confirmarNuevoTalonario(): void {
    if (!this.nuevoTimbrado.trim() || !this.nuevoTimbradoVencimiento) {
      this.toast.error('Debes completar el número de timbrado y la fecha de vencimiento.');
      return;
    }
    if (this.nuevoNumeroFin <= this.nuevoNumeroInicio) {
      this.toast.error('El número final debe ser mayor al número inicial del talonario.');
      return;
    }

    this.guardandoFiscal.set(true);
    const instActual = this.institucionService.institucion();
    this.institucionService.actualizar({
      ...instActual,
      timbrado: this.nuevoTimbrado.trim(),
      timbradoInicio: this.nuevoTimbradoInicio || undefined,
      timbradoVencimiento: this.nuevoTimbradoVencimiento,
      establecimiento: this.nuevoEstablecimiento.trim() || '001',
      puntoEmision: this.nuevoPuntoEmision.trim() || '001',
      numeroInicioFactura: this.nuevoNumeroInicio,
      numeroFinFactura: this.nuevoNumeroFin,
      ultimoNumeroFactura: this.nuevoUltimoNumero
    }).subscribe({
      next: () => {
        this.guardandoFiscal.set(false);
        this.modalNuevoTalonarioAbierto.set(false);
        this.cargarDatosFiscales();
        this.toast.success(`¡Nuevo talonario del timbrado #${this.nuevoTimbrado} habilitado con éxito!`);
      },
      error: (err) => {
        this.guardandoFiscal.set(false);
        this.toast.error('Error al habilitar nuevo talonario: ' + (err?.error?.message || err.message || 'Error'));
      }
    });
  }
}
