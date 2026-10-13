import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../core/services/caja.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { SesionCaja } from '../../core/models/caja.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, AppIconComponent, AppModalComponent, AppCurrencyPipe],
  template: `
    <div class="caja-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Control de Cajas y Turnos</h1>
          <p class="page-subtitle">Apertura de turno por cajero, arqueo de ventas por método de pago y monitor multi-caja</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="refrescar()">
            <app-icon name="refresh" [size]="15" />
            <span>Refrescar</span>
          </button>
          @if (cajaService.cajaAbierta()) {
            @if (puedeCerrarCaja()) {
              <button type="button" class="btn btn-danger" (click)="abrirModalCierre()">
                <app-icon name="lock" [size]="16" />
                <span>Cerrar Mi Caja / Arqueo</span>
              </button>
            } @else {
              <button
                type="button"
                class="btn btn-secondary btn-disabled-lock"
                (click)="mostrarAdvertenciaPermisoCierre()"
                [title]="'Turno abierto por ' + cajaService.cajeroActivo() + '. Solo ese cajero o un Administrador pueden cerrarlo.'"
              >
                <app-icon name="lock" [size]="16" />
                <span>Cierre Bloqueado ({{ cajaService.cajeroActivo() }})</span>
              </button>
            }
          } @else {
            <button type="button" class="btn btn-primary" (click)="abrirModalApertura()">
              <app-icon name="plus" [size]="16" />
              <span>Abrir Mi Turno</span>
            </button>
          }
        </div>
      </div>

      <!-- MONITOR MULTI-CAJA (SUPERVISIÓN DE CAJAS ACTIVAS) -->
      @if (authService.isAdminOrOwner() || cajaService.cajasAbiertas().length > 1) {
        <div class="card multi-caja-card mb-4">
          <div class="card-header space-between">
            <div class="d-flex align-center gap-2">
              <app-icon name="users" [size]="20" />
              <h3 class="card-title">Cajas Activas en Simultáneo (Multi-Caja)</h3>
            </div>
            <div class="d-flex align-center gap-2">
              <span class="badge" [ngClass]="cajaService.cajasAbiertas().length > 0 ? 'badge-en-curso' : 'badge-cerrada'">
                {{ cajaService.cajasAbiertas().length }} {{ cajaService.cajasAbiertas().length === 1 ? 'caja activa' : 'cajas activas' }}
              </span>
              <button type="button" class="btn btn-sm btn-secondary" (click)="cajaService.cargarCajasAbiertas().subscribe()" title="Actualizar cajas abiertas">
                <app-icon name="refresh" [size]="14" />
              </button>
            </div>
          </div>
          <div class="card-body">
            @if (cajaService.cajasAbiertas().length === 0) {
              <div class="text-center py-3 text-muted">
                <p class="m-0">No hay cajeros con turnos de caja abiertos en este momento.</p>
              </div>
            } @else {
              <div class="cajas-grid">
                @for (caja of cajaService.cajasAbiertas(); track caja.id) {
                  <div class="caja-live-card" [class.es-mi-caja]="caja.usuarioApertura === authService.username()">
                    <div class="caja-live-header">
                      <div class="caja-cajero-info">
                        <div class="avatar-circle">
                          {{ (caja.usuarioApertura || 'U').substring(0, 2).toUpperCase() }}
                        </div>
                        <div>
                          <h4 class="m-0 font-bold">{{ caja.usuarioApertura }}</h4>
                          <span class="text-muted small">Sesión #{{ caja.id }}</span>
                        </div>
                      </div>
                      <div class="d-flex align-center gap-1">
                        @if (caja.usuarioApertura === authService.username()) {
                          <span class="badge badge-info">Mi Turno</span>
                        }
                        <span class="status-dot"></span>
                      </div>
                    </div>

                    <div class="caja-live-body">
                      <div class="caja-live-row">
                        <span class="text-muted">Apertura:</span>
                        <span>{{ caja.fechaApertura | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <div class="caja-live-row">
                        <span class="text-muted">Fondo Inicial:</span>
                        <span class="font-medium">{{ caja.montoInicial | appCurrency }}</span>
                      </div>
                      @if (caja.totalVentasGeneral !== null && caja.totalVentasGeneral !== undefined) {
                        <div class="caja-live-row">
                          <span class="text-muted">Ventas acum.:</span>
                          <span class="font-bold text-green">{{ caja.totalVentasGeneral | appCurrency }}</span>
                        </div>
                      }
                    </div>

                    <div class="caja-live-footer">
                      <button
                        type="button"
                        class="btn btn-sm btn-secondary flex-1"
                        (click)="verDetalleSesion(caja)"
                        title="Ver detalle del arqueo en vivo"
                      >
                        <app-icon name="clipboard-list" [size]="14" />
                        <span>Arqueo</span>
                      </button>
                      @if (puedeCerrarSesion(caja)) {
                        <button
                          type="button"
                          class="btn btn-sm btn-danger flex-1"
                          (click)="abrirModalCierre(caja)"
                          title="Cerrar turno y efectuar arqueo"
                        >
                          <app-icon name="lock" [size]="14" />
                          <span>Cerrar</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ESTADO ACTUAL DEL TURNO -->
      @if (cajaService.cajaAbierta()) {
        <!-- BANNER TURNO ACTIVO -->
        <div class="card turno-activo-card mb-4">
          <div class="turno-header">
            <div class="turno-status-badge">
              <span class="status-dot"></span>
              <strong>MI TURNO ACTIVO - CAJA ABIERTA</strong>
            </div>
            <div class="turno-meta">
              <span><strong>Sesión:</strong> #{{ cajaService.estadoCaja()?.sesionId }}</span>
              <span class="meta-divider">•</span>
              <span><strong>Cajero:</strong> {{ cajaService.estadoCaja()?.cajeroApertura }}</span>
              <span class="meta-divider">•</span>
              <span><strong>Apertura:</strong> {{ cajaService.estadoCaja()?.fechaApertura | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>

          @if (!puedeCerrarCaja()) {
            <div class="caja-aviso-titular">
              <app-icon name="info" [size]="15" />
              <span>Esta caja fue abierta por <strong>{{ cajaService.cajeroActivo() }}</strong>. Solo el cajero titular o un Administrador/Supervisor pueden realizar el arqueo y cierre.</span>
            </div>
          }

          <!-- RESUMEN DE VENTAS EN TIEMPO REAL -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon-box bg-blue">
                <app-icon name="banknote" [size]="22" />
              </div>
              <div class="kpi-details">
                <span class="kpi-label">Fondo Inicial (Cambio)</span>
                <span class="kpi-value">{{ (cajaService.resumenCaja()?.montoInicial ?? cajaService.estadoCaja()?.montoInicial ?? 0) | appCurrency }}</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-box bg-green">
                <app-icon name="banknote" [size]="22" />
              </div>
              <div class="kpi-details">
                <span class="kpi-label">Ventas en Efectivo</span>
                <span class="kpi-value text-green">{{ (cajaService.resumenCaja()?.totalEfectivo ?? 0) | appCurrency }}</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-box bg-purple">
                <app-icon name="clipboard-list" [size]="22" />
              </div>
              <div class="kpi-details">
                <span class="kpi-label">Tarjetas (Débito + Crédito)</span>
                <span class="kpi-value">{{ totalTarjetas() | appCurrency }}</span>
                <span class="kpi-sub">D: {{ (cajaService.resumenCaja()?.totalTarjetaDebito ?? 0) | appCurrency }} | C: {{ (cajaService.resumenCaja()?.totalTarjetaCredito ?? 0) | appCurrency }}</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-box bg-amber">
                <app-icon name="sparkles" [size]="22" />
              </div>
              <div class="kpi-details">
                <span class="kpi-label">Transferencia / QR</span>
                <span class="kpi-value">{{ (cajaService.resumenCaja()?.totalTransferenciaQr ?? 0) | appCurrency }}</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-box bg-indigo">
                <app-icon name="shopping-cart" [size]="22" />
              </div>
              <div class="kpi-details">
                <span class="kpi-label">Total Ventas Turno</span>
                <span class="kpi-value font-bold">{{ (cajaService.resumenCaja()?.totalVentas ?? 0) | appCurrency }}</span>
                <span class="kpi-sub">{{ cajaService.resumenCaja()?.totalPedidos ?? 0 }} pedidos registrados</span>
              </div>
            </div>

            <div class="kpi-card highlight-expected">
              <div class="kpi-icon-box bg-emerald">
                <app-icon name="banknote" [size]="22" />
              </div>
              <div class="kpi-details">
                <span class="kpi-label">Efectivo Esperado en Mano</span>
                <span class="kpi-value text-emerald font-bold">{{ (cajaService.resumenCaja()?.totalEsperadoEfectivo ?? 0) | appCurrency }}</span>
                <span class="kpi-sub">Fondo Inicial + Efectivo cobrado</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- BANNER CAJA CERRADA -->
        <div class="card caja-cerrada-card mb-4">
          <div class="caja-cerrada-icon">
            <app-icon name="lock" [size]="36" />
          </div>
          <div class="caja-cerrada-info">
            <h2>La caja se encuentra cerrada</h2>
            <p>
              No se pueden registrar ventas en el Punto de Venta (POS) sin una sesión de caja abierta.
              Inicia un nuevo turno indicando el fondo inicial en efectivo para comenzar a facturar.
            </p>
          </div>
          <button type="button" class="btn btn-primary btn-lg" (click)="abrirModalApertura()">
            <app-icon name="plus" [size]="18" />
            <span>Abrir Caja Ahora</span>
          </button>
        </div>
      }

      <!-- HISTORIAL DE SESIONES -->
      <div class="card">
        <div class="card-header space-between">
          <div class="d-flex align-center gap-2">
            <app-icon name="clipboard-list" [size]="20" />
            <h3 class="card-title">Historial de Turnos y Cierres de Caja</h3>
          </div>
          <span class="badge badge-info">{{ cajaService.historial().length }} registros</span>
        </div>

        <div class="card-body p-0 table-responsive">
          <table class="table-caja">
            <thead>
              <tr>
                <th># Sesión</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th class="text-right">Fondo Inicial</th>
                <th class="text-right">Total Ventas</th>
                <th class="text-right">Esperado Efectivo</th>
                <th class="text-right">Efectivo Real</th>
                <th class="text-center">Diferencia</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @if (cajaService.cargando()) {
                <tr>
                  <td colspan="10" class="text-center py-4">
                    <span class="text-muted">Cargando historial de turnos...</span>
                  </td>
                </tr>
              } @else if (cajaService.historial().length === 0) {
                <tr>
                  <td colspan="10" class="text-center py-4 text-muted">
                    No hay sesiones de caja registradas aún en el sistema.
                  </td>
                </tr>
              } @else {
                @for (sesion of cajaService.historial(); track sesion.id) {
                  <tr>
                    <td><strong>#{{ sesion.id }}</strong></td>
                    <td>
                      <div class="date-cell">
                        <span>{{ sesion.fechaApertura | date:'dd/MM/yyyy HH:mm' }}</span>
                        <span class="text-muted small">Por: {{ sesion.usuarioApertura }}</span>
                      </div>
                    </td>
                    <td>
                      @if (sesion.fechaCierre) {
                        <div class="date-cell">
                          <span>{{ sesion.fechaCierre | date:'dd/MM/yyyy HH:mm' }}</span>
                          <span class="text-muted small">Por: {{ sesion.usuarioCierre || 'N/A' }}</span>
                        </div>
                      } @else {
                        <span class="badge badge-warning">En curso</span>
                      }
                    </td>
                    <td class="text-right">{{ sesion.montoInicial | appCurrency }}</td>
                    <td class="text-right font-medium">{{ (sesion.totalVentasGeneral ?? 0) | appCurrency }}</td>
                    <td class="text-right">{{ (sesion.montoEsperadoEfectivo ?? 0) | appCurrency }}</td>
                    <td class="text-right">
                      @if (sesion.montoRealEfectivo !== null && sesion.montoRealEfectivo !== undefined) {
                        <span class="font-bold">{{ sesion.montoRealEfectivo | appCurrency }}</span>
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td class="text-center">
                      @if (sesion.estado === 'CERRADA') {
                        @if ((sesion.diferencia ?? 0) === 0) {
                          <span class="badge badge-listo" title="Cuadre exacto">Exacto (0)</span>
                        } @else if ((sesion.diferencia ?? 0) > 0) {
                          <span class="badge badge-sobrante" title="Sobrante en caja">+{{ sesion.diferencia | appCurrency }}</span>
                        } @else {
                          <span class="badge badge-cancelado" title="Faltante en caja">{{ sesion.diferencia | appCurrency }}</span>
                        }
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td class="text-center">
                      @if (sesion.estado === 'ABIERTA') {
                        <span class="badge badge-en-curso">ABIERTA</span>
                      } @else {
                        <span class="badge badge-cerrada">CERRADA</span>
                      }
                    </td>
                    <td class="text-center">
                      <div class="d-flex align-center justify-center gap-1">
                        <button
                          type="button"
                          class="btn-icon"
                          (click)="verDetalleSesion(sesion)"
                          title="Ver detalle de arqueo"
                        >
                          <app-icon name="clipboard-list" [size]="16" />
                        </button>
                        @if (sesion.estado === 'ABIERTA' && puedeCerrarSesion(sesion)) {
                          <button
                            type="button"
                            class="btn-icon text-red"
                            (click)="abrirModalCierre(sesion)"
                            title="Cerrar y arquear esta caja"
                          >
                            <app-icon name="lock" [size]="16" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== MODAL DE APERTURA DE CAJA ==================== -->
      <app-modal
        [isOpen]="modalAperturaAbierto()"
        title="Apertura de Turno de Caja"
        size="md"
        (close)="cerrarModalApertura()"
      >
        <div body class="modal-caja-body">
          <div class="info-alert">
            <app-icon name="banknote" [size]="20" />
            <span>Ingresa el monto del fondo fijo o caja chica en efectivo disponible para dar cambio.</span>
          </div>

          <div class="form-group mb-3">
            <label class="form-label" for="montoInicial">Monto Inicial en Efectivo (Gs.) *</label>
            <div class="input-currency-wrapper">
              <span class="currency-prefix">Gs.</span>
              <input
                id="montoInicial"
                type="number"
                min="0"
                step="5000"
                class="form-control"
                placeholder="Ej. 100000"
                [(ngModel)]="aperturaData.montoInicial"
              />
            </div>
            <div class="quick-amounts">
              <button type="button" class="btn-chip" (click)="setMontoInicial(50000)">50.000</button>
              <button type="button" class="btn-chip" (click)="setMontoInicial(100000)">100.000</button>
              <button type="button" class="btn-chip" (click)="setMontoInicial(200000)">200.000</button>
              <button type="button" class="btn-chip" (click)="setMontoInicial(300000)">300.000</button>
              <button type="button" class="btn-chip" (click)="setMontoInicial(500000)">500.000</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="obsApertura">Observaciones de Apertura (opcional)</label>
            <textarea
              id="obsApertura"
              class="form-control"
              rows="2"
              placeholder="Ej. Billetes chicos de cambio, turno tarde, etc."
              [(ngModel)]="aperturaData.observaciones"
            ></textarea>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalApertura()" [disabled]="cajaService.procesando()">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="confirmarApertura()" [disabled]="cajaService.procesando() || aperturaData.montoInicial < 0">
            @if (cajaService.procesando()) {
              <span>Abriendo caja...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>Confirmar Apertura</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL DE CIERRE Y ARQUEO ==================== -->
      <app-modal
        [isOpen]="modalCierreAbierto()"
        [title]="'Cierre de Caja y Arqueo' + (cajaCierreTarget() ? ' - ' + cajaCierreTarget()?.usuarioApertura + ' (#' + cajaCierreTarget()?.id + ')' : '')"
        size="lg"
        (close)="cerrarModalCierre()"
      >
        <div body class="modal-caja-body">
          @if (cajaCierreTarget()) {
            <div class="caja-aviso-cierre-supervisor mb-3">
              <app-icon name="shield" [size]="18" />
              <span>Estás realizando el cierre de la caja de <strong>{{ cajaCierreTarget()?.usuarioApertura }}</strong> (Sesión #{{ cajaCierreTarget()?.id }}).</span>
            </div>
          }

          <!-- RESUMEN AUTOMÁTICO DE LO ESPERADO -->
          <div class="arqueo-summary-box mb-3">
            <h4 class="summary-box-title">
              Resumen de Ventas del Turno
              @if (cajaCierreTarget()) {
                <span class="badge badge-info ml-2">Cajero: {{ cajaCierreTarget()?.usuarioApertura }}</span>
              }
            </h4>
            <div class="summary-rows">
              <div class="summary-row">
                <span>Fondo Inicial de Cambio:</span>
                <strong>{{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.montoInicial ?? 0) | appCurrency }}</strong>
              </div>
              <div class="summary-row">
                <span>(+) Total Cobrado en Efectivo:</span>
                <strong class="text-green">{{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalEfectivo ?? 0) | appCurrency }}</strong>
              </div>
              <div class="summary-row total-expected-row">
                <span>(=) EFECTIVO ESPERADO EN GAVETA:</span>
                <strong class="text-emerald">{{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalEsperadoEfectivo ?? 0) | appCurrency }}</strong>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row text-muted small">
                <span>Ventas Tarjeta Débito:</span>
                <span>{{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTarjetaDebito ?? 0) | appCurrency }}</span>
              </div>
              <div class="summary-row text-muted small">
                <span>Ventas Tarjeta Crédito:</span>
                <span>{{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTarjetaCredito ?? 0) | appCurrency }}</span>
              </div>
              <div class="summary-row">
                <span>(=) TOTAL VOUCHERS POS ESPERADOS:</span>
                <strong class="text-primary">
                  {{ (((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTarjetaDebito ?? 0) + ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTarjetaCredito ?? 0)) | appCurrency }}
                  @if ((resumenCierreTarget() ?? cajaService.resumenCaja())?.cantidadVouchers) {
                    <span class="text-muted small"> ({{ (resumenCierreTarget() ?? cajaService.resumenCaja())?.cantidadVouchers }} vouchers)</span>
                  }
                </strong>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row">
                <span>(=) TOTAL QR / TRANSFERENCIAS ESPERADO:</span>
                <strong class="text-info">
                  {{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTransferenciaQr ?? 0) | appCurrency }}
                  @if ((resumenCierreTarget() ?? cajaService.resumenCaja())?.cantidadTransferencias) {
                    <span class="text-muted small"> ({{ (resumenCierreTarget() ?? cajaService.resumenCaja())?.cantidadTransferencias }} ops)</span>
                  }
                </strong>
              </div>
              <div class="summary-row summary-grand-total">
                <span>TOTAL VENTAS GENERAL:</span>
                <strong>{{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalVentas ?? 0) | appCurrency }}</strong>
              </div>
            </div>
          </div>

          <!-- SECCIÓN DE CONTEO Y ARQUEO DESGLOSADO -->
          <div class="arqueo-inputs-section mb-3">
            <h4 class="section-subtitle mb-2">Conteo y Arqueo por Medio de Pago</h4>

            <!-- 1. EFECTIVO FÍSICO -->
            <div class="arqueo-block mb-3">
              <div class="arqueo-block-header">
                <span class="block-title">💵 1. Efectivo Físico en Gaveta *</span>
                <span class="badge-expected">Esperado: {{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalEsperadoEfectivo ?? 0) | appCurrency }}</span>
              </div>
              <div class="input-currency-wrapper">
                <span class="currency-prefix">Gs.</span>
                <input
                  id="montoRealEfectivo"
                  type="number"
                  min="0"
                  step="1000"
                  class="form-control input-highlight"
                  placeholder="Ingresa el monto de efectivo físico contado..."
                  [(ngModel)]="cierreData.montoRealEfectivo"
                  (ngModelChange)="calcularDiferencia()"
                />
              </div>
              <span class="form-hint">Cuenta los billetes y monedas físicos existentes en la gaveta.</span>
              @if (cierreData.montoRealEfectivo !== null && cierreData.montoRealEfectivo !== undefined) {
                <div class="diferencia-card mt-2" [ngClass]="getDiferenciaCardClass(diferenciaCalculada())">
                  <div class="d-flex align-center gap-2">
                    <app-icon [name]="diferenciaCalculada() === 0 ? 'check' : 'alert-triangle'" [size]="20" />
                    <div>
                      <h5 class="m-0 font-bold">Efectivo: {{ getDiferenciaTitulo(diferenciaCalculada()) }}</h5>
                      <p class="m-0 text-xs">{{ getDiferenciaMensaje(diferenciaCalculada(), 'Efectivo') }}</p>
                    </div>
                  </div>
                  <div class="diferencia-monto">
                    <span>Diferencia:</span>
                    <strong>{{ diferenciaCalculada() | appCurrency }}</strong>
                  </div>
                </div>
              }
            </div>

            <!-- 2. VOUCHERS POS (TARJETAS) -->
            <div class="arqueo-block mb-3">
              <div class="arqueo-block-header">
                <span class="block-title">💳 2. Vouchers Físicos de Tarjetas POS (Débito y Crédito)</span>
                <div class="d-flex align-center gap-2">
                  <span class="badge-expected">Esperado: {{ (((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTarjetaDebito ?? 0) + ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTarjetaCredito ?? 0)) | appCurrency }}</span>
                  <button type="button" class="btn btn-xs btn-outline" (click)="coincidirVouchers()" title="Autocompletar si coincide exactamente con el Cierre de Lote del POS">
                    ✓ Coincide con POS
                  </button>
                </div>
              </div>
              <div class="input-currency-wrapper">
                <span class="currency-prefix">Gs.</span>
                <input
                  id="montoRealTarjeta"
                  type="number"
                  min="0"
                  step="1000"
                  class="form-control"
                  placeholder="Total contado de comprobantes / vouchers POS..."
                  [(ngModel)]="cierreData.montoRealTarjeta"
                  (ngModelChange)="calcularDiferencia()"
                />
              </div>
              <span class="form-hint">Suma el total de los vouchers emitidos por el datáfono/POS o el Cierre de Lote.</span>
              @if (cierreData.montoRealTarjeta !== null && cierreData.montoRealTarjeta !== undefined) {
                <div class="diferencia-card mt-2" [ngClass]="getDiferenciaCardClass(diferenciaTarjetaCalculada())">
                  <div class="d-flex align-center gap-2">
                    <app-icon [name]="diferenciaTarjetaCalculada() === 0 ? 'check' : 'alert-triangle'" [size]="20" />
                    <div>
                      <h5 class="m-0 font-bold">Vouchers POS: {{ getDiferenciaTitulo(diferenciaTarjetaCalculada()) }}</h5>
                      <p class="m-0 text-xs">{{ getDiferenciaMensaje(diferenciaTarjetaCalculada(), 'Vouchers POS') }}</p>
                    </div>
                  </div>
                  <div class="diferencia-monto">
                    <span>Diferencia:</span>
                    <strong>{{ diferenciaTarjetaCalculada() | appCurrency }}</strong>
                  </div>
                </div>
              }
            </div>

            <!-- 3. TRANSFERENCIAS Y QR -->
            <div class="arqueo-block mb-3">
              <div class="arqueo-block-header">
                <span class="block-title">📱 3. Transferencias Bancarias y QR Verificados</span>
                <div class="d-flex align-center gap-2">
                  <span class="badge-expected">Esperado: {{ ((resumenCierreTarget() ?? cajaService.resumenCaja())?.totalTransferenciaQr ?? 0) | appCurrency }}</span>
                  <button type="button" class="btn btn-xs btn-outline" (click)="coincidirQr()" title="Autocompletar si coincide exactamente con el extracto bancario">
                    ✓ Coincide con Banco
                  </button>
                </div>
              </div>
              <div class="input-currency-wrapper">
                <span class="currency-prefix">Gs.</span>
                <input
                  id="montoRealTransferenciaQr"
                  type="number"
                  min="0"
                  step="1000"
                  class="form-control"
                  placeholder="Total verificado en banca / billetera..."
                  [(ngModel)]="cierreData.montoRealTransferenciaQr"
                  (ngModelChange)="calcularDiferencia()"
                />
              </div>
              <span class="form-hint">Monto verificado en la aplicación bancaria o panel de cobranzas QR.</span>
              @if (cierreData.montoRealTransferenciaQr !== null && cierreData.montoRealTransferenciaQr !== undefined) {
                <div class="diferencia-card mt-2" [ngClass]="getDiferenciaCardClass(diferenciaQrCalculada())">
                  <div class="d-flex align-center gap-2">
                    <app-icon [name]="diferenciaQrCalculada() === 0 ? 'check' : 'alert-triangle'" [size]="20" />
                    <div>
                      <h5 class="m-0 font-bold">QR / Transf.: {{ getDiferenciaTitulo(diferenciaQrCalculada()) }}</h5>
                      <p class="m-0 text-xs">{{ getDiferenciaMensaje(diferenciaQrCalculada(), 'QR / Transferencias') }}</p>
                    </div>
                  </div>
                  <div class="diferencia-monto">
                    <span>Diferencia:</span>
                    <strong>{{ diferenciaQrCalculada() | appCurrency }}</strong>
                  </div>
                </div>
              }
            </div>

            <!-- BALANCE NETO CONSOLIDADO -->
            @if (cierreData.montoRealEfectivo !== null && cierreData.montoRealEfectivo !== undefined) {
              <div class="balance-global-card mb-3" [ngClass]="getDiferenciaCardClass(diferenciaTotalCalculada())">
                <div class="balance-global-info">
                  <app-icon [name]="diferenciaTotalCalculada() === 0 ? 'check' : 'alert-triangle'" [size]="24" />
                  <div>
                    <h4 class="m-0 font-bold">Balance Neto Consolidado del Turno</h4>
                    <span class="text-xs">
                      Efectivo: {{ diferenciaCalculada() | appCurrency }} |
                      Vouchers: {{ diferenciaTarjetaCalculada() | appCurrency }} |
                      QR: {{ diferenciaQrCalculada() | appCurrency }}
                    </span>
                  </div>
                </div>
                <div class="balance-global-monto">
                  <span>Diferencia Neta:</span>
                  <strong class="text-lg">{{ diferenciaTotalCalculada() | appCurrency }}</strong>
                </div>
              </div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="obsCierre">Observaciones de Cierre (opcional)</label>
            <textarea
              id="obsCierre"
              class="form-control"
              rows="2"
              placeholder="Ej. Se apartaron billetes grandes, todo en orden..."
              [(ngModel)]="cierreData.observaciones"
            ></textarea>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalCierre()" [disabled]="cajaService.procesando()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-danger"
            (click)="confirmarCierre()"
            [disabled]="cajaService.procesando() || cierreData.montoRealEfectivo === null || cierreData.montoRealEfectivo < 0"
          >
            @if (cajaService.procesando()) {
              <span>Cerrando turno...</span>
            } @else {
              <app-icon name="lock" [size]="16" />
              <span>Confirmar Cierre de Caja</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL DE DETALLE DE SESIÓN ==================== -->
      <app-modal
        [isOpen]="modalDetalleAbierto()"
        title="Detalle Consolidado de Turno de Caja"
        size="md"
        (close)="cerrarModalDetalle()"
      >
        <div body class="modal-caja-body">
          @if (sesionSeleccionada) {
            <div class="ticket-arqueo">
              <div class="ticket-header-arqueo">
                <h3>SESIÓN DE CAJA #{{ sesionSeleccionada.id }}</h3>
                <span class="badge" [ngClass]="sesionSeleccionada.estado === 'ABIERTA' ? 'badge-en-curso' : 'badge-cerrada'">
                  {{ sesionSeleccionada.estado }}
                </span>
              </div>

              <div class="ticket-section">
                <div class="ticket-row"><span>Cajero Apertura:</span><strong>{{ sesionSeleccionada.usuarioApertura }}</strong></div>
                <div class="ticket-row"><span>Fecha Apertura:</span><span>{{ sesionSeleccionada.fechaApertura | date:'dd/MM/yyyy HH:mm' }}</span></div>
                @if (sesionSeleccionada.fechaCierre) {
                  <div class="ticket-row"><span>Cajero Cierre:</span><strong>{{ sesionSeleccionada.usuarioCierre || 'N/A' }}</strong></div>
                  <div class="ticket-row"><span>Fecha Cierre:</span><span>{{ sesionSeleccionada.fechaCierre | date:'dd/MM/yyyy HH:mm' }}</span></div>
                }
              </div>

              <div class="ticket-divider"></div>

              <div class="ticket-section">
                <div class="ticket-row"><span>Fondo Inicial:</span><strong>{{ sesionSeleccionada.montoInicial | appCurrency }}</strong></div>
                <div class="ticket-row"><span>Ventas Efectivo:</span><span>{{ (sesionSeleccionada.totalVentasEfectivo ?? 0) | appCurrency }}</span></div>
                <div class="ticket-row"><span>Ventas Débito:</span><span>{{ (sesionSeleccionada.totalVentasTarjetaDebito ?? 0) | appCurrency }}</span></div>
                <div class="ticket-row"><span>Ventas Crédito:</span><span>{{ (sesionSeleccionada.totalVentasTarjetaCredito ?? 0) | appCurrency }}</span></div>
                <div class="ticket-row"><span>Ventas QR:</span><span>{{ (sesionSeleccionada.totalVentasTransferenciaQr ?? 0) | appCurrency }}</span></div>
                <div class="ticket-row highlight-row"><span>Total Ventas:</span><strong>{{ (sesionSeleccionada.totalVentasGeneral ?? 0) | appCurrency }}</strong></div>
                <div class="ticket-row text-muted small"><span>Órdenes cobradas:</span><span>{{ sesionSeleccionada.cantidadPedidos ?? 0 }}</span></div>
              </div>

              <div class="ticket-divider"></div>

              @if (sesionSeleccionada.estado === 'CERRADA') {
                <div class="ticket-section arqueo-final">
                  <div class="ticket-section-title">--- RESULTADOS DEL ARQUEO ---</div>
                  <!-- EFECTIVO -->
                  <div class="ticket-row"><span>Efectivo Esperado:</span><strong>{{ (sesionSeleccionada.montoEsperadoEfectivo ?? 0) | appCurrency }}</strong></div>
                  <div class="ticket-row"><span>Efectivo Declarado:</span><strong>{{ (sesionSeleccionada.montoRealEfectivo ?? 0) | appCurrency }}</strong></div>
                  <div class="ticket-row small">
                    <span>Dif. Efectivo:</span>
                    <strong [ngClass]="getDiferenciaTextColor(sesionSeleccionada.diferencia)">
                      {{ (sesionSeleccionada.diferencia ?? 0) | appCurrency }}
                    </strong>
                  </div>

                  @if (sesionSeleccionada.montoRealTarjeta !== null && sesionSeleccionada.montoRealTarjeta !== undefined) {
                    <div class="ticket-divider-sm"></div>
                    <!-- VOUCHERS TARJETA -->
                    <div class="ticket-row"><span>Vouchers Esperados:</span><strong>{{ ((sesionSeleccionada.totalVentasTarjetaDebito ?? 0) + (sesionSeleccionada.totalVentasTarjetaCredito ?? 0)) | appCurrency }}</strong></div>
                    <div class="ticket-row"><span>Vouchers Declarados:</span><strong>{{ sesionSeleccionada.montoRealTarjeta | appCurrency }}</strong></div>
                    <div class="ticket-row small">
                      <span>Dif. Vouchers:</span>
                      <strong [ngClass]="getDiferenciaTextColor(sesionSeleccionada.diferenciaTarjeta)">
                        {{ (sesionSeleccionada.diferenciaTarjeta ?? 0) | appCurrency }}
                      </strong>
                    </div>
                  }

                  @if (sesionSeleccionada.montoRealTransferenciaQr !== null && sesionSeleccionada.montoRealTransferenciaQr !== undefined) {
                    <div class="ticket-divider-sm"></div>
                    <!-- QR TRANSFERENCIA -->
                    <div class="ticket-row"><span>QR Esperado:</span><strong>{{ (sesionSeleccionada.totalVentasTransferenciaQr ?? 0) | appCurrency }}</strong></div>
                    <div class="ticket-row"><span>QR Verificado:</span><strong>{{ sesionSeleccionada.montoRealTransferenciaQr | appCurrency }}</strong></div>
                    <div class="ticket-row small">
                      <span>Dif. QR:</span>
                      <strong [ngClass]="getDiferenciaTextColor(sesionSeleccionada.diferenciaTransferenciaQr)">
                        {{ (sesionSeleccionada.diferenciaTransferenciaQr ?? 0) | appCurrency }}
                      </strong>
                    </div>
                  }

                  <div class="ticket-divider-sm"></div>
                  <div class="ticket-row diferencia-row">
                    <span>DIFERENCIA NETA TOTAL:</span>
                    <strong [ngClass]="getDiferenciaTextColor((sesionSeleccionada.diferencia ?? 0) + (sesionSeleccionada.diferenciaTarjeta ?? 0) + (sesionSeleccionada.diferenciaTransferenciaQr ?? 0))">
                      {{ ((sesionSeleccionada.diferencia ?? 0) + (sesionSeleccionada.diferenciaTarjeta ?? 0) + (sesionSeleccionada.diferenciaTransferenciaQr ?? 0)) | appCurrency }}
                    </strong>
                  </div>
                </div>
              }

              @if (sesionSeleccionada.observacionesApertura) {
                <div class="ticket-notes">
                  <strong>Obs. Apertura:</strong> {{ sesionSeleccionada.observacionesApertura }}
                </div>
              }
              @if (sesionSeleccionada.observacionesCierre) {
                <div class="ticket-notes">
                  <strong>Obs. Cierre:</strong> {{ sesionSeleccionada.observacionesCierre }}
                </div>
              }
            </div>
          }
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalDetalle()">
            Cerrar
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .caja-page {
      padding: 0.5rem 0;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.25rem 0 0 0;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* TURNO ACTIVO */
    .turno-activo-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-lg);
      padding: 1.25rem;
    }
    .turno-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #dcfce7;
    }
    .turno-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #166534;
      font-size: 0.95rem;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    .turno-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .meta-divider {
      color: #cbd5e1;
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .kpi-card.highlight-expected {
      background: #f0fdf4;
      border-color: #86efac;
    }
    .kpi-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-blue { background: #e0f2fe; color: #0284c7; }
    .bg-green { background: #dcfce7; color: #16a34a; }
    .bg-purple { background: #f3e8ff; color: #9333ea; }
    .bg-amber { background: #fef3c7; color: #d97706; }
    .bg-indigo { background: #e0e7ff; color: #4f46e5; }
    .bg-emerald { background: #d1fae5; color: #059669; }

    .kpi-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .kpi-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 0.15rem;
    }
    .kpi-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    /* CAJA CERRADA */
    .caja-cerrada-card {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 2.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
    }
    .caja-cerrada-icon {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .caja-cerrada-info h2 {
      font-size: 1.25rem;
      color: var(--text-main);
      margin: 0 0 0.5rem 0;
    }
    .caja-cerrada-info p {
      font-size: 0.9rem;
      color: var(--text-muted);
      max-width: 500px;
      margin: 0;
      line-height: 1.4;
    }

    /* TABLA */
    .table-caja {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .table-caja th {
      background: var(--bg-subtle);
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }
    .table-caja td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-main);
    }
    .table-caja tr:hover {
      background: var(--bg-subtle);
    }
    .date-cell {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-listo { background: #dcfce7; color: #166534; }
    .badge-sobrante { background: #fef3c7; color: #b45309; }
    .badge-cancelado { background: #fee2e2; color: #991b1b; }
    .badge-warning { background: #fef9c3; color: #854d0e; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-en-curso { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-cerrada { background: #f1f5f9; color: #64748b; }

    /* MODAL FORM */
    .modal-caja-body {
      padding: 0.5rem 0;
    }
    .info-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .input-currency-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .currency-prefix {
      position: absolute;
      left: 1rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .input-currency-wrapper input {
      padding-left: 3rem;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .input-highlight {
      border: 2px solid var(--primary);
      background: #fffbeb;
    }
    .quick-amounts {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }
    .btn-chip {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 999px;
      padding: 0.25rem 0.65rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-chip:hover {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }

    /* ARQUEO SUMMARY BOX */
    .arqueo-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
    }
    .summary-box-title {
      font-size: 0.9rem;
      font-weight: 700;
      margin: 0 0 0.75rem 0;
      color: var(--text-main);
    }
    .summary-rows {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-main);
    }
    .total-expected-row {
      font-size: 0.95rem;
      padding-top: 0.35rem;
      margin-top: 0.25rem;
      border-top: 1px dashed #cbd5e1;
    }
    .summary-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.35rem 0;
    }
    .summary-grand-total {
      font-size: 0.95rem;
      font-weight: 700;
      padding-top: 0.25rem;
      border-top: 1px solid #cbd5e1;
    }

    /* DIFERENCIA CARD */
    .diferencia-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 8px;
    }
    .dif-exacto { background: #dcfce7; border: 1px solid #86efac; color: #166534; }
    .dif-sobrante { background: #fef3c7; border: 1px solid #fde047; color: #92400e; }
    .dif-faltante { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }
    .diferencia-monto {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.85rem;
    }
    .diferencia-monto strong {
      font-size: 1.15rem;
    }

    /* ARQUEO DESGLOSADO */
    .section-subtitle {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 0.5rem;
    }
    .arqueo-block {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .arqueo-block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .block-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .badge-expected {
      font-size: 0.8rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .btn-xs {
      padding: 0.2rem 0.55rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 4px;
    }
    .balance-global-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-top: 0.75rem;
      border-width: 2px;
    }
    .balance-global-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .balance-global-monto {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .ticket-section-title {
      text-align: center;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #57534e;
    }
    .ticket-divider-sm {
      height: 1px;
      border-top: 1px dotted #d6d3d1;
      margin: 0.4rem 0;
    }

    /* TICKET ARQUEO MODAL */
    .ticket-arqueo {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 1.25rem;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .ticket-header-arqueo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .ticket-header-arqueo h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
    }
    .ticket-section {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .ticket-row {
      display: flex;
      justify-content: space-between;
    }
    .ticket-row.highlight-row {
      font-weight: 700;
      font-size: 0.95rem;
      border-top: 1px dashed #d6d3d1;
      padding-top: 0.25rem;
      margin-top: 0.25rem;
    }
    .ticket-divider {
      height: 1px;
      border-top: 1px dashed #d6d3d1;
      margin: 0.75rem 0;
    }
    .arqueo-final {
      background: #f5f5f4;
      padding: 0.5rem;
      border-radius: 4px;
    }
    .diferencia-row {
      font-size: 1rem;
      margin-top: 0.25rem;
      padding-top: 0.25rem;
      border-top: 1px solid #e7e5e4;
    }
    .ticket-notes {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #d6d3d1;
      font-size: 0.8rem;
      color: #57534e;
    }

    .text-green { color: #16a34a; }
    .text-emerald { color: #059669; }
    .text-red { color: #dc2626; }
    .text-amber { color: #d97706; }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .space-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .p-0 { padding: 0 !important; }
    .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .m-0 { margin: 0; }
    .small { font-size: 0.75rem; }
    .table-responsive { overflow-x: auto; }
    .btn-disabled-lock {
      opacity: 0.85;
      cursor: not-allowed !important;
      border: 1px dashed var(--border-color, #cbd5e1);
      background: var(--bg-subtle, #f1f5f9) !important;
      color: var(--text-muted, #64748b) !important;
    }
    .caja-aviso-titular {
      margin-top: 0.75rem;
      padding: 0.5rem 0.85rem;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 6px;
      font-size: 0.8125rem;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* MONITOR MULTI-CAJA */
    .multi-caja-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }
    .cajas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    .caja-live-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }
    .caja-live-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .caja-live-card.es-mi-caja {
      background: #f0fdf4;
      border-color: #86efac;
    }
    .caja-live-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .caja-cajero-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .avatar-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--primary, #0284c7);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .caja-live-body {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.825rem;
    }
    .caja-live-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .caja-live-footer {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
      padding-top: 0.5rem;
      border-top: 1px dashed #e2e8f0;
    }
    .flex-1 {
      flex: 1;
    }
    .justify-center {
      justify-content: center;
    }
    .ml-2 {
      margin-left: 0.5rem;
    }
    .caja-aviso-cierre-supervisor {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.85rem;
    }
  `]
})
export class CajaComponent implements OnInit {
  public readonly cajaService = inject(CajaService);
  private readonly toast = inject(ToastService);
  public readonly authService = inject(AuthService);

