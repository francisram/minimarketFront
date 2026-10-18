import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ComprasService } from '../../core/services/compras.service';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { ProductosService } from '../../core/services/productos.service';
import { ToastService } from '../../core/services/toast.service';
import { Compra, DetalleCompra, RegistroCompraRequest, RegistroDetalleCompraRequest, CondicionCompra, EstadoCompra } from '../../core/models/compra.model';
import { Producto, TipoIva } from '../../core/models/producto.model';
import { Proveedor } from '../../core/models/proveedor.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';

interface ItemFormCompra {
  productoId: number;
  productoNombre: string;
  codigoBarra?: string | null;
  unidadMedida?: string | null;
  cantidad: number;
  costoUnitario: number;
  tipoIva: TipoIva;
  subtotal: number;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent, AppCurrencyPipe],
  template: `
    <div class="compras-page">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Facturas de Compra & Ingreso a Stock</h1>
          <p class="page-subtitle">Registro de comprobantes de proveedores, ingreso de mercadería a inventario y liquidación de IVA</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="abrirModalNuevaCompra()">
            <app-icon name="plus" [size]="18" />
            <span>+ Registrar Factura de Compra</span>
          </button>
        </div>
      </div>

      <!-- MÉTRICAS DE COMPRAS -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon metric-purple">
            <app-icon name="file-text" [size]="22" />
          </div>
          <div class="metric-info">
            <span class="metric-label">Total en Compras (Gs.)</span>
            <span class="metric-value">{{ totalAcumuladoCompras() | appCurrency }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-blue">
            <app-icon name="truck" [size]="22" />
          </div>
          <div class="metric-info">
            <span class="metric-label">Facturas Registradas</span>
            <span class="metric-value">{{ totalFacturasActivas() }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-amber">
            <app-icon name="credit-card" [size]="22" />
          </div>
          <div class="metric-info">
            <span class="metric-label">Facturas a Crédito</span>
            <span class="metric-value">{{ totalFacturasCredito() }}</span>
          </div>
        </div>
      </div>

      <!-- BARRA DE FILTROS -->
      <div class="filters-card">
        <div class="search-box">
          <app-icon name="search" [size]="18" />
          <input
            type="text"
            placeholder="Buscar por N° Factura, Timbrado o Razón Social de Proveedor..."
            [ngModel]="filtroBuscar()"
            (ngModelChange)="filtroBuscar.set($event)"
          />
          @if (filtroBuscar()) {
            <button class="btn-clear" (click)="filtroBuscar.set('')">✕</button>
          }
        </div>

        <div class="filters-group">
          <select [ngModel]="filtroProveedorId()" (ngModelChange)="filtroProveedorId.set($event)" class="filter-select">
            <option value="TODOS">Todos los Proveedores</option>
            @for (p of proveedoresService.proveedores(); track p.id) {
              <option [value]="p.id">{{ p.razonSocial }} ({{ p.ruc }})</option>
            }
          </select>

          <select [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event)" class="filter-select">
            <option value="TODOS">Todos los Estados</option>
            <option value="REGISTRADA">Registradas</option>
            <option value="ANULADA">Anuladas</option>
          </select>

          <select [ngModel]="filtroCondicion()" (ngModelChange)="filtroCondicion.set($event)" class="filter-select">
            <option value="TODOS">Todas las Condiciones</option>
            <option value="CONTADO">Contado</option>
            <option value="CREDITO">Crédito</option>
          </select>

          @if (filtroBuscar() || filtroProveedorId() !== 'TODOS' || filtroEstado() !== 'TODOS' || filtroCondicion() !== 'TODOS') {
            <button class="btn btn-secondary btn-sm" (click)="limpiarFiltros()">Limpiar</button>
          }
        </div>
      </div>

      <!-- TABLA DE FACTURAS -->
      <div class="table-container">
        @if (comprasService.cargando()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <span>Cargando facturas de compra...</span>
          </div>
        } @else if (comprasFiltradas().length === 0) {
          <div class="empty-state">
            <app-icon name="file-text" [size]="48" />
            <p class="empty-title">No se encontraron facturas de compra</p>
            <p class="empty-subtitle">Registra las compras de mercadería a tus proveedores para aumentar existencias y llevar el control contable.</p>
            <button class="btn btn-primary" (click)="abrirModalNuevaCompra()">+ Registrar Primera Compra</button>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Emisión</th>
                <th>N° Factura</th>
                <th>Timbrado</th>
                <th>Proveedor</th>
                <th>Condición</th>
                <th>Total Factura</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (compra of comprasFiltradas(); track compra.id) {
                <tr [class.row-anulada]="compra.estado === 'ANULADA'">
                  <td>
                    <div class="font-medium">{{ compra.fechaEmision | date:'dd/MM/yyyy' }}</div>
                    @if (compra.fechaVencimiento && compra.condicionCompra === 'CREDITO') {
                      <div class="text-xs text-muted">Vence: {{ compra.fechaVencimiento | date:'dd/MM/yyyy' }}</div>
                    }
                  </td>
                  <td>
                    <span class="font-mono font-bold">{{ compra.numeroFactura }}</span>
                  </td>
                  <td>
                    <span class="font-mono text-xs">{{ compra.timbrado || '-' }}</span>
                  </td>
                  <td>
                    <div class="font-medium">{{ compra.proveedorRazonSocial }}</div>
                    <span class="badge-ruc">{{ compra.proveedorRuc }}</span>
                  </td>
                  <td>
                    <span class="badge-condicion" [class.badge-contado]="compra.condicionCompra === 'CONTADO'" [class.badge-credito]="compra.condicionCompra === 'CREDITO'">
                      {{ compra.condicionCompra }}
                    </span>
                  </td>
                  <td>
                    <span class="font-bold text-lg text-primary">{{ compra.total | appCurrency }}</span>
                  </td>
                  <td>
                    <span class="badge-estado" [class.badge-registrada]="compra.estado === 'REGISTRADA'" [class.badge-anulada]="compra.estado === 'ANULADA'">
                      {{ compra.estado }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="actions-group">
                      <button class="btn-action" title="Ver Detalle de Factura" (click)="verDetalleCompra(compra)">
                        <app-icon name="eye" [size]="16" />
                      </button>
                      @if (compra.estado === 'REGISTRADA') {
                        <button class="btn-action btn-danger" title="Anular Factura y Revertir Stock" (click)="confirmarAnularCompra(compra)">
                          <app-icon name="trash" [size]="16" />
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    <!-- MODAL DETALLE DE FACTURA -->
    @if (modalDetalleAbierto()) {
      <app-modal
        [isOpen]="modalDetalleAbierto()"
        [title]="'Detalle Factura N° ' + (compraSeleccionada()?.numeroFactura || '')"
        size="lg"
        (close)="modalDetalleAbierto.set(false)"
      >
        @if (compraSeleccionada(); as c) {
          <div body class="modal-body-content">
            <!-- CABECERA DE FACTURA -->
            <div class="factura-header-box">
              <div class="factura-header-row">
                <div>
                  <span class="info-label">Proveedor:</span>
                  <span class="info-value font-bold">{{ c.proveedorRazonSocial }}</span>
                  <span class="badge-ruc ml-2">{{ c.proveedorRuc }}</span>
                </div>
                <div>
                  <span class="badge-estado" [class.badge-registrada]="c.estado === 'REGISTRADA'" [class.badge-anulada]="c.estado === 'ANULADA'">
                    {{ c.estado }}
                  </span>
                </div>
              </div>

              <div class="factura-header-grid">
                <div>
                  <span class="info-label">Timbrado:</span>
                  <span class="info-value font-mono">{{ c.timbrado || '-' }}</span>
                </div>
                <div>
                  <span class="info-label">Fecha Emisión:</span>
                  <span class="info-value">{{ c.fechaEmision | date:'dd/MM/yyyy' }}</span>
                </div>
                <div>
                  <span class="info-label">Condición:</span>
                  <span class="info-value">{{ c.condicionCompra }}</span>
                </div>
                <div>
                  <span class="info-label">Registrado por:</span>
                  <span class="info-value">{{ c.usuario || 'Sistema' }}</span>
                </div>
              </div>

              @if (c.observacion) {
                <div class="factura-observacion">
                  <strong>Observaciones:</strong> {{ c.observacion }}
                </div>
              }
            </div>

            <!-- TABLA DE ITEMS COMPRADOS -->
            <div class="table-container-sm">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Cant.</th>
                    <th>Costo Unitario</th>
                    <th>IVA</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of c.detalles; track d.id) {
                    <tr>
                      <td>
                        <div class="font-medium">{{ d.productoNombre }}</div>
                        @if (d.codigoBarra) {
                          <div class="text-xs text-muted font-mono">{{ d.codigoBarra }}</div>
                        }
                      </td>
                      <td>{{ d.cantidad }} {{ d.unidadMedida || 'UNID' }}</td>
                      <td>{{ d.costoUnitario | appCurrency }}</td>
                      <td><span class="badge-iva">{{ d.tipoIva }}</span></td>
                      <td class="text-right font-bold">{{ d.subtotal | appCurrency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- LIQUIDACIÓN DE TOTALES E IVA -->
            <div class="totales-breakdown-card">
              <div class="totales-col">
                <div class="total-row"><span>Total Gravadas 10%:</span> <span>{{ (c.totalIva10 * 10) | appCurrency }}</span></div>
                <div class="total-row"><span>Liquidación IVA 10%:</span> <span>{{ c.totalIva10 | appCurrency }}</span></div>
              </div>
              <div class="totales-col">
                <div class="total-row"><span>Total Gravadas 5%:</span> <span>{{ (c.totalIva5 * 20) | appCurrency }}</span></div>
                <div class="total-row"><span>Liquidación IVA 5%:</span> <span>{{ c.totalIva5 | appCurrency }}</span></div>
              </div>
              <div class="totales-col">
                <div class="total-row"><span>Total Exentas:</span> <span>{{ c.totalExenta | appCurrency }}</span></div>
                <div class="total-row total-row-final">
                  <span>TOTAL FACTURA:</span>
                  <span class="text-primary font-bold text-xl">{{ c.total | appCurrency }}</span>
                </div>
              </div>
            </div>
          </div>

          <div footer class="modal-actions-footer">
            <button type="button" class="btn btn-secondary" (click)="modalDetalleAbierto.set(false)">
              Cerrar
            </button>
            @if (c.estado === 'REGISTRADA') {
              <button type="button" class="btn btn-outline-danger" (click)="confirmarAnularCompra(c)">
                <app-icon name="trash" [size]="14" />
                <span>Anular Factura</span>
              </button>
            }
          </div>
        }
      </app-modal>
    }

    <!-- MODAL REGISTRO DE NUEVA COMPRA -->
    @if (modalNuevaCompraAbierto()) {
      <app-modal
        [isOpen]="modalNuevaCompraAbierto()"
        title="Registrar Factura de Compra de Proveedor"
        size="xl"
        (close)="cerrarModalNuevaCompra()"
      >
        <div body class="modal-form-content">
          <!-- CABECERA -->
          <div class="section-title">1. Datos del Comprobante</div>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="compraProveedor">Proveedor *</label>
              <select id="compraProveedor" class="form-control" [(ngModel)]="formNuevaCompra.proveedorId">
                <option [ngValue]="null" disabled>-- Selecciona un proveedor --</option>
                @for (p of proveedoresService.proveedores(); track p.id) {
                  <option [ngValue]="p.id">{{ p.razonSocial }} (RUC: {{ p.ruc }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="compraFactura">N° Factura *</label>
              <input
                id="compraFactura"
                type="text"
                class="form-control font-mono"
                placeholder="001-001-0001234"
                [(ngModel)]="formNuevaCompra.numeroFactura"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="compraTimbrado">N° Timbrado</label>
              <input
                id="compraTimbrado"
                type="text"
                maxlength="8"
                class="form-control font-mono"
                placeholder="12345678"
                [(ngModel)]="formNuevaCompra.timbrado"
              />
            </div>
          </div>

          <div class="form-grid-3 mt-3">
            <div class="form-group">
              <label class="form-label" for="compraFechaEmision">Fecha de Emisión *</label>
              <input
                id="compraFechaEmision"
                type="date"
                class="form-control"
                [(ngModel)]="formNuevaCompra.fechaEmision"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="compraCondicion">Condición de Pago *</label>
              <select id="compraCondicion" class="form-control" [(ngModel)]="formNuevaCompra.condicionCompra">
                <option value="CONTADO">Contado</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>

            @if (formNuevaCompra.condicionCompra === 'CREDITO') {
              <div class="form-group">
                <label class="form-label" for="compraFechaVenc">Fecha de Vencimiento</label>
                <input
                  id="compraFechaVenc"
                  type="date"
                  class="form-control"
                  [(ngModel)]="formNuevaCompra.fechaVencimiento"
                />
              </div>
            } @else {
              <div class="form-group">
                <label class="form-label" for="compraObservacion">Notas u Observaciones</label>
                <input
                  id="compraObservacion"
                  type="text"
                  class="form-control"
                  placeholder="Remisión, referencia de pago, etc."
                  [(ngModel)]="formNuevaCompra.observacion"
                />
              </div>
            }
          </div>

          <hr class="form-divider" />

          <!-- SELECCIONAR ARTÍCULO -->
          <div class="section-title">2. Agregar Artículos a la Factura</div>
          <div class="item-builder-card">
            <!-- BUSCADOR / ESCÁNER POR CÓDIGO DE BARRA -->
            <div class="barcode-scanner-bar mb-3">
              <div class="scanner-box">
                <app-icon name="scan-barcode" [size]="18" extraClass="scanner-icon" />
                <input
                  id="barcodeInputCompra"
                  type="text"
                  class="scanner-input font-mono"
                  placeholder="Escanear con pistola lectora o escribir código de barra [Enter]..."
                  [(ngModel)]="codigoBarraInput"
                  (keydown.enter)="buscarPorCodigoBarra($event)"
                />
                @if (codigoBarraInput) {
                  <button type="button" class="btn-clear-barcode" (click)="limpiarCodigoBarra()" title="Limpiar">
                    <app-icon name="x" [size]="14" />
                  </button>
                }
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                (click)="buscarPorCodigoBarra()"
                title="Buscar artículo por código de barra"
              >
                <app-icon name="search" [size]="14" />
                <span>Buscar</span>
              </button>
            </div>

            <div class="form-grid-4">
              <div class="form-group span-2">
                <label class="form-label" for="itemSelectProducto">Artículo del Catálogo Maestro *</label>
                <select
                  id="itemSelectProducto"
                  class="form-control"
                  [ngModel]="itemEnCarga.productoId"
                  (ngModelChange)="onProductoSeleccionadoChange($event)"
                >
                  <option [ngValue]="null" disabled>-- Busca o selecciona un artículo --</option>
                  @for (prod of productosService.productos(); track prod.id) {
                    <option [ngValue]="prod.id">
                      [{{ prod.tipoArticulo }}] {{ prod.nombre }} @if (prod.codigoBarra) { ({{ prod.codigoBarra }}) }
                    </option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="itemCantidad">Cantidad *</label>
                <input
                  id="itemCantidad"
                  type="number"
                  step="0.5"
                  min="0.01"
                  class="form-control font-bold"
                  [(ngModel)]="itemEnCarga.cantidad"
                  (keydown.enter)="agregarItemALaFactura()"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="itemCostoUnitario">Costo Unit. (Gs.) *</label>
                <input
                  id="itemCostoUnitario"
                  type="number"
                  step="500"
                  min="0"
                  class="form-control font-bold"
                  [(ngModel)]="itemEnCarga.costoUnitario"
                  (keydown.enter)="agregarItemALaFactura()"
                />
              </div>
            </div>

            <div class="d-flex justify-content-between align-center mt-3">
              <div class="d-flex align-center gap-3">
                <label class="form-label m-0">Tipo IVA:</label>
                <label class="radio-label">
                  <input type="radio" name="tipoIvaItem" value="IVA_10" [(ngModel)]="itemEnCarga.tipoIva" />
                  IVA 10%
                </label>
                <label class="radio-label">
                  <input type="radio" name="tipoIvaItem" value="IVA_5" [(ngModel)]="itemEnCarga.tipoIva" />
                  IVA 5%
                </label>
                <label class="radio-label">
                  <input type="radio" name="tipoIvaItem" value="EXENTA" [(ngModel)]="itemEnCarga.tipoIva" />
                  Exenta
                </label>
              </div>

              <button type="button" class="btn btn-secondary btn-sm" (click)="agregarItemALaFactura()">
                <app-icon name="plus" [size]="16" />
                <span>+ Agregar Línea</span>
              </button>
            </div>
          </div>

          <!-- LISTA DE ITEMS CARGADOS -->
          @if (itemsCargados().length > 0) {
            <div class="table-container-sm mt-3">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Cant.</th>
                    <th>Costo Unitario</th>
                    <th>IVA</th>
                    <th class="text-right">Subtotal</th>
                    <th class="text-right">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  @for (it of itemsCargados(); track $index) {
                    <tr>
                      <td>
                        <span class="font-medium">{{ it.productoNombre }}</span>
                      </td>
                      <td>{{ it.cantidad }} {{ it.unidadMedida || 'UNID' }}</td>
                      <td>{{ it.costoUnitario | appCurrency }}</td>
                      <td><span class="badge-iva">{{ it.tipoIva }}</span></td>
                      <td class="text-right font-bold">{{ it.subtotal | appCurrency }}</td>
                      <td class="text-right">
                        <button class="btn-action btn-danger" (click)="quitarItemDeLaFactura($index)">
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- TOTALES -->
            <div class="totales-summary-card">
              <div class="d-flex justify-content-between align-center">
                <div class="text-xs text-muted">
                  * Al confirmar el registro, el stock de estos artículos aumentará automáticamente en el sistema y se generará el movimiento en Kardex.
                </div>
                <div class="total-box">
                  <span class="total-label">TOTAL FACTURA:</span>
                  <span class="total-number">{{ totalFacturaCalculado() | appCurrency }}</span>
                </div>
              </div>
            </div>
          }

        </div>

        <div footer class="modal-actions-footer">
          <button type="button" class="btn btn-secondary" (click)="cerrarModalNuevaCompra()">Cancelar</button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="guardandoCompra()"
            (click)="guardarFacturaCompra()"
          >
            @if (guardandoCompra()) {
              <span class="spinner-sm"></span> Guardando e Ingresando Stock...
            } @else {
              <app-icon name="check" [size]="16" />
              <span>Confirmar e Ingresar Stock</span>
            }
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    .compras-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
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
      color: var(--text-main, #0f172a);
      margin: 0;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      margin-top: 0.25rem;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: var(--surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .metric-purple { background: #f3e8ff; color: #7e22ce; }
    .metric-blue { background: #e0f2fe; color: #0284c7; }
    .metric-amber { background: #fef3c7; color: #b45309; }
    .metric-info {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      font-weight: 500;
    }
    .metric-value {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
    }

    .filters-card {
      background: var(--surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
      display: flex;
      align-items: center;
    }
    .search-box app-icon {
      position: absolute;
      left: 0.875rem;
      color: var(--text-muted, #94a3b8);
    }
    .search-box input {
      width: 100%;
      padding: 0.55rem 2.2rem 0.55rem 2.5rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: var(--bg-main, #f8fafc);
    }
    .btn-clear {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }
    .filters-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .filter-select {
      padding: 0.55rem 0.875rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: var(--surface, #ffffff);
      color: var(--text-main, #0f172a);
    }

    .table-container {
      background: var(--surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .table-container-sm {
      background: var(--surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .data-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
    }
    .row-anulada td {
      opacity: 0.6;
      background: #fef2f2;
    }
    .badge-ruc {
      display: inline-block;
      font-family: monospace;
      font-size: 0.75rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }
    .badge-condicion {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }
    .badge-contado { background: #e0f2fe; color: #0369a1; }
    .badge-credito { background: #fef3c7; color: #b45309; }
    .badge-estado {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }
    .badge-registrada { background: #dcfce7; color: #15803d; }
    .badge-anulada { background: #fee2e2; color: #b91c1c; }
    .badge-iva {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
    }
    .actions-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
    }
    .btn-action {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 0.375rem;
      padding: 0.35rem;
      color: #475569;
      cursor: pointer;
      transition: all 0.1s;
    }
    .btn-action:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-action.btn-danger:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
    }

    /* DETALLE MODAL */
    .factura-header-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .factura-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .factura-header-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
    }
    .info-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-right: 0.35rem;
    }
    .info-value {
      font-size: 0.875rem;
      color: #0f172a;
    }
    .factura-observacion {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #cbd5e1;
      font-size: 0.8125rem;
      color: #475569;
    }
    .totales-breakdown-card {
      display: grid;
      grid-template-columns: 1fr 1fr 1.2fr;
      gap: 1rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1rem;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: #475569;
      margin-bottom: 0.35rem;
    }
    .total-row-final {
      font-weight: 700;
      color: #0f172a;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #cbd5e1;
    }

    /* NUEVA COMPRA */
    .section-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      margin-bottom: 0.75rem;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.875rem;
    }
    .form-grid-4 {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr;
      gap: 0.875rem;
    }
    .span-2 { grid-column: span 1; }
    .form-divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 1.25rem 0;
    }
    .item-builder-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 1rem;
    }
    .radio-label {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .totales-summary-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 0.5rem;
      padding: 0.875rem 1rem;
      margin-top: 1rem;
    }
    .total-box {
      text-align: right;
    }
    .total-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #15803d;
      margin-right: 0.5rem;
    }
    .total-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: #15803d;
    }
    .modal-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    /* ESCÁNER CÓDIGO DE BARRA */
    .barcode-scanner-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .scanner-box {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
    }
    .scanner-icon {
      position: absolute;
      left: 0.75rem;
      color: #0284c7;
      pointer-events: none;
    }
    .scanner-input {
      width: 100%;
      padding: 0.55rem 2rem 0.55rem 2.4rem;
      border-radius: 0.5rem;
      border: 1.5px solid #0284c7;
      background: #f0f9ff;
      font-size: 0.875rem;
      font-weight: 500;
      color: #0f172a;
      outline: none;
      transition: all 0.2s;
    }
    .scanner-input:focus {
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
    }
    .btn-clear-barcode {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
    }
    .btn-clear-barcode:hover {
      color: #0f172a;
    }

    /* COMUNES */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-primary { background: #0284c7; color: #ffffff; }
    .btn-primary:hover { background: #0369a1; }
    .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-outline-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .btn-outline-danger:hover { background: #fee2e2; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8125rem; }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }
    .form-control {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background: #ffffff;
    }
    .text-primary { color: #0284c7; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .font-medium { font-weight: 500; }
    .text-xs { font-size: 0.75rem; }
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-muted { color: #64748b; }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .justify-content-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .ml-2 { margin-left: 0.5rem; }
    .m-0 { margin: 0; }
    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #64748b;
    }
    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .empty-subtitle {
      font-size: 0.875rem;
      max-width: 450px;
      margin: 0;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ComprasComponent implements OnInit {
  public readonly comprasService = inject(ComprasService);
  public readonly proveedoresService = inject(ProveedoresService);
  public readonly productosService = inject(ProductosService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  // Filtros
  public readonly filtroBuscar = signal<string>('');
  public readonly filtroProveedorId = signal<string>('TODOS');
  public readonly filtroEstado = signal<string>('TODOS');
  public readonly filtroCondicion = signal<string>('TODOS');

  // Modales
  public readonly modalDetalleAbierto = signal<boolean>(false);
  public readonly compraSeleccionada = signal<Compra | null>(null);

  public readonly modalNuevaCompraAbierto = signal<boolean>(false);
  public readonly guardandoCompra = signal<boolean>(false);

  // Formulario Nueva Compra
  public formNuevaCompra: {
    proveedorId: number | null;
    numeroFactura: string;
    timbrado: string;
    fechaEmision: string;
    fechaVencimiento: string;
    condicionCompra: CondicionCompra;
    observacion: string;
  } = this.getFormNuevaCompraInicial();

  // Item en edición/adición
  public itemEnCarga: {
    productoId: number | null;
    cantidad: number;
    costoUnitario: number;
    tipoIva: TipoIva;
  } = {
    productoId: null,
    cantidad: 1,
    costoUnitario: 0,
    tipoIva: 'IVA_10'
  };

  public readonly itemsCargados = signal<ItemFormCompra[]>([]);

  // Búsqueda rápida por código de barra / lector óptico
  public codigoBarraInput: string = '';

  // Computed métricas
  public readonly totalAcumuladoCompras = computed(() => {
    return this.comprasService.compras()
      .filter(c => c.estado === 'REGISTRADA')
      .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  });

  public readonly totalFacturasActivas = computed(() => {
    return this.comprasService.compras().filter(c => c.estado === 'REGISTRADA').length;
  });

  public readonly totalFacturasCredito = computed(() => {
    return this.comprasService.compras()
      .filter(c => c.estado === 'REGISTRADA' && c.condicionCompra === 'CREDITO').length;
  });

  public readonly totalFacturaCalculado = computed(() => {
    return this.itemsCargados().reduce((acc, curr) => acc + curr.subtotal, 0);
  });

  // Lista filtrada
  public readonly comprasFiltradas = computed(() => {
    let list = this.comprasService.compras();
    const buscar = this.filtroBuscar().trim().toLowerCase();
    const provId = this.filtroProveedorId();
    const estado = this.filtroEstado();
    const condicion = this.filtroCondicion();

    if (provId !== 'TODOS') {
      const pid = Number(provId);
      list = list.filter(c => c.proveedorId === pid);
    }
    if (estado !== 'TODOS') {
      list = list.filter(c => c.estado === estado);
    }
    if (condicion !== 'TODOS') {
      list = list.filter(c => c.condicionCompra === condicion);
    }
    if (buscar) {
      list = list.filter(c =>
        (c.numeroFactura && c.numeroFactura.toLowerCase().includes(buscar)) ||
        (c.timbrado && c.timbrado.toLowerCase().includes(buscar)) ||
        (c.proveedorRazonSocial && c.proveedorRazonSocial.toLowerCase().includes(buscar)) ||
        (c.proveedorRuc && c.proveedorRuc.toLowerCase().includes(buscar))
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.comprasService.cargarCompras();
    this.proveedoresService.cargarProveedores();
    this.productosService.cargarProductos();

    // Check si vino con parámetro ?proveedorId=X o ?accion=nueva
    this.route.queryParams.subscribe(params => {
      if (params['proveedorId'] || params['accion'] === 'nueva' || params['accion'] === 'crear') {
        const provId = params['proveedorId'] ? Number(params['proveedorId']) : undefined;
        this.abrirModalNuevaCompra(provId);
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroBuscar.set('');
    this.filtroProveedorId.set('TODOS');
    this.filtroEstado.set('TODOS');
    this.filtroCondicion.set('TODOS');
  }

  verDetalleCompra(compra: Compra): void {
    this.compraSeleccionada.set(compra);
    this.modalDetalleAbierto.set(true);
  }

  confirmarAnularCompra(compra: Compra): void {
    const motivo = prompt(`¿Deseas anular la factura N° ${compra.numeroFactura}? El stock de los artículos comprados será revertido automáticamente. Ingresa el motivo:`);
    if (motivo !== null) {
      this.comprasService.anularCompra(compra.id, motivo).subscribe();
    }
  }

  abrirModalNuevaCompra(proveedorIdInicial?: number): void {
    this.formNuevaCompra = this.getFormNuevaCompraInicial();
    if (proveedorIdInicial) {
      this.formNuevaCompra.proveedorId = proveedorIdInicial;
    }
    this.itemsCargados.set([]);
    this.itemEnCarga = {
      productoId: null,
      cantidad: 1,
      costoUnitario: 0,
      tipoIva: 'IVA_10'
    };
    this.codigoBarraInput = '';
    this.modalNuevaCompraAbierto.set(true);

    // Auto-focus en el campo de código de barra al abrir el modal
    setTimeout(() => {
      const barcodeInput = document.getElementById('barcodeInputCompra') as HTMLInputElement | null;
      if (barcodeInput) {
        barcodeInput.focus();
      }
    }, 150);
  }

  cerrarModalNuevaCompra(): void {
    this.modalNuevaCompraAbierto.set(false);
  }

  onProductoSeleccionadoChange(productoId: number): void {
    this.itemEnCarga.productoId = productoId;
    const prod = this.productosService.productos().find(p => p.id === productoId);
    if (prod) {
      this.codigoBarraInput = prod.codigoBarra || '';
      this.itemEnCarga.tipoIva = prod.tipoIva || 'IVA_10';
      // Buscar si el proveedor seleccionado tiene un costo pactado con este producto
      if (this.formNuevaCompra.proveedorId && prod.proveedores) {
        const vinculo = prod.proveedores.find(pv => pv.proveedorId === this.formNuevaCompra.proveedorId);
        if (vinculo && vinculo.costoCompra) {
          this.itemEnCarga.costoUnitario = vinculo.costoCompra;
          return;
        }
      }
      this.itemEnCarga.costoUnitario = prod.precioCosto || 0;
    }
  }

  buscarPorCodigoBarra(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const cod = (this.codigoBarraInput || '').trim();
    if (!cod) {
      this.toast.warning('Ingresa o escanea un código de barra.');
      return;
    }

    // 1. Buscar en memoria local de productos
    const prodLocal = this.productosService.productos().find(
      p => p.codigoBarra && p.codigoBarra.trim().toLowerCase() === cod.toLowerCase()
    );

    if (prodLocal) {
      this.seleccionarProductoEncontrado(prodLocal);
      return;
    }

    // 2. Si no se encontró en memoria, consultar al backend por código de barra
    this.productosService.buscarPorCodigoBarra(cod).subscribe({
      next: (prodRemoto) => {
        if (prodRemoto) {
          this.seleccionarProductoEncontrado(prodRemoto);
        } else {
          this.toast.error(`No se encontró ningún artículo con código: ${cod}`);
        }
      },
      error: () => {
        this.toast.error(`No se encontró ningún artículo con el código de barra "${cod}".`);
      }
    });
  }

  private seleccionarProductoEncontrado(prod: Producto): void {
    this.onProductoSeleccionadoChange(prod.id);
    this.codigoBarraInput = prod.codigoBarra || '';
    this.toast.success(`Artículo identificado: [${prod.tipoArticulo}] ${prod.nombre}`);

    // Enfocar automáticamente el campo de cantidad para carga rápida
    setTimeout(() => {
      const cantidadInput = document.getElementById('itemCantidad') as HTMLInputElement | null;
      if (cantidadInput) {
        cantidadInput.focus();
        cantidadInput.select();
      }
    }, 60);
  }

  limpiarCodigoBarra(): void {
    this.codigoBarraInput = '';
    const barcodeInput = document.getElementById('barcodeInputCompra') as HTMLInputElement | null;
    if (barcodeInput) {
      barcodeInput.focus();
    }
  }

  agregarItemALaFactura(): void {
    if (!this.itemEnCarga.productoId) {
      this.toast.warning('Selecciona o escanea un artículo del catálogo.');
      return;
    }
    if (!this.itemEnCarga.cantidad || this.itemEnCarga.cantidad <= 0) {
      this.toast.warning('Ingresa una cantidad mayor a cero.');
      return;
    }
    if (this.itemEnCarga.costoUnitario === null || this.itemEnCarga.costoUnitario < 0) {
      this.toast.warning('El costo unitario no puede ser negativo.');
      return;
    }

    const prod = this.productosService.productos().find(p => p.id === this.itemEnCarga.productoId);
    if (!prod) return;

    const subtotal = Math.round(this.itemEnCarga.cantidad * this.itemEnCarga.costoUnitario);

    const nuevoItem: ItemFormCompra = {
      productoId: prod.id,
      productoNombre: prod.nombre,
      codigoBarra: prod.codigoBarra,
      unidadMedida: prod.unidadMedida,
      cantidad: this.itemEnCarga.cantidad,
      costoUnitario: this.itemEnCarga.costoUnitario,
      tipoIva: this.itemEnCarga.tipoIva,
      subtotal
    };

    this.itemsCargados.update(list => [...list, nuevoItem]);

    // Reset item selector y campo de código de barra
    this.itemEnCarga = {
      productoId: null,
      cantidad: 1,
      costoUnitario: 0,
      tipoIva: 'IVA_10'
    };
    this.codigoBarraInput = '';

    // Re-enfocar el campo de código de barra para la siguiente lectura
    setTimeout(() => {
      const barcodeInput = document.getElementById('barcodeInputCompra') as HTMLInputElement | null;
      if (barcodeInput) {
        barcodeInput.focus();
      }
    }, 60);
  }

  quitarItemDeLaFactura(index: number): void {
    this.itemsCargados.update(list => list.filter((_, i) => i !== index));
  }

  guardarFacturaCompra(): void {
    if (!this.formNuevaCompra.proveedorId) {
      this.toast.warning('Selecciona el proveedor de la factura.');
      return;
    }
    if (!this.formNuevaCompra.numeroFactura || !this.formNuevaCompra.numeroFactura.trim()) {
      this.toast.warning('Ingresa el número de factura del proveedor.');
      return;
    }
    if (!this.formNuevaCompra.fechaEmision) {
      this.toast.warning('Ingresa la fecha de emisión de la factura.');
      return;
    }
    // Si el usuario seleccionó un artículo pero no presionó "+ Agregar Línea"
    if (this.itemEnCarga.productoId && this.itemEnCarga.cantidad > 0) {
      this.agregarItemALaFactura();
    }
    if (this.itemsCargados().length === 0) {
      this.toast.warning('Debes agregar al menos un artículo a la factura usando el botón "+ Agregar Línea".');
      return;
    }

    this.guardandoCompra.set(true);

    const payload: RegistroCompraRequest = {
      proveedorId: this.formNuevaCompra.proveedorId,
      numeroFactura: this.formNuevaCompra.numeroFactura.trim(),
      timbrado: this.formNuevaCompra.timbrado?.trim() || undefined,
      fechaEmision: this.formNuevaCompra.fechaEmision,
      fechaVencimiento: this.formNuevaCompra.condicionCompra === 'CREDITO' ? this.formNuevaCompra.fechaVencimiento : undefined,
      condicionCompra: this.formNuevaCompra.condicionCompra,
      observacion: this.formNuevaCompra.observacion?.trim() || undefined,
      detalles: this.itemsCargados().map(it => ({
        productoId: it.productoId,
        cantidad: it.cantidad,
        costoUnitario: it.costoUnitario,
        tipoIva: it.tipoIva
      }))
    };

    this.comprasService.registrarCompra(payload).subscribe({
      next: () => {
        this.guardandoCompra.set(false);
        this.modalNuevaCompraAbierto.set(false);
        // Refrescar inventario y productos por el nuevo stock
        this.productosService.cargarProductos();
      },
      error: (err) => {
        this.guardandoCompra.set(false);
        this.toast.error(err.error?.mensaje || 'Error al registrar la factura de compra.');
      }
    });
  }

  private getFormNuevaCompraInicial() {
    const hoy = new Date().toISOString().split('T')[0];
    return {
      proveedorId: null as number | null,
      numeroFactura: '',
      timbrado: '',
      fechaEmision: hoy,
      fechaVencimiento: hoy,
      condicionCompra: 'CONTADO' as CondicionCompra,
      observacion: ''
    };
  }
}
