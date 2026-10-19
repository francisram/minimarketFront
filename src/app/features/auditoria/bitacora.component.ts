import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { ReporteExportService } from '../../core/services/reporte-export.service';
import { AuditoriaLog, FiltrosAuditoria, ResumenAuditoria } from '../../core/models/auditoria.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="bitacora-container">
      <!-- HEADER -->
      <div class="page-header">
        <div class="header-titles">
          <div class="title-with-icon">
            <div class="title-icon-box">
              <app-icon name="shield-check" [size]="26" />
            </div>
            <div>
              <h1 class="page-title">Bitácora Centralizada de Auditoría</h1>
              <p class="page-subtitle">
                Registro inmutable de trazabilidad de cambios, modificaciones de precios, stock, compras y actividades de usuarios
              </p>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cargarDatos()" [disabled]="auditoriaService.cargando()" title="Recargar eventos">
            <app-icon name="rotate-ccw" [size]="17" [extraClass]="auditoriaService.cargando() ? 'spin' : ''" />
            <span>Actualizar</span>
          </button>
          <button class="btn btn-secondary" (click)="exportarCsv()" [disabled]="logs().length === 0" title="Descargar reporte en Excel / CSV">
            <app-icon name="file-spreadsheet" [size]="17" />
            <span>Descargar CSV</span>
          </button>
          <button class="btn btn-primary" (click)="exportarPdf()" [disabled]="logs().length === 0" title="Descargar reporte oficial en PDF A4 apaisado">
            <app-icon name="download" [size]="17" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-primary">
          <div class="kpi-icon-wrapper">
            <app-icon name="history" [size]="24" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">TOTAL EVENTOS</span>
            <span class="kpi-value">{{ resumen()?.totalEventos || logs().length }}</span>
            <span class="kpi-hint">Operaciones auditadas</span>
          </div>
        </div>

        <div class="kpi-card kpi-info">
          <div class="kpi-icon-wrapper">
            <app-icon name="user" [size]="24" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">USUARIOS ACTIVOS</span>
            <span class="kpi-value">{{ resumen()?.totalUsuarios || totalUsuariosCalculado() }}</span>
            <span class="kpi-hint">Registraron actividad</span>
          </div>
        </div>

        <div class="kpi-card kpi-warning">
          <div class="kpi-icon-wrapper">
            <app-icon name="tag" [size]="24" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">MODIFICACIONES</span>
            <span class="kpi-value">{{ resumen()?.totalModificaciones || totalModificacionesCalculado() }}</span>
            <span class="kpi-hint">Precios, stock y datos</span>
          </div>
        </div>

        <div class="kpi-card kpi-danger">
          <div class="kpi-icon-wrapper">
            <app-icon name="alert-triangle" [size]="24" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">BAJAS Y ANULACIONES</span>
            <span class="kpi-value">{{ resumen()?.totalBajasOAnulaciones || totalBajasCalculado() }}</span>
            <span class="kpi-hint">Eliminaciones de registros</span>
          </div>
        </div>
      </div>

      <!-- FILTERS CARD -->
      <div class="filter-card">
        <div class="filter-header">
          <div class="filter-title">
            <app-icon name="filter" [size]="18" />
            <span>Filtros de Búsqueda</span>
          </div>

          <div class="presets-row">
            <button class="preset-btn" [class.active]="presetActivo === 'hoy'" (click)="aplicarPreset('hoy')">Hoy</button>
            <button class="preset-btn" [class.active]="presetActivo === 'semana'" (click)="aplicarPreset('semana')">Esta Semana</button>
            <button class="preset-btn" [class.active]="presetActivo === 'mes'" (click)="aplicarPreset('mes')">Este Mes</button>
            <button class="preset-btn" [class.active]="presetActivo === 'todo'" (click)="aplicarPreset('todo')">Todo el Historial</button>
          </div>
        </div>

        <div class="filter-grid">
          <!-- Fechas -->
          <div class="filter-group">
            <label class="filter-label">Desde</label>
            <input type="date" class="form-control" [(ngModel)]="filtros.fechaDesde" (change)="onFiltroCambiado()" />
          </div>

          <div class="filter-group">
            <label class="filter-label">Hasta</label>
            <input type="date" class="form-control" [(ngModel)]="filtros.fechaHasta" (change)="onFiltroCambiado()" />
          </div>

          <!-- Usuario -->
          <div class="filter-group">
            <label class="filter-label">Usuario</label>
            <select class="form-control" [(ngModel)]="filtros.usuario" (change)="onFiltroCambiado()">
              <option value="TODOS">Todos los usuarios</option>
              @for (user of usuariosDisponibles(); track user) {
                <option [value]="user">{{ user }}</option>
              }
            </select>
          </div>

          <!-- Módulo -->
          <div class="filter-group">
            <label class="filter-label">Módulo</label>
            <select class="form-control" [(ngModel)]="filtros.modulo" (change)="onFiltroCambiado()">
              <option value="TODOS">Todos los módulos</option>
              <option value="PRODUCTOS_CAFETERIA">Productos / Cafetería</option>
              <option value="CATALOGO_MAESTRO">Catálogo Maestro ERP</option>
              <option value="COMPRAS">Compras a Proveedores</option>
              <option value="CAJA">Caja & Arqueos</option>
              <option value="STOCK">Stock & Inventario</option>
              <option value="SABORES">Sabores de Helado</option>
              <option value="PRESENTACIONES_ENVASES">Presentaciones / Envases</option>
              <option value="TOPPINGS">Toppings y Agregados</option>
            </select>
          </div>

          <!-- Acción -->
          <div class="filter-group">
            <label class="filter-label">Tipo de Acción</label>
            <select class="form-control" [(ngModel)]="filtros.accion" (change)="onFiltroCambiado()">
              <option value="TODOS">Todas las acciones</option>
              <option value="CREACION">Creación / Alta</option>
              <option value="MODIFICACION">Modificación / Cambio de Precios</option>
              <option value="ELIMINACION">Eliminación / Baja</option>
              <option value="ANULACION">Anulación de Factura</option>
              <option value="AJUSTE_INVENTARIO">Ajuste de Stock / Conteo</option>
              <option value="APERTURA_CAJA">Apertura de Caja</option>
              <option value="CIERRE_CAJA">Cierre de Caja</option>
            </select>
          </div>

          <!-- Buscar libre -->
          <div class="filter-group full-width-search">
            <label class="filter-label">Buscar por palabra clave</label>
            <div class="search-input-wrapper">
              <app-icon name="search" [size]="16" extraClass="search-icon" />
              <input
                type="text"
                class="form-control with-icon"
                placeholder="Buscar por artículo, comprobante, usuario o detalle..."
                [(ngModel)]="filtros.buscar"
                (keyup.enter)="onFiltroCambiado()"
                (blur)="onFiltroCambiado()"
              />
              @if (filtros.buscar) {
                <button class="clear-search-btn" (click)="limpiarBuscador()" title="Limpiar texto">✕</button>
              }
            </div>
          </div>
        </div>

        <div class="filter-footer">
          <span class="active-count">
            Mostrando <strong>{{ logs().length }}</strong> eventos registrados
          </span>
          <button class="btn-link" (click)="limpiarTodosLosFiltros()">
            Limpiar todos los filtros
          </button>
        </div>
      </div>

      <!-- TABLA / GRILLA DE AUDITORÍA -->
      <div class="table-container">
        @if (auditoriaService.cargando()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Consultando bitácora de auditoría...</p>
          </div>
        } @else if (logs().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-circle">
              <app-icon name="shield-check" [size]="40" />
            </div>
            <h3>No se encontraron registros</h3>
            <p>No existen operaciones registradas con los filtros seleccionados o para el rango de fechas indicado.</p>
            <button class="btn btn-secondary" (click)="limpiarTodosLosFiltros()">Restablecer Filtros</button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="audit-table">
              <thead>
                <tr>
                  <th style="width: 70px;"># ID</th>
                  <th style="width: 150px;">Fecha y Hora</th>
                  <th style="width: 130px;">Usuario</th>
                  <th style="width: 160px;">Módulo</th>
                  <th style="width: 140px;">Acción</th>
                  <th style="width: 220px;">Elemento Afectado</th>
                  <th>Detalle de la Operación</th>
                  <th style="width: 110px; text-align: center;">IP Origen</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logs(); track log.id) {
                  <tr>
                    <td class="col-id">#{{ log.id }}</td>
                    <td class="col-fecha">
                      <div class="fecha-wrapper">
                        <span class="fecha-dia">{{ formatearFecha(log.fecha) }}</span>
                        <span class="fecha-hora">{{ formatearHora(log.fecha) }}</span>
                      </div>
                    </td>
                    <td class="col-user">
                      <div class="user-badge" [title]="'Operación realizada por ' + log.usuario">
                        <span class="user-avatar">{{ obtenerIniciales(log.usuario) }}</span>
                        <span class="user-name">{{ log.usuario || 'sistema' }}</span>
                      </div>
                    </td>
                    <td class="col-modulo">
                      <span class="modulo-badge" [ngClass]="obtenerClaseModulo(log.modulo)">
                        {{ formatearModulo(log.modulo) }}
                      </span>
                    </td>
                    <td class="col-accion">
                      <span class="accion-badge" [ngClass]="obtenerClaseAccion(log.accion)">
                        {{ formatearAccion(log.accion) }}
                      </span>
                    </td>
                    <td class="col-entidad">
                      <div class="entidad-info">
                        <span class="entidad-nombre" [title]="log.entidadNombre || '—'">{{ log.entidadNombre || '—' }}</span>
                        @if (log.entidadId) {
                          <span class="entidad-id">ID: {{ log.entidadId }}</span>
                        }
                      </div>
                    </td>
                    <td class="col-detalle">
                      <div class="detalle-texto" [innerHTML]="resaltarDetalle(log.detalle)"></div>
                    </td>
                    <td class="col-ip">
                      <span class="ip-tag">{{ log.ipOrigen || '127.0.0.1' }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .bitacora-container {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* HEADER */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: white;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #eff6ff;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.2rem 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* BOTONES */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #0284c7;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0369a1;
    }

    .btn-secondary {
      background: #f8fafc;
      color: #334155;
      border-color: #cbd5e1;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .btn-link {
      background: none;
      border: none;
      color: #0284c7;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }

    .btn-link:hover {
      color: #0369a1;
    }

    /* KPIS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 1.2rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .kpi-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-primary .kpi-icon-wrapper { background: #f1f5f9; color: #1e293b; }
    .kpi-info .kpi-icon-wrapper { background: #e0f2fe; color: #0284c7; }
    .kpi-warning .kpi-icon-wrapper { background: #fef3c7; color: #d97706; }
    .kpi-danger .kpi-icon-wrapper { background: #fee2e2; color: #dc2626; }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .kpi-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* FILTROS */
    .filter-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    .filter-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }

    .presets-row {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .preset-btn {
      padding: 0.35rem 0.75rem;
      font-size: 0.78rem;
      font-weight: 600;
      background: #f8fafc;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .preset-btn:hover {
      background: #e2e8f0;
    }

    .preset-btn.active {
      background: #0284c7;
      color: white;
      border-color: #0284c7;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .full-width-search {
      grid-column: 1 / -1;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .filter-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
    }

    .form-control {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #1e293b;
      background: #fff;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-control.with-icon {
      padding-left: 2.3rem;
      width: 100%;
    }

    .search-input-wrapper :deep(.search-icon) {
      position: absolute;
      left: 0.8rem;
      color: #94a3b8;
      pointer-events: none;
    }

    .clear-search-btn {
      position: absolute;
      right: 0.6rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.2rem 0.4rem;
    }

    .filter-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
      font-size: 0.85rem;
      color: #64748b;
    }

    /* TABLA */
    .table-container {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .audit-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }

    .audit-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 0.75rem 1rem;
      border-bottom: 2px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .audit-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      color: #1e293b;
    }

    .audit-table tbody tr:hover {
      background: #f8fafc;
    }

    .col-id {
      font-family: monospace;
      font-weight: 700;
      color: #64748b;
      font-size: 0.8rem;
    }

    .fecha-wrapper {
      display: flex;
      flex-direction: column;
    }

    .fecha-dia {
      font-weight: 600;
      color: #1e293b;
    }

    .fecha-hora {
      font-size: 0.75rem;
      color: #64748b;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .user-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
      font-size: 0.72rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name {
      font-weight: 600;
      color: #0f172a;
    }

    .modulo-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .mod-productos { background: #fef3c7; color: #b45309; }
    .mod-maestro { background: #fde68a; color: #92400e; }
    .mod-compras { background: #e0e7ff; color: #4338ca; }
    .mod-caja { background: #dcfce7; color: #15803d; }
    .mod-stock { background: #e0f2fe; color: #0369a1; }
    .mod-sabores { background: #fae8ff; color: #86198f; }
    .mod-envases { background: #ffedd5; color: #c2410c; }
    .mod-toppings { background: #fce7f3; color: #be185d; }
    .mod-general { background: #f1f5f9; color: #475569; }

    .accion-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 700;
      text-align: center;
    }

    .acc-creacion { background: #dcfce7; color: #166534; }
    .acc-modificacion { background: #e0f2fe; color: #0369a1; }
    .acc-eliminacion { background: #fee2e2; color: #991b1b; }
    .acc-anulacion { background: #fef2f2; color: #b91c1c; border: 1px dashed #ef4444; }
    .acc-ajuste { background: #f3e8ff; color: #6b21a8; }
    .acc-general { background: #f1f5f9; color: #475569; }

    .entidad-info {
      display: flex;
      flex-direction: column;
    }

    .entidad-nombre {
      font-weight: 600;
      color: #0f172a;
    }

    .entidad-id {
      font-size: 0.72rem;
      color: #64748b;
    }

    .detalle-texto {
      color: #334155;
      line-height: 1.4;
      font-size: 0.83rem;
    }

    .detalle-texto :deep(.cambio-tag) {
      font-weight: 600;
      color: #0284c7;
      background: #f0f9ff;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .detalle-texto :deep(.flecha-cambio) {
      color: #d97706;
      font-weight: 700;
      padding: 0 0.2rem;
    }

    .col-ip {
      text-align: center;
    }

    .ip-tag {
      font-family: monospace;
      font-size: 0.74rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
    }

    /* ESTADOS VACÍO Y CARGA */
    .loading-state, .empty-state {
      padding: 3.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .empty-icon-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state h3 {
      font-size: 1.15rem;
      color: #0f172a;
      margin: 0;
    }

    .empty-state p {
      color: #64748b;
      font-size: 0.88rem;
      max-width: 480px;
      margin: 0;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spin {
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class BitacoraComponent implements OnInit {
  readonly auditoriaService = inject(AuditoriaService);
  private readonly reporteExport = inject(ReporteExportService);
  private readonly toast = inject(ToastService);

  readonly logs = this.auditoriaService.logs;
  readonly resumen = this.auditoriaService.resumen;
  readonly usuariosDisponibles = this.auditoriaService.usuarios;

  filtros: FiltrosAuditoria = {
    fechaDesde: '',
    fechaHasta: '',
    usuario: 'TODOS',
    modulo: 'TODOS',
    accion: 'TODOS',
    buscar: ''
  };

  presetActivo: string = 'mes';

  ngOnInit(): void {
    this.aplicarPreset('mes');
    this.auditoriaService.cargarFiltrosMetadatos();
  }

  aplicarPreset(preset: string): void {
    this.presetActivo = preset;
    const hoy = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatear = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'hoy') {
      const hoyStr = formatear(hoy);
      this.filtros.fechaDesde = hoyStr;
      this.filtros.fechaHasta = hoyStr;
    } else if (preset === 'semana') {
      const inicioSemana = new Date(hoy);
      const dia = hoy.getDay();
      const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1); // lunes
      inicioSemana.setDate(diff);
      this.filtros.fechaDesde = formatear(inicioSemana);
      this.filtros.fechaHasta = formatear(hoy);
    } else if (preset === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      this.filtros.fechaDesde = formatear(inicioMes);
      this.filtros.fechaHasta = formatear(hoy);
    } else if (preset === 'todo') {
      this.filtros.fechaDesde = '';
      this.filtros.fechaHasta = '';
    }

    this.cargarDatos();
  }

  onFiltroCambiado(): void {
    this.cargarDatos();
  }

  limpiarBuscador(): void {
    this.filtros.buscar = '';
    this.cargarDatos();
  }

  limpiarTodosLosFiltros(): void {
    this.filtros = {
      fechaDesde: '',
      fechaHasta: '',
      usuario: 'TODOS',
      modulo: 'TODOS',
      accion: 'TODOS',
      buscar: ''
    };
    this.presetActivo = 'todo';
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.auditoriaService.cargarLogs(this.filtros);
  }

  exportarCsv(): void {
    const list = this.logs();
    if (!list || list.length === 0) {
      this.toast.warning('No hay datos disponibles para exportar a CSV');
      return;
    }
    this.reporteExport.exportarAuditoriaCsv(list, this.filtros, this.resumen());
  }

  exportarPdf(): void {
    const list = this.logs();
    if (!list || list.length === 0) {
      this.toast.warning('No hay datos disponibles para exportar a PDF');
      return;
    }
    this.reporteExport.exportarAuditoriaPdf(list, this.filtros, this.resumen());
  }

  // --- HELPERS VISUALES ---

  formatearFecha(iso: string): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  }

  formatearHora(iso: string): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return '';
    }
  }

  obtenerIniciales(user?: string): string {
    if (!user) return 'SI';
    const partes = user.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return user.substring(0, 2).toUpperCase();
  }

  formatearModulo(mod?: string): string {
    if (!mod) return 'General';
    switch (mod.toUpperCase()) {
      case 'PRODUCTOS_CAFETERIA': return 'Cafetería / Prod.';
      case 'CATALOGO_MAESTRO': return 'Catálogo ERP';
      case 'COMPRAS': return 'Compras Prov.';
      case 'CAJA': return 'Caja & Arqueo';
      case 'STOCK': return 'Kardex & Stock';
      case 'SABORES': return 'Sabores Helado';
      case 'PRESENTACIONES_ENVASES': return 'Envases';
      case 'TOPPINGS': return 'Toppings';
      default: return mod;
    }
  }

  obtenerClaseModulo(mod?: string): string {
    if (!mod) return 'mod-general';
    switch (mod.toUpperCase()) {
      case 'PRODUCTOS_CAFETERIA': return 'mod-productos';
      case 'CATALOGO_MAESTRO': return 'mod-maestro';
      case 'COMPRAS': return 'mod-compras';
      case 'CAJA': return 'mod-caja';
      case 'STOCK': return 'mod-stock';
      case 'SABORES': return 'mod-sabores';
      case 'PRESENTACIONES_ENVASES': return 'mod-envases';
      case 'TOPPINGS': return 'mod-toppings';
      default: return 'mod-general';
    }
  }

  formatearAccion(acc?: string): string {
    if (!acc) return 'Operación';
    switch (acc.toUpperCase()) {
      case 'CREACION': return 'Alta / Creación';
      case 'MODIFICACION': return 'Modificación';
      case 'ELIMINACION': return 'Eliminación';
      case 'ANULACION': return 'Anulación Fact.';
      case 'AJUSTE_INVENTARIO': return 'Ajuste Conteo';
      case 'APERTURA_CAJA': return 'Apertura Caja';
      case 'CIERRE_CAJA': return 'Cierre Caja';
      case 'ENTRADA_PRODUCCION': return 'Producción Stock';
      case 'SALIDA_MERMA': return 'Merma Stock';
      default: return acc;
    }
  }

  obtenerClaseAccion(acc?: string): string {
    if (!acc) return 'acc-general';
    const a = acc.toUpperCase();
    if (a.includes('CREACION')) return 'acc-creacion';
    if (a.includes('MODIFICACION')) return 'acc-modificacion';
    if (a.includes('ELIMINACION')) return 'acc-eliminacion';
    if (a.includes('ANULACION')) return 'acc-anulacion';
    if (a.includes('AJUSTE') || a.includes('CAJA')) return 'acc-ajuste';
    return 'acc-general';
  }

  resaltarDetalle(detalle: string): string {
    if (!detalle) return '—';
    // Escapar etiquetas HTML
    const sanitized = detalle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Resaltar flechas de cambio ➔
    return sanitized.replace(/➔/g, '<span class="flecha-cambio">➔</span>');
  }

  totalUsuariosCalculado(): number {
    return new Set(this.logs().map(l => l.usuario)).size;
  }

  totalModificacionesCalculado(): number {
    return this.logs().filter(l => l.accion === 'MODIFICACION').length;
  }

  totalBajasCalculado(): number {
    return this.logs().filter(l => l.accion === 'ELIMINACION' || l.accion === 'ANULACION' || l.accion === 'SALIDA_MERMA').length;
  }
}