  // Modales
  public readonly modalAperturaAbierto = signal<boolean>(false);
  public readonly modalCierreAbierto = signal<boolean>(false);
  public readonly modalDetalleAbierto = signal<boolean>(false);

  // Formularios
  public aperturaData = {
    montoInicial: 100000,
    observaciones: ''
  };

  public cierreData = {
    montoRealEfectivo: null as number | null,
    montoRealTarjeta: null as number | null,
    montoRealTransferenciaQr: null as number | null,
    observaciones: ''
  };

  public sesionSeleccionada: SesionCaja | null = null;
  public diferenciaCalculada = signal<number>(0);
  public diferenciaTarjetaCalculada = signal<number>(0);
  public diferenciaQrCalculada = signal<number>(0);
  public diferenciaTotalCalculada = signal<number>(0);

  // Target específico de cierre (para cuando un supervisor cierra otra caja)
  public readonly cajaCierreTarget = signal<SesionCaja | null>(null);
  public readonly resumenCierreTarget = signal<any>(null);

  public readonly totalTarjetas = computed(() => {
    const res = this.cajaService.resumenCaja();
    if (!res) return 0;
    return (res.totalTarjetaDebito || 0) + (res.totalTarjetaCredito || 0);
  });

  public readonly puedeCerrarCaja = computed(() => {
    if (!this.cajaService.cajaAbierta()) return false;
    if (this.authService.isAdminOrOwner()) return true;
    const cajeroApertura = (this.cajaService.cajeroActivo() || '').trim().toLowerCase();
    const usuarioActual = (this.authService.username() || '').trim().toLowerCase();
    return !!cajeroApertura && cajeroApertura === usuarioActual;
  });

