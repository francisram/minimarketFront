import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../core/services/reportes.service';
import { ToastService } from '../../core/services/toast.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';
import {
  DashboardReporteDTO,
  ReporteVentasDTO,
  LibroVentasIvaDTO,
  ReporteCajasDTO,
  RankingProductosDTO,
  PresetFecha,
  VentaDiariaDTO,
  ItemRankingDTO,
  SaborRankingDTO
} from '../../core/models/reporte.model';

type TabReporte = 'dashboard' | 'ventas' | 'libro-iva' | 'cajas' | 'rankings';

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
  imports: [CommonModule, FormsModule, DatePipe, AppIconComponent, AppCurrencyPipe],
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
          @if (tabActiva() === 'libro-iva') {
            <button type="button" class="btn btn-primary" (click)="descargarCsvLibroIva()" [disabled]="descargandoCsv()">
              <app-icon name="download" [size]="16" />
              <span>{{ descargandoCsv() ? 'Generando...' : 'Descargar Excel / CSV' }}</span>
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

            <!-- RESUMEN EN BADGES -->
            @if (ventasData()) {
              <div class="resumen-strip">
                <div class="resumen-pill">
                  <span>Total Facturado:</span>
                  <strong>{{ ventasData()!.totalVentas | appCurrency }}</strong>
                </div>
                <div class="resumen-pill">
                  <span>Transacciones:</span>
                  <strong>{{ ventasData()!.cantidadVentas }}</strong>
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
                  <button type="button" class="btn btn-outline btn-sm" (click)="descargarCsvLibroIva()" [disabled]="descargandoCsv()">
                    <app-icon name="download" [size]="14" />
                    <span>Exportar CSV</span>
                  </button>
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
      }
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
      gap: 0.75rem;
      margin: 0.75rem 0;
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
  `]
})
export class ReportesComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly toast = inject(ToastService);

  // Estados principales
  public readonly tabActiva = signal<TabReporte>('dashboard');
  public readonly cargando = signal<boolean>(false);
  public readonly descargandoCsv = signal<boolean>(false);

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

  ngOnInit(): void {
    this.aplicarPreset('esteMes');
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
    } else if (tab === 'ventas') {
      this.cargarVentas();
    } else if (tab === 'libro-iva') {
      this.cargarLibroIva();
    } else if (tab === 'cajas') {
      this.cargarCajas();
    } else if (tab === 'rankings') {
      this.cargarRankings();
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
}
