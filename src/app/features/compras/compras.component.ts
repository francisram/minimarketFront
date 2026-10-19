import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ComprasService } from '../../core/services/compras.service';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { ProductosService } from '../../core/services/productos.service';
import { ReporteExportService } from '../../core/services/reporte-export.service';
import { ToastService } from '../../core/services/toast.service';
import { Compra, DetalleCompra, RegistroCompraRequest, RegistroDetalleCompraRequest, CondicionCompra, EstadoCompra } from '../../core/models/compra.model';
import { Producto, TipoIva, TipoArticulo, UnidadMedida, ProductoRequest } from '../../core/models/producto.model';
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

interface ItemSeleccionMultiple {
  producto: Producto;
  seleccionado: boolean;
  cantidad: number;
  costoUnitario: number;
  tipoIva: TipoIva;
  suministradoPorProveedor: boolean;
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
          <button class="btn btn-secondary" (click)="exportarCsv()" title="Exportar compras filtradas a CSV / Excel">
            <app-icon name="file-spreadsheet" [size]="18" />
            <span>Descargar CSV</span>
          </button>
          <button class="btn btn-secondary" (click)="exportarPdf()" title="Descargar compras filtradas en PDF (A4)">
            <app-icon name="file-text" [size]="18" />
            <span>Descargar PDF</span>
          </button>
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
        [closeOnBackdrop]="false"
        (close)="solicitarCerrarModalNuevaCompra()"
      >
        <div body class="modal-form-content">
          <!-- CABECERA -->
          <div class="section-title">1. Datos del Comprobante</div>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="compraProveedor">
                Proveedor <span class="text-danger font-bold">* Obligatorio</span>
              </label>
              <select
                id="compraProveedor"
                class="form-control"
                [class.is-invalid]="formSubmitted() && !formNuevaCompra.proveedorId"
                [(ngModel)]="formNuevaCompra.proveedorId"
              >
                <option [ngValue]="null" disabled>-- Selecciona un proveedor --</option>
                @for (p of proveedoresService.proveedores(); track p.id) {
                  <option [ngValue]="p.id">{{ p.razonSocial }} (RUC: {{ p.ruc }})</option>
                }
              </select>
              @if (formSubmitted() && !formNuevaCompra.proveedorId) {
                <span class="error-msg">Debes seleccionar el proveedor emisor.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="compraFactura">
                N° Factura <span class="text-danger font-bold">* Obligatorio</span>
              </label>
              <input
                id="compraFactura"
                type="text"
                class="form-control font-mono"
                [class.is-invalid]="formSubmitted() && (!formNuevaCompra.numeroFactura || !formNuevaCompra.numeroFactura.trim())"
                placeholder="001-001-0001234"
                [(ngModel)]="formNuevaCompra.numeroFactura"
              />
              @if (formSubmitted() && (!formNuevaCompra.numeroFactura || !formNuevaCompra.numeroFactura.trim())) {
                <span class="error-msg">El número de factura es obligatorio.</span>
              }
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
              <label class="form-label" for="compraFechaEmision">
                Fecha de Emisión <span class="text-danger font-bold">* Obligatorio</span>
              </label>
              <input
                id="compraFechaEmision"
                type="date"
                class="form-control"
                [class.is-invalid]="formSubmitted() && !formNuevaCompra.fechaEmision"
                [(ngModel)]="formNuevaCompra.fechaEmision"
              />
              @if (formSubmitted() && !formNuevaCompra.fechaEmision) {
                <span class="error-msg">La fecha de emisión es obligatoria.</span>
              }
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
                <label class="form-label" for="compraFechaVenc">
                  Fecha de Vencimiento <span class="text-danger font-bold">* Obligatorio</span>
                </label>
                <input
                  id="compraFechaVenc"
                  type="date"
                  class="form-control"
                  [class.is-invalid]="formSubmitted() && !formNuevaCompra.fechaVencimiento"
                  [(ngModel)]="formNuevaCompra.fechaVencimiento"
                />
                @if (formSubmitted() && !formNuevaCompra.fechaVencimiento) {
                  <span class="error-msg">La fecha de vencimiento es requerida a crédito.</span>
                }
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
          <div class="d-flex justify-content-between align-center mb-2">
            <div class="section-title m-0">2. Agregar Artículos a la Factura</div>
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              (click)="abrirModalSeleccionMultiple()"
              title="Seleccionar y agregar múltiples artículos del catálogo en bloque"
            >
              <app-icon name="package" [size]="15" />
              <span>+ Cargar Múltiples Artículos en Bloque</span>
            </button>
          </div>

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
                <div class="d-flex justify-content-between align-center mb-1">
                  <label class="form-label m-0" for="itemSelectProducto">Artículo del Catálogo Maestro *</label>
                  <button
                    type="button"
                    class="btn-link text-xs text-primary font-bold cursor-pointer"
                    (click)="abrirModalNuevoArticuloRapido()"
                    title="Dar de alta un nuevo artículo sin salir de la factura"
                  >
                    + ¿Artículo nuevo? Créalo aquí
                  </button>
                </div>
                <select
                  id="itemSelectProducto"
                  class="form-control"
                  [ngModel]="itemEnCarga.productoId"
                  (ngModelChange)="onProductoSeleccionadoChange($event)"
                >
                  <option [ngValue]="null" disabled>-- Busca o selecciona un artículo --</option>
                  @if (articulosDelProveedorActual().length > 0) {
                    <optgroup [label]="'⭐ Suministrados por ' + (proveedorActual()?.razonSocial || 'este Proveedor')">
                      @for (prod of articulosDelProveedorActual(); track prod.id) {
                        <option [ngValue]="prod.id">
                          ⭐ [{{ prod.tipoArticulo }}] {{ prod.nombre }} (Pactado: Gs. {{ getCostoPactado(prod) | appCurrency }})
                        </option>
                      }
                    </optgroup>
                  }
                  <optgroup [label]="articulosDelProveedorActual().length > 0 ? 'Otros Artículos del Catálogo' : 'Todos los Artículos del Catálogo'">
                    @for (prod of otrosArticulosDelCatalogo(); track prod.id) {
                      <option [ngValue]="prod.id">
                        [{{ prod.tipoArticulo }}] {{ prod.nombre }} @if (prod.codigoBarra) { ({{ prod.codigoBarra }}) }
                      </option>
                    }
                  </optgroup>
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

          <!-- SECCIÓN 3: ARTÍCULOS INCLUIDOS EN LA FACTURA -->
          <div class="section-title d-flex justify-content-between align-center mt-4">
            <div class="d-flex align-center gap-2">
              <span>3. Artículos Incluidos en la Factura</span>
              <span class="badge badge-primary">{{ itemsCargados().length }} {{ itemsCargados().length === 1 ? 'artículo' : 'artículos' }}</span>
            </div>
            @if (itemsCargados().length > 0) {
              <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                (click)="abrirModalSeleccionMultiple()"
              >
                <app-icon name="plus" [size]="14" />
                <span>+ Agregar Más en Bloque</span>
              </button>
            }
          </div>

          @if (itemsCargados().length > 0) {
            <div class="table-container-sm mt-2">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>Artículo</th>
                    <th>Cant.</th>
                    <th>Costo Unitario</th>
                    <th>IVA</th>
                    <th class="text-right">Subtotal</th>
                    <th class="text-right" style="width: 60px;">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  @for (it of itemsCargados(); track $index) {
                    <tr>
                      <td class="text-muted text-xs text-center">{{ $index + 1 }}</td>
                      <td>
                        <span class="font-medium">{{ it.productoNombre }}</span>
                        @if (it.codigoBarra) {
                          <span class="text-xs text-muted font-mono ml-2">({{ it.codigoBarra }})</span>
                        }
                      </td>
                      <td><strong>{{ it.cantidad }}</strong> {{ it.unidadMedida || 'UNID' }}</td>
                      <td>{{ it.costoUnitario | appCurrency }}</td>
                      <td><span class="badge-iva">{{ it.tipoIva }}</span></td>
                      <td class="text-right font-bold text-primary">{{ it.subtotal | appCurrency }}</td>
                      <td class="text-right">
                        <button class="btn-action btn-danger" (click)="quitarItemDeLaFactura($index)" title="Eliminar artículo de la factura">
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
                  * Al confirmar el registro de esta factura, el stock de estos <strong>{{ itemsCargados().length }} artículo(s)</strong> aumentará automáticamente en el sistema y se generará el movimiento en Kardex.
                </div>
                <div class="total-box">
                  <span class="total-label">TOTAL FACTURA:</span>
                  <span class="total-number">{{ totalFacturaCalculado() | appCurrency }}</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="empty-items-box mt-2">
              <app-icon name="package" [size]="28" extraClass="text-muted" />
              <div class="empty-items-text">
                <strong class="d-block mb-1">Esta factura admite múltiples artículos</strong>
                <p class="m-0 text-xs text-muted">
                  Puedes ir acumulando todos los productos que componen el comprobante usando el lector de código de barra, el selector individual o cargándolos masivamente del catálogo.
                </p>
              </div>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                (click)="abrirModalSeleccionMultiple()"
              >
                <app-icon name="package" [size]="14" />
                <span>+ Cargar Múltiples del Catálogo</span>
              </button>
            </div>
          }

        </div>

        <div footer class="modal-actions-footer">
          <button type="button" class="btn btn-secondary" (click)="solicitarCerrarModalNuevaCompra()">
            Cancelar
          </button>
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
              <span>Confirmar e Ingresar Stock ({{ itemsCargados().length }} artículos)</span>
            }
          </button>
        </div>
      </app-modal>
    }