  puedeCerrarSesion(sesion: SesionCaja): boolean {
    if (this.authService.isAdminOrOwner()) return true;
    const cajeroApertura = (sesion.usuarioApertura || '').trim().toLowerCase();
    const usuarioActual = (this.authService.username() || '').trim().toLowerCase();
    return !!cajeroApertura && cajeroApertura === usuarioActual;
  }

  ngOnInit(): void {
    this.refrescar();
  }

  refrescar(): void {
    this.cajaService.cargarEstado().subscribe();
    this.cajaService.cargarHistorial().subscribe();
    this.cajaService.cargarCajasAbiertas().subscribe();
  }

  // --- APERTURA ---
  abrirModalApertura(): void {
    this.aperturaData = {
      montoInicial: 100000,
      observaciones: ''
    };
    this.modalAperturaAbierto.set(true);
  }

  cerrarModalApertura(): void {
    this.modalAperturaAbierto.set(false);
  }

  setMontoInicial(monto: number): void {
    this.aperturaData.montoInicial = monto;
  }

  confirmarApertura(): void {
    if (this.aperturaData.montoInicial < 0) {
      this.toast.warning('El monto inicial no puede ser negativo.');
      return;
    }

    this.cajaService.abrirCaja({
      montoInicial: this.aperturaData.montoInicial,
      observaciones: this.aperturaData.observaciones
    }).subscribe({
      next: (sesion) => {
        this.toast.success(`Caja abierta exitosamente (Sesión #${sesion.id}).`);
        this.cerrarModalApertura();
        this.refrescar();
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.error || 'Error al abrir la caja.';
        this.toast.error(msg, 'Error de Apertura');
      }
    });
  }