    <!-- MODAL SELECCIÓN MÚLTIPLE DE ARTÍCULOS -->
    @if (modalSeleccionMultipleAbierto()) {
      <app-modal
        [isOpen]="modalSeleccionMultipleAbierto()"
        title="Cargar Múltiples Artículos en Bloque"
        size="xl"
        [closeOnBackdrop]="false"
        (close)="cerrarModalSeleccionMultiple()"
      >
        <div body class="modal-form-content">
          <div class="d-flex justify-content-between align-center mb-3 flex-wrap gap-2">
            <div class="d-flex align-center gap-2">
              <button
                type="button"
                class="btn-pill"
                [class.active]="!filtroSoloProveedorMultiple()"
                (click)="filtroSoloProveedorMultiple.set(false)"
              >
                Todos ({{ itemsSeleccionMultiple.length }})
              </button>
              <button
                type="button"
                class="btn-pill"
                [class.active]="filtroSoloProveedorMultiple()"
                (click)="filtroSoloProveedorMultiple.set(true)"
              >
                ⭐ Solo de este Proveedor ({{ totalArticulosProveedorMultiple }})
              </button>
            </div>
            <div class="search-box-sm">
              <app-icon name="search" [size]="16" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                [ngModel]="filtroBusquedaMultiple()"
                (ngModelChange)="filtroBusquedaMultiple.set($event)"
              />
            </div>
          </div>

          <div class="table-container-sm" style="max-height: 420px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 45px; text-align: center;">Sel.</th>
                  <th>Artículo</th>
                  <th>Tipo</th>
                  <th>Cód. Barra</th>
                  <th style="width: 110px;">Cant.</th>
                  <th style="width: 140px;">Costo Unit. (Gs.)</th>
                  <th style="width: 100px;">IVA</th>
                </tr>
              </thead>
              <tbody>
                @for (item of itemsFiltradosMultiple; track item.producto.id) {
                  <tr [class.row-selected]="item.seleccionado">
                    <td class="text-center">
                      <input
                        type="checkbox"
                        [(ngModel)]="item.seleccionado"
                      />
                    </td>
                    <td>
                      <div class="font-medium d-flex align-center gap-1">
                        <span>{{ item.producto.nombre }}</span>
                        @if (item.suministradoPorProveedor) {
                          <span class="badge badge-success text-xs" title="Artículo suministrado habitualmente por este proveedor">⭐ Habitual</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-secondary text-xs">{{ item.producto.tipoArticulo }}</span>
                    </td>
                    <td class="font-mono text-xs">
                      {{ item.producto.codigoBarra || '-' }}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        class="form-control form-control-sm font-bold"
                        [(ngModel)]="item.cantidad"
                        [disabled]="!item.seleccionado"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        class="form-control form-control-sm font-bold"
                        [(ngModel)]="item.costoUnitario"
                        [disabled]="!item.seleccionado"
                      />
                    </td>
                    <td>
                      <select
                        class="form-control form-control-sm"
                        [(ngModel)]="item.tipoIva"
                        [disabled]="!item.seleccionado"
                      >
                        <option value="IVA_10">10%</option>
                        <option value="IVA_5">5%</option>
                        <option value="EXENTA">Exenta</option>
                      </select>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div footer class="modal-actions-footer">
          <button type="button" class="btn btn-secondary" (click)="cerrarModalSeleccionMultiple()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="agregarSeleccionadosALaFactura()"
          >
            <app-icon name="check" [size]="16" />
            <span>Agregar Seleccionados a la Factura ({{ totalSeleccionadosMultiple }})</span>
          </button>
        </div>
      </app-modal>
    }

    <!-- MODAL ALTA RÁPIDA DE ARTÍCULO EN FACTURA -->
    @if (modalNuevoArticuloRapidoAbierto()) {
      <app-modal
        [isOpen]="modalNuevoArticuloRapidoAbierto()"
        title="+ Alta Rápida de Artículo en Catálogo"
        size="lg"
        [closeOnBackdrop]="false"
        (close)="cerrarModalNuevoArticuloRapido()"
      >
        <div body class="modal-form-content">
          <div class="info-alert-box mb-3">
            <app-icon name="info" [size]="18" />
            <div class="text-xs">
              El artículo se registrará en el catálogo maestro y quedará vinculado automáticamente como proveedor a
              <strong>{{ proveedorActual()?.razonSocial || 'el proveedor seleccionado' }}</strong> con el costo pactado.
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="nuevoNombre">Nombre del Artículo *</label>
              <input
                id="nuevoNombre"
                type="text"
                class="form-control"
                placeholder="Ej: Café Expresso Premium"
                [(ngModel)]="formNuevoArticulo.nombre"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoTipo">Tipo de Artículo *</label>
              <select
                id="nuevoTipo"
                class="form-control"
                [(ngModel)]="formNuevoArticulo.tipoArticulo"
              >
                <option value="VENTA_DIRECTA">Venta Directa (Bebida, Envasado, Cafetería)</option>
                <option value="INSUMO">Insumo / Materia Prima</option>
                <option value="ENVASE">Envase (Pote, Cucurucho, Vaso)</option>
                <option value="SABOR">Sabor de Helado</option>
                <option value="TOPPING">Topping / Agregado</option>
              </select>
            </div>
          </div>

          <div class="form-grid-3 mt-3">
            <div class="form-group">
              <label class="form-label" for="nuevoCodBarra">Código de Barra / SKU</label>
              <input
                id="nuevoCodBarra"
                type="text"
                class="form-control font-mono"
                placeholder="Ej: 7840001099"
                [(ngModel)]="formNuevoArticulo.codigoBarra"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoUnidad">Unidad de Medida</label>
              <select
                id="nuevoUnidad"
                class="form-control"
                [(ngModel)]="formNuevoArticulo.unidadMedida"
              >
                <option value="UNIDAD">Unidad (Un)</option>
                <option value="KG">Kilogramo (Kg)</option>
                <option value="LITRO">Litro (Lt)</option>
                <option value="GRAMO">Gramo (g)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="nuevoIva">Tipo de IVA</label>
              <select
                id="nuevoIva"
                class="form-control"
                [(ngModel)]="formNuevoArticulo.tipoIva"
              >
                <option value="IVA_10">IVA 10% (General)</option>
                <option value="IVA_5">IVA 5% (Canasta / Alimentos)</option>
                <option value="EXENTA">Exenta</option>
              </select>
            </div>
          </div>

          <!-- SECCIÓN COSTO Y PRECIO DE VENTA INTELIGENTE -->
          <div class="pricing-card mt-3">
            <div class="d-flex justify-content-between align-center mb-2">
              <span class="font-bold text-sm text-primary">Costo de Compra & Margen de Venta</span>
              <div class="d-flex gap-1">
                <button type="button" class="margin-btn" (click)="aplicarMargenRapido(15)">15%</button>
                <button type="button" class="margin-btn" (click)="aplicarMargenRapido(20)">20%</button>
                <button type="button" class="margin-btn" (click)="aplicarMargenRapido(30)">30%</button>
                <button type="button" class="margin-btn" (click)="aplicarMargenRapido(50)">50%</button>
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label" for="nuevoCosto">Costo Compra Proveedor (Gs.) *</label>
                <input
                  id="nuevoCosto"
                  type="number"
                  min="0"
                  step="500"
                  class="form-control font-bold"
                  [(ngModel)]="formNuevoArticulo.costoCompra"
                  (ngModelChange)="recalcularPrecioVentaArticuloRapido()"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="nuevoMargen">% Margen Ganancia</label>
                <input
                  id="nuevoMargen"
                  type="number"
                  step="1"
                  class="form-control"
                  [(ngModel)]="formNuevoArticulo.margenPorcentaje"
                  (ngModelChange)="recalcularPrecioVentaArticuloRapido()"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="nuevoPrecioVenta">Precio Venta Sugerido (Gs.) *</label>
                <input
                  id="nuevoPrecioVenta"
                  type="number"
                  min="0"
                  step="500"
                  class="form-control font-bold text-primary"
                  [(ngModel)]="formNuevoArticulo.precioVenta"
                  (ngModelChange)="recalcularMargenArticuloRapido()"
                />
              </div>
            </div>
          </div>
        </div>

        <div footer class="modal-actions-footer">
          <button type="button" class="btn btn-secondary" (click)="cerrarModalNuevoArticuloRapido()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="guardandoNuevoArticulo() || !formNuevoArticulo.nombre.trim()"
            (click)="guardarNuevoArticuloRapido()"
          >
            @if (guardandoNuevoArticulo()) {
              <span class="spinner-sm"></span> Guardando Artículo...
            } @else {
              <app-icon name="check" [size]="16" />
              <span>Guardar e Insertar en Factura</span>
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
    .btn-outline-primary { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
    .btn-outline-primary:hover { background: #e0f2fe; border-color: #7dd3fc; }
    .btn-outline-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .btn-outline-danger:hover { background: #fee2e2; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8125rem; }
    .text-danger { color: #dc2626; }
    .is-invalid { border-color: #dc2626 !important; background-color: #fef2f2 !important; }
    .error-msg { font-size: 0.75rem; color: #dc2626; font-weight: 500; margin-top: 0.15rem; }
    .badge-primary { background: #0284c7; color: #ffffff; border-radius: 9999px; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 600; }
    .badge-secondary { background: #f1f5f9; color: #334155; border-radius: 0.35rem; padding: 0.15rem 0.45rem; font-size: 0.75rem; }
    .empty-items-box { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 0.5rem; }
    .empty-items-text { flex: 1; }
    .row-selected { background: #f0f9ff !important; }
    .search-box-sm { position: relative; display: flex; align-items: center; min-width: 260px; }
    .search-box-sm input { width: 100%; padding: 0.45rem 0.75rem 0.45rem 2.2rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; font-size: 0.8125rem; }
    .search-box-sm app-icon { position: absolute; left: 0.65rem; color: #94a3b8; }
    .form-control-sm { padding: 0.35rem 0.5rem; font-size: 0.8125rem; }
    .d-block { display: block; }
    .mb-1 { margin-bottom: 0.25rem; }
    .text-center { text-align: center; }
    .info-alert-box { display: flex; align-items: center; gap: 0.6rem; padding: 0.65rem 0.85rem; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 0.375rem; }
    .pricing-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 0.85rem; }
    .margin-btn { font-size: 0.75rem; padding: 0.2rem 0.5rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 0.25rem; cursor: pointer; }
    .margin-btn:hover { background: #0284c7; color: #ffffff; border-color: #0284c7; }
    .badge-success { background: #dcfce7; color: #15803d; font-weight: 600; border-radius: 0.25rem; padding: 0.15rem 0.45rem; }
    .btn-pill { border: 1px solid #cbd5e1; background: #ffffff; color: #475569; padding: 0.3rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; cursor: pointer; font-weight: 500; transition: all 0.15s; }
    .btn-pill:hover { border-color: #0284c7; color: #0284c7; }
    .btn-pill.active { background: #0284c7; color: #ffffff; border-color: #0284c7; font-weight: 600; }
    .btn-link { background: none; border: none; cursor: pointer; text-decoration: underline; }
    .cursor-pointer { cursor: pointer; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-1 { gap: 0.25rem; }
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
  private readonly exportService = inject(ReporteExportService);

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
  public readonly formSubmitted = signal<boolean>(false);

  // Modal Selección Múltiple en Bloque
  public readonly modalSeleccionMultipleAbierto = signal<boolean>(false);
  public readonly filtroBusquedaMultiple = signal<string>('');
  public readonly filtroSoloProveedorMultiple = signal<boolean>(false);
  public itemsSeleccionMultiple: ItemSeleccionMultiple[] = [];

  get itemsFiltradosMultiple(): ItemSeleccionMultiple[] {
    let list = this.itemsSeleccionMultiple;
    if (this.filtroSoloProveedorMultiple()) {
      list = list.filter(i => i.suministradoPorProveedor);
    }
    const query = this.filtroBusquedaMultiple().trim().toLowerCase();
    if (!query) {
      return list;
    }
    return list.filter(item =>
      item.producto.nombre.toLowerCase().includes(query) ||
      (item.producto.codigoBarra && item.producto.codigoBarra.toLowerCase().includes(query)) ||
      (item.producto.tipoArticulo && item.producto.tipoArticulo.toLowerCase().includes(query))
    );
  }

  get totalSeleccionadosMultiple(): number {
    return this.itemsSeleccionMultiple.filter(i => i.seleccionado).length;
  }

  get totalArticulosProveedorMultiple(): number {
    return this.itemsSeleccionMultiple.filter(i => i.suministradoPorProveedor).length;
  }

  // Filtrado y agrupación por proveedor actual
  public readonly proveedorActual = computed(() => {
    const pid = this.formNuevaCompra.proveedorId;
    if (!pid) return null;
    return this.proveedoresService.proveedores().find(p => p.id === pid) || null;
  });

  public readonly articulosDelProveedorActual = computed(() => {
    const pid = this.formNuevaCompra.proveedorId;
    if (!pid) return [];
    return this.productosService.productos().filter(p =>
      p.proveedores && p.proveedores.some(pv => pv.proveedorId === pid)
    );
  });

  public readonly otrosArticulosDelCatalogo = computed(() => {
    const pid = this.formNuevaCompra.proveedorId;
    if (!pid) return this.productosService.productos();
    return this.productosService.productos().filter(p =>
      !p.proveedores || !p.proveedores.some(pv => pv.proveedorId === pid)
    );
  });

  getCostoPactado(prod: Producto): number {
    const pid = this.formNuevaCompra.proveedorId;
    if (pid && prod.proveedores) {
      const v = prod.proveedores.find(pv => pv.proveedorId === pid);
      if (v && v.costoCompra) return v.costoCompra;
    }
    return prod.precioCosto || 0;
  }

  // Modal Alta Rápida de Artículo
  public readonly modalNuevoArticuloRapidoAbierto = signal<boolean>(false);
  public readonly guardandoNuevoArticulo = signal<boolean>(false);

  public formNuevoArticulo: {
    nombre: string;
    tipoArticulo: TipoArticulo;
    codigoBarra: string;
    unidadMedida: UnidadMedida;
    tipoIva: TipoIva;
    costoCompra: number;
    margenPorcentaje: number;
    precioVenta: number;
  } = this.getFormNuevoArticuloInicial();

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
    this.formSubmitted.set(false);
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

  solicitarCerrarModalNuevaCompra(): void {
    const tieneArticulos = this.itemsCargados().length > 0;
    const tieneCampos = Boolean(this.formNuevaCompra.numeroFactura?.trim()) ||
      Boolean(this.formNuevaCompra.timbrado?.trim()) ||
      (this.formNuevaCompra.proveedorId !== null);

    if (tieneArticulos || tieneCampos) {
      const cant = this.itemsCargados().length;
      const mensaje = cant > 0
        ? `Tienes ${cant} artículo(s) cargado(s) en esta factura.\n¿Estás seguro de que deseas cancelar y salir?\nSe descartarán todos los artículos y datos no guardados.`
        : '¿Estás seguro de que deseas salir sin registrar la factura de compra?';
      if (!confirm(mensaje)) {
        return;
      }
    }
    this.modalNuevaCompraAbierto.set(false);
  }

  cerrarModalNuevaCompra(): void {
    this.solicitarCerrarModalNuevaCompra();
  }

  abrirModalSeleccionMultiple(): void {
    const prods = this.productosService.productos();
    const provId = this.formNuevaCompra.proveedorId;

    this.itemsSeleccionMultiple = prods.map(p => {
      let costo = p.precioCosto || 0;
      let suministrado = false;
      if (provId && p.proveedores) {
        const vinculo = p.proveedores.find(pv => pv.proveedorId === provId);
        if (vinculo) {
          suministrado = true;
          if (vinculo.costoCompra) {
            costo = vinculo.costoCompra;
          }
        }
      }
      return {
        producto: p,
        seleccionado: false,
        cantidad: 1,
        costoUnitario: costo,
        tipoIva: p.tipoIva || 'IVA_10',
        suministradoPorProveedor: suministrado
      };
    });

    this.filtroBusquedaMultiple.set('');
    this.filtroSoloProveedorMultiple.set(false);
    this.modalSeleccionMultipleAbierto.set(true);
  }

  cerrarModalSeleccionMultiple(): void {
    this.modalSeleccionMultipleAbierto.set(false);
  }

  agregarSeleccionadosALaFactura(): void {
    const seleccionados = this.itemsSeleccionMultiple.filter(i => i.seleccionado && i.cantidad > 0);
    if (seleccionados.length === 0) {
      this.toast.warning('Marca las casillas de al menos un artículo para agregarlo a la factura.');
      return;
    }

    const nuevosItems: ItemFormCompra[] = seleccionados.map(sel => ({
      productoId: sel.producto.id,
      productoNombre: sel.producto.nombre,
      codigoBarra: sel.producto.codigoBarra,
      unidadMedida: sel.producto.unidadMedida,
      cantidad: sel.cantidad,
      costoUnitario: sel.costoUnitario,
      tipoIva: sel.tipoIva,
      subtotal: Math.round(sel.cantidad * sel.costoUnitario)
    }));

    this.itemsCargados.update(list => [...list, ...nuevosItems]);
    this.toast.success(`Se agregaron ${nuevosItems.length} artículos a la factura.`);
    this.modalSeleccionMultipleAbierto.set(false);
  }

  // Métodos para Alta Rápida de Artículo dentro de la Factura
  private getFormNuevoArticuloInicial() {
    return {
      nombre: '',
      tipoArticulo: 'VENTA_DIRECTA' as TipoArticulo,
      codigoBarra: '',
      unidadMedida: 'UNIDAD' as UnidadMedida,
      tipoIva: 'IVA_10' as TipoIva,
      costoCompra: 0,
      margenPorcentaje: 30,
      precioVenta: 0
    };
  }

  abrirModalNuevoArticuloRapido(): void {
    this.formNuevoArticulo = this.getFormNuevoArticuloInicial();
    if (this.codigoBarraInput?.trim()) {
      this.formNuevoArticulo.codigoBarra = this.codigoBarraInput.trim();
    }
    this.recalcularPrecioVentaArticuloRapido();
    this.modalNuevoArticuloRapidoAbierto.set(true);
  }

  cerrarModalNuevoArticuloRapido(): void {
    this.modalNuevoArticuloRapidoAbierto.set(false);
  }

  recalcularPrecioVentaArticuloRapido(): void {
    const costo = Number(this.formNuevoArticulo.costoCompra) || 0;
    const margen = Number(this.formNuevoArticulo.margenPorcentaje) || 0;
    this.formNuevoArticulo.precioVenta = Math.round(costo * (1 + margen / 100));
  }

  recalcularMargenArticuloRapido(): void {
    const costo = Number(this.formNuevoArticulo.costoCompra) || 0;
    const venta = Number(this.formNuevoArticulo.precioVenta) || 0;
    if (costo > 0 && venta >= costo) {
      this.formNuevoArticulo.margenPorcentaje = Math.round(((venta - costo) / costo) * 100);
    }
  }

  aplicarMargenRapido(porcentaje: number): void {
    this.formNuevoArticulo.margenPorcentaje = porcentaje;
    this.recalcularPrecioVentaArticuloRapido();
  }

  guardarNuevoArticuloRapido(): void {
    if (!this.formNuevoArticulo.nombre.trim()) {
      this.toast.warning('Ingresa el nombre del artículo.');
      return;
    }

    this.guardandoNuevoArticulo.set(true);
    const provId = this.formNuevaCompra.proveedorId;

    const payload: ProductoRequest = {
      nombre: this.formNuevoArticulo.nombre.trim(),
      tipoArticulo: this.formNuevoArticulo.tipoArticulo,
      codigoBarra: this.formNuevoArticulo.codigoBarra.trim() || undefined,
      unidadMedida: this.formNuevoArticulo.unidadMedida,
      tipoIva: this.formNuevoArticulo.tipoIva,
      precioCosto: this.formNuevoArticulo.costoCompra || 0,
      precioVenta: this.formNuevoArticulo.precioVenta || 0,
      stock: 0,
      stockMinimo: 5,
      activo: true,
      proveedores: provId ? [
        {
          proveedorId: provId,
          costoCompra: this.formNuevoArticulo.costoCompra || 0,
          esPrincipal: true
        }
      ] : []
    };

    this.productosService.crear(payload).subscribe({
      next: (nuevoProd) => {
        this.guardandoNuevoArticulo.set(false);
        this.modalNuevoArticuloRapidoAbierto.set(false);
        // Seleccionar automáticamente el artículo recién creado en la factura de compra
        this.onProductoSeleccionadoChange(nuevoProd.id);
        this.itemEnCarga.costoUnitario = this.formNuevoArticulo.costoCompra || 0;
        this.itemEnCarga.tipoIva = this.formNuevoArticulo.tipoIva;
        this.toast.success(`Artículo "${nuevoProd.nombre}" creado e incorporado al comprobante.`);
        // Enfocar cantidad
        setTimeout(() => {
          const cantidadInput = document.getElementById('itemCantidad') as HTMLInputElement | null;
          if (cantidadInput) {
            cantidadInput.focus();
            cantidadInput.select();
          }
        }, 100);
      },
      error: (err) => {
        this.guardandoNuevoArticulo.set(false);
        this.toast.error(err.error?.mensaje || 'Error al crear el artículo nuevo.');
      }
    });
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
    this.formSubmitted.set(true);

    if (!this.formNuevaCompra.proveedorId) {
      this.toast.warning('El Proveedor es un campo obligatorio.');
      return;
    }
    if (!this.formNuevaCompra.numeroFactura || !this.formNuevaCompra.numeroFactura.trim()) {
      this.toast.warning('El N° de Factura es un campo obligatorio.');
      return;
    }
    if (!this.formNuevaCompra.fechaEmision) {
      this.toast.warning('La Fecha de Emisión es obligatoria.');
      return;
    }
    if (this.formNuevaCompra.condicionCompra === 'CREDITO' && !this.formNuevaCompra.fechaVencimiento) {
      this.toast.warning('Para compras a Crédito, la Fecha de Vencimiento es obligatoria.');
      return;
    }

    // Si el usuario seleccionó un artículo pero no presionó "+ Agregar Línea"
    if (this.itemEnCarga.productoId && this.itemEnCarga.cantidad > 0) {
      this.agregarItemALaFactura();
    }
    if (this.itemsCargados().length === 0) {
      this.toast.warning('Debes agregar al menos un artículo a la factura usando el botón "+ Agregar Línea" o "+ Cargar Múltiples".');
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
        this.formSubmitted.set(false);
        this.modalNuevaCompraAbierto.set(false);
        this.toast.success(`Factura N° ${payload.numeroFactura} registrada e ingresada al stock con éxito.`);
        // Refrescar compras e inventario
        this.comprasService.cargarCompras();
        this.productosService.cargarProductos();
      },
      error: (err) => {
        this.guardandoCompra.set(false);
        this.toast.error(err.error?.mensaje || 'Error al registrar la factura de compra.');
      }
    });
  }

  exportarCsv(): void {
    const list = this.comprasFiltradas();
    if (list.length === 0) {
      this.toast.warning('No hay compras para exportar.');
      return;
    }
    const totales = this.calcularTotalesParaExport(list);
    this.exportService.exportarComprasCsv(list, {}, totales);
    this.toast.success('Listado de compras exportado a CSV.');
  }

  exportarPdf(): void {
    const list = this.comprasFiltradas();
    if (list.length === 0) {
      this.toast.warning('No hay compras para exportar.');
      return;
    }
    const totales = this.calcularTotalesParaExport(list);
    try {
      this.exportService.exportarComprasPdf(list, {}, totales);
      this.toast.success('Listado de compras exportado a PDF.');
    } catch (e) {
      console.error('Error al exportar PDF de compras:', e);
      this.toast.error('Ocurrió un error al generar el PDF de compras.');
    }
  }

  private calcularTotalesParaExport(list: Compra[]) {
    let totalCompras = 0;
    let totalIva10 = 0;
    let totalIva5 = 0;
    let totalExenta = 0;
    let totalCredito = 0;

    for (const c of list) {
      if (c.estado !== 'ANULADA') {
        totalCompras += Number(c.total || 0);
        totalIva10 += Number(c.totalIva10 || 0);
        totalIva5 += Number(c.totalIva5 || 0);
        totalExenta += Number(c.totalExenta || 0);
        if (c.condicionCompra === 'CREDITO') {
          totalCredito += Number(c.total || 0);
        }
      }
    }

    return {
      totalCompras,
      cantidadFacturas: list.filter(c => c.estado !== 'ANULADA').length,
      totalIva: totalIva10 + totalIva5,
      totalIva10,
      totalIva5,
      totalExenta,
      totalCredito
    };
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