  // --- CIERRE Y ARQUEO ---
  abrirModalCierre(sesion?: SesionCaja): void {
    if (sesion) {
      if (!this.puedeCerrarSesion(sesion)) {
        this.mostrarAdvertenciaPermisoCierre(sesion.usuarioApertura);
        return;
      }
      this.cajaCierreTarget.set(sesion);
      this.cajaService.cargarResumen(sesion.id).subscribe({
        next: (resumen) => {
          this.resumenCierreTarget.set(resumen);
          this.cierreData = {
            montoRealEfectivo: null,
            montoRealTarjeta: null,
            montoRealTransferenciaQr: null,
            observaciones: ''
          };
          this.diferenciaCalculada.set(0);
          this.diferenciaTarjetaCalculada.set(0);
          this.diferenciaQrCalculada.set(0);
          this.diferenciaTotalCalculada.set(0);
          this.modalCierreAbierto.set(true);
        },
        error: () => {
          this.toast.error('No se pudo cargar el resumen de la caja seleccionada.');
        }
      });
    } else {
      if (!this.puedeCerrarCaja()) {
        this.mostrarAdvertenciaPermisoCierre();
        return;
      }
      this.cajaCierreTarget.set(null);
      this.cajaService.cargarResumen().subscribe({
        next: (resumen) => {
          this.resumenCierreTarget.set(resumen);
          this.cierreData = {
            montoRealEfectivo: null,
            montoRealTarjeta: null,
            montoRealTransferenciaQr: null,
            observaciones: ''
          };
          this.diferenciaCalculada.set(0);
          this.diferenciaTarjetaCalculada.set(0);
          this.diferenciaQrCalculada.set(0);
          this.diferenciaTotalCalculada.set(0);
          this.modalCierreAbierto.set(true);
        },
        error: () => {
          this.toast.error('No se pudo cargar el resumen de la caja.');
        }
      });
    }
  }

  mostrarAdvertenciaPermisoCierre(cajeroNombre?: string): void {
    const cajero = cajeroNombre || this.cajaService.cajeroActivo() || 'el cajero titular';
    this.toast.warning(
      `Esta caja fue abierta por "${cajero}". Solo dicho usuario o un Administrador/Supervisor pueden realizar el arqueo y cierre.`,
      'Acción no permitida'
    );
  }

  cerrarModalCierre(): void {
    this.modalCierreAbierto.set(false);
    this.cajaCierreTarget.set(null);
    this.resumenCierreTarget.set(null);
  }

  calcularDiferencia(): void {
    const resumen = this.resumenCierreTarget() || this.cajaService.resumenCaja();
    const esperadoEfectivo = resumen?.totalEsperadoEfectivo ?? 0;
    const realEfectivo = this.cierreData.montoRealEfectivo ?? 0;
    const difEfectivo = realEfectivo - esperadoEfectivo;
    this.diferenciaCalculada.set(difEfectivo);

    const esperadoTarjeta = (resumen?.totalTarjetaDebito ?? 0) + (resumen?.totalTarjetaCredito ?? 0);
    const realTarjeta = this.cierreData.montoRealTarjeta !== null && this.cierreData.montoRealTarjeta !== undefined
      ? this.cierreData.montoRealTarjeta
      : esperadoTarjeta;
    const difTarjeta = realTarjeta - esperadoTarjeta;
    this.diferenciaTarjetaCalculada.set(difTarjeta);

    const esperadoQr = resumen?.totalTransferenciaQr ?? 0;
    const realQr = this.cierreData.montoRealTransferenciaQr !== null && this.cierreData.montoRealTransferenciaQr !== undefined
      ? this.cierreData.montoRealTransferenciaQr
      : esperadoQr;
    const difQr = realQr - esperadoQr;
    this.diferenciaQrCalculada.set(difQr);

    this.diferenciaTotalCalculada.set(difEfectivo + difTarjeta + difQr);
  }

  coincidirVouchers(): void {
    const resumen = this.resumenCierreTarget() || this.cajaService.resumenCaja();
    const esperadoTarjeta = (resumen?.totalTarjetaDebito ?? 0) + (resumen?.totalTarjetaCredito ?? 0);
    this.cierreData.montoRealTarjeta = esperadoTarjeta;
    this.calcularDiferencia();
  }

  coincidirQr(): void {
    const resumen = this.resumenCierreTarget() || this.cajaService.resumenCaja();
    const esperadoQr = resumen?.totalTransferenciaQr ?? 0;
    this.cierreData.montoRealTransferenciaQr = esperadoQr;
    this.calcularDiferencia();
  }

  getDiferenciaCardClass(dif: number = this.diferenciaCalculada()): string {
    if (dif === 0) return 'dif-exacto';
    if (dif > 0) return 'dif-sobrante';
    return 'dif-faltante';
  }

  getDiferenciaTitulo(dif: number = this.diferenciaCalculada()): string {
    if (dif === 0) return 'Cuadre Exacto';
    if (dif > 0) return 'Sobrante';
    return 'Faltante';
  }

  getDiferenciaMensaje(dif: number = this.diferenciaCalculada(), medio: string = 'Efectivo'): string {
    if (dif === 0) return `El monto de ${medio} coincide exactamente con lo registrado.`;
    if (dif > 0) return `Existe más dinero en ${medio} que el registrado por el sistema.`;
    return `Atención: Falta dinero en ${medio} respecto al total esperado.`;
  }

  getDiferenciaTextColor(dif: number | null | undefined): string {
    if (!dif) return 'text-green';
    if (dif > 0) return 'text-amber';
    return 'text-red';
  }

  confirmarCierre(): void {
    const target = this.cajaCierreTarget();
    if (target) {
      if (!this.puedeCerrarSesion(target)) {
        this.mostrarAdvertenciaPermisoCierre(target.usuarioApertura);
        return;
      }
    } else {
      if (!this.puedeCerrarCaja()) {
        this.mostrarAdvertenciaPermisoCierre();
        return;
      }
    }

    if (this.cierreData.montoRealEfectivo === null || this.cierreData.montoRealEfectivo < 0) {
      this.toast.warning('Ingresa el monto de efectivo físico contado.');
      return;
    }

    const targetId = target ? target.id : (this.cajaService.sesionActivaId() ?? undefined);

    this.cajaService.cerrarCaja({
      montoRealEfectivo: this.cierreData.montoRealEfectivo,
      montoRealTarjeta: this.cierreData.montoRealTarjeta,
      montoRealTransferenciaQr: this.cierreData.montoRealTransferenciaQr,
      observaciones: this.cierreData.observaciones,
      sesionId: targetId
    }).subscribe({
      next: (sesion) => {
        const usuarioMsg = target ? ` de ${target.usuarioApertura}` : '';
        this.toast.success(`Caja${usuarioMsg} cerrada exitosamente (Sesión #${sesion.id}). Arqueo completado.`);
        this.cerrarModalCierre();
        this.refrescar();
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.error || 'Error al cerrar la caja.';
        this.toast.error(msg, 'Error de Cierre');
      }
    });
  }

  // --- DETALLE ---
  verDetalleSesion(sesion: SesionCaja): void {
    if (sesion.estado === 'ABIERTA') {
      this.cajaService.cargarResumen(sesion.id).subscribe({
        next: (resumen) => {
          this.sesionSeleccionada = {
            ...sesion,
            totalVentasGeneral: resumen.totalVentas,
            totalVentasEfectivo: resumen.totalEfectivo,
            totalVentasTarjetaDebito: resumen.totalTarjetaDebito,
            totalVentasTarjetaCredito: resumen.totalTarjetaCredito,
            totalVentasTransferenciaQr: resumen.totalTransferenciaQr,
            montoEsperadoEfectivo: resumen.totalEsperadoEfectivo,
            cantidadPedidos: resumen.totalPedidos
          };
          this.modalDetalleAbierto.set(true);
        },
        error: () => {
          this.sesionSeleccionada = sesion;
          this.modalDetalleAbierto.set(true);
        }
      });
    } else {
      this.sesionSeleccionada = sesion;
      this.modalDetalleAbierto.set(true);
    }
  }

  cerrarModalDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.sesionSeleccionada = null;
  }
}
