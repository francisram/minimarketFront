import { Component, inject, input, output, computed, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstitucionService } from '../../../core/services/institucion.service';
import { PedidosService } from '../../../core/services/pedidos.service';
import { ImpresorasService } from '../../../core/services/impresoras.service';
import { ToastService } from '../../../core/services/toast.service';
import { Pedido, DetallePedido } from '../../../core/models/pedido.model';
import { AppIconComponent } from '../icon/icon.component';
import { AppModalComponent } from '../modal/modal.component';
import { AppCurrencyPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-comprobante-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent, AppCurrencyPipe],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      size="md"
      (close)="close.emit()"
    >
      <div body class="comprobante-body">
        @if (pedido()) {
          <div class="ticket-paper" id="comprobante-ticket-print">
            <!-- ENCABEZADO FISCAL DEL COMERCIO -->
            <div class="ticket-header">
              @if (pedido()?.estado === 'CANCELADO') {
                <div class="ticket-anulado-badge">
                  ⚠️ COMPROBANTE ANULADO / CANCELADO
                </div>
              }
              @if (institucionService.institucion().logoBase64) {
                <img 
                  [src]="'data:image/png;base64,' + institucionService.institucion().logoBase64" 
                  alt="Logo" 
                  class="ticket-logo"
                />
              } @else {
                <div class="ticket-logo-icon">
                  <app-icon name="ice-cream" [size]="28" />
                </div>
              }

              <h2 class="comercio-nombre">{{ institucionService.institucion().nombre || 'Heladería Artesanal' }}</h2>
              
              @if (institucionService.institucion().ruc) {
                <div class="comercio-dato"><strong>RUC:</strong> {{ institucionService.institucion().ruc }}</div>
              }
              @if (institucionService.institucion().direccion) {
                <div class="comercio-dato">{{ institucionService.institucion().direccion }}</div>
              }
              @if (institucionService.institucion().telefono) {
                <div class="comercio-dato">Tel: {{ institucionService.institucion().telefono }}</div>
              }
              @if (institucionService.institucion().ciudad) {
                <div class="comercio-dato">{{ institucionService.institucion().ciudad }} - Paraguay</div>
              }

              <!-- DATOS DE TIMBRADO PARA FACTURA -->
              @if (esFactura()) {
                <div class="timbrado-box">
                  <div><strong>TIMBRADO N°:</strong> {{ institucionService.institucion().timbrado || '17894561' }}</div>
                  @if (institucionService.institucion().timbradoVencimiento) {
                    <div><strong>Válido hasta:</strong> {{ institucionService.institucion().timbradoVencimiento }}</div>
                  }
                  <div class="timbrado-iva">IVA Incluido</div>
                </div>
              }
            </div>

            <div class="ticket-divider">================================</div>

            <!-- TÍTULO DEL COMPROBANTE -->
            <div class="comprobante-title-row">
              <span class="comprobante-tipo">
                {{ esFactura() ? 'FACTURA' : 'Número de Ticket:' }}
              </span>
              <span class="comprobante-nro">{{ numeroComprobante() }}</span>
            </div>
            @if (trxId()) {
              <div class="trx-row">
                <span>Trx ID:</span>
                <strong>{{ trxId() }}</strong>
              </div>
            }

            <div class="ticket-meta">
              <div class="meta-row">
                <span>Fecha:</span>
                <strong>{{ fechaFormateada() }}</strong>
              </div>
              <div class="meta-row">
                <span>Condición:</span>
                <strong>{{ pedido()?.condicionVenta || 'CONTADO' }}</strong>
              </div>
              <div class="meta-row">
                <span>Entrega:</span>
                <span>{{ pedido()?.tipoEntrega }}</span>
              </div>
              <div class="meta-row">
                <span>Medio Pago:</span>
                <span>{{ pedido()?.metodoPago }}</span>
              </div>
              @if (pedido()?.numeroVoucher) {
                <div class="meta-row">
                  <span>Voucher POS:</span>
                  <strong>#{{ pedido()?.numeroVoucher }}</strong>
                </div>
              }
            </div>

            <div class="ticket-divider">--------------------------------</div>

            <!-- DATOS DEL CLIENTE -->
            <div class="cliente-info">
              <div class="info-line">
                <span class="info-label">Cliente / Razón Social:</span>
                <span class="info-value"><strong>{{ pedido()?.clienteNombre || 'Consumidor Final' }}</strong></span>
              </div>
              @if (esFactura() || pedido()?.clienteRuc) {
                <div class="info-line">
                  <span class="info-label">RUC / C.I.:</span>
                  <span class="info-value">{{ pedido()?.clienteRuc || 'X' }}</span>
                </div>
              }
              @if (pedido()?.clienteDireccion) {
                <div class="info-line">
                  <span class="info-label">Dirección:</span>
                  <span class="info-value">{{ pedido()?.clienteDireccion }}</span>
                </div>
              }
            </div>

            <div class="ticket-divider">================================</div>

            <!-- LISTA DE ITEMS -->
            <table class="ticket-table">
              <thead>
                <tr>
                  <th class="col-cant">Cant</th>
                  <th class="col-desc">Descripción</th>
                  <th class="col-subt">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @for (item of detalles(); track item.id || $index) {
                  <tr>
                    <td class="col-cant">{{ item.cantidad }}x</td>
                    <td class="col-desc">
                      @if (item.tipoItem === 'HELADO') {
                        <div class="item-title">
                          {{ item.presentacion?.nombre || 'Helado Artesanal' }}
                          <span class="iva-tag" [class.iva-tag-5]="obtenerIndicadorIva(item) === '5%'" [class.iva-tag-ex]="obtenerIndicadorIva(item) === 'Ex'">[{{ obtenerIndicadorIva(item) }}]</span>
                        </div>
                        @if (item.sabores && item.sabores.length > 0) {
                          <div class="item-subinfo">Sabores: {{ obtenerNombresSabores(item.sabores) }}</div>
                        }
                        @if (item.toppings && item.toppings.length > 0) {
                          <div class="item-subinfo">Toppings: {{ obtenerNombresToppings(item.toppings) }}</div>
                        }
                      } @else if (item.tipoItem === 'TOPPING') {
                        <div class="item-title">
                          {{ (item.toppings && item.toppings.length > 0) ? item.toppings[0].nombre : 'Topping' }}
                          <span class="iva-tag" [class.iva-tag-5]="obtenerIndicadorIva(item) === '5%'" [class.iva-tag-ex]="obtenerIndicadorIva(item) === 'Ex'">[{{ obtenerIndicadorIva(item) }}]</span>
                        </div>
                      } @else {
                        <div class="item-title">
                          {{ item.productoSimple?.nombre || 'Producto' }}
                          <span class="iva-tag" [class.iva-tag-5]="obtenerIndicadorIva(item) === '5%'" [class.iva-tag-ex]="obtenerIndicadorIva(item) === 'Ex'">[{{ obtenerIndicadorIva(item) }}]</span>
                        </div>
                      }
                      <div class="item-unit-price">{{ obtenerPrecioUnitario(item) | appCurrency }} c/u</div>
                    </td>
                    <td class="col-subt">{{ (item.subtotal || 0) | appCurrency }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="ticket-divider">--------------------------------</div>

            <!-- TOTALES -->
            <div class="totales-block">
              <div class="total-row">
                <span class="total-label">TOTAL A PAGAR:</span>
                <span class="total-val">{{ total() | appCurrency }}</span>
              </div>

              <!-- LIQUIDACIÓN DEL IVA (PARAGUAY) -->
              @if (esFactura()) {
                <div class="iva-box">
                  <div class="iva-title">LIQUIDACIÓN DEL IVA</div>
                  <div class="iva-row">
                    <span>Gravadas (10%):</span>
                    <span>{{ gravada10() | appCurrency }}</span>
                  </div>
                  @if (gravada5() > 0 || iva5() > 0) {
                    <div class="iva-row">
                      <span>Gravadas (5%):</span>
                      <span>{{ gravada5() | appCurrency }}</span>
                    </div>
                  }
                  @if (totalExentas() > 0) {
                    <div class="iva-row">
                      <span>Exentas:</span>
                      <span>{{ totalExentas() | appCurrency }}</span>
                    </div>
                  }
                  <div class="iva-row">
                    <span>Liquidación IVA (10%):</span>
                    <span>{{ iva10() | appCurrency }}</span>
                  </div>
                  @if (iva5() > 0 || gravada5() > 0) {
                    <div class="iva-row">
                      <span>Liquidación IVA (5%):</span>
                      <span>{{ iva5() | appCurrency }}</span>
                    </div>
                  }
                  <div class="iva-row iva-total">
                    <span>TOTAL IVA:</span>
                    <span>{{ totalIva() | appCurrency }}</span>
                  </div>
                </div>
              }
            </div>

            @if (pedido()?.notas) {
              <div class="ticket-divider">--------------------------------</div>
              <div class="ticket-notas">
                <strong>Obs:</strong> {{ pedido()?.notas }}
              </div>
            }

            <div class="ticket-divider">================================</div>

            <!-- PIE DE TICKET -->
            <div class="ticket-footer">
              <p class="footer-msg">¡GRACIAS POR SU PREFERENCIA!</p>
              <p class="footer-sub">Heladería Artesanal Don Nicola</p>
              @if (esFactura()) {
                <p class="footer-legal">Original: Cliente • Duplicado: Archivo Tributario</p>
              }
            </div>
          </div>
        }
      </div>

      <div footer class="no-print footer-wrapper">
        <div class="footer-left">
          <label class="printer-label" for="selectPrinterModal">
            <app-icon name="printer" [size]="14" />
            <span>Ticketera:</span>
          </label>
          <select
            id="selectPrinterModal"
            class="form-control select-printer"
            [(ngModel)]="impresoraSeleccionadaId"
            (ngModelChange)="onCambiarImpresora($event)"
          >
            @if (impresorasService.impresoras().length === 0) {
              <option [ngValue]="null">Sin impresoras</option>
            }
            @for (imp of impresorasService.impresoras(); track imp.id) {
              <option [ngValue]="imp.id">
                🖨️ {{ imp.nombre }} ({{ imp.tipoConexion }})
              </option>
            }
          </select>
        </div>

        <div class="footer-actions">
          @if (pedido()?.estado !== 'CANCELADO') {
            <button
              type="button"
              class="btn btn-danger"
              (click)="abrirConfirmarAnular()"
              [disabled]="anulando()"
              title="Anular comprobante y revertir stock a inventario"
            >
              <app-icon name="trash" [size]="16" />
              <span>Anular Venta</span>
            </button>
          }

          <button
            type="button"
            class="btn btn-secondary"
            (click)="close.emit()"
          >
            Cerrar
          </button>

          <button
            type="button"
            class="btn btn-outline"
            (click)="imprimirTicketera()"
            [disabled]="imprimiendoTicketera() || !pedido() || impresorasService.impresoras().length === 0"
            title="Enviar a la ticketera térmica seleccionada"
          >
            <app-icon name="printer" [size]="16" />
            <span>{{ imprimiendoTicketera() ? 'Enviando...' : 'Ticketera ESC/POS' }}</span>
          </button>

          <button
            type="button"
            class="btn btn-primary"
            (click)="imprimirNavegador()"
            title="Imprimir desde el navegador o guardar en PDF"
          >
            <app-icon name="printer" [size]="16" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- MODAL CONFIRMAR ANULACIÓN DESDE COMPROBANTE -->
    <app-modal
      [isOpen]="modalConfirmarAnular()"
      title="Autorizar Anulación de Comprobante"
      size="sm"
      (close)="cerrarConfirmarAnular()"
    >
      <div body class="anular-modal-body">
        <div class="anular-warning-icon">
          <app-icon name="alert-triangle" [size]="44" />
        </div>
        <p class="anular-text">
          ¿Está seguro de anular el comprobante <strong>{{ numeroComprobante() }}</strong> por valor de <strong>{{ total() | appCurrency }}</strong>?
        </p>

        @if (pedido()?.sesionCajaEstado === 'CERRADA') {
          <div class="anular-caja-cerrada-box">
            <app-icon name="alert-triangle" [size]="18" />
            <span><strong>Caja Cerrada:</strong> La sesión de caja original está CERRADA. La anulación reintegrará el stock y kardex sin alterar el arqueo histórico. Si devuelve dinero en efectivo, regístrelo en la caja actual como Egreso.</span>
          </div>
        } @else {
          <div class="anular-info-box">
            <app-icon name="info" [size]="16" />
            <span>Esta acción reintegrará inmediatamente los productos, envases y sabores al stock, y restará el importe del arqueo de caja abierta.</span>
          </div>
        }

        <div class="anular-auth-form">
          <div class="auth-field">
            <label class="auth-label" for="anularAdminPassModal">
              <app-icon name="lock" [size]="14" />
              <span>Contraseña de Admin / Dueño <strong style="color: #ef4444;">*</strong></span>
            </label>
            <input
              id="anularAdminPassModal"
              type="password"
              class="auth-input"
              [(ngModel)]="adminPassword"
              placeholder="Ingrese clave de admin para autorizar"
              (keyup.enter)="adminPassword.trim() ? confirmarAnulacion() : null"
              autocomplete="current-password"
            />
          </div>

          <div class="auth-field">
            <label class="auth-label" for="anularMotivoModal">
              <app-icon name="file-text" [size]="14" />
              <span>Motivo de la Anulación (opcional)</span>
            </label>
            <input
              id="anularMotivoModal"
              type="text"
              class="auth-input"
              [(ngModel)]="motivoAnulacion"
              placeholder="Ej: Error en cobranza, cambio de producto"
            />
          </div>
        </div>
      </div>

      <div footer>
        <button type="button" class="btn btn-secondary" (click)="cerrarConfirmarAnular()" [disabled]="anulando()">
          Volver
        </button>
        <button
          type="button"
          class="btn btn-danger"
          (click)="confirmarAnulacion()"
          [disabled]="anulando() || !adminPassword.trim()"
        >
          @if (anulando()) {
            <app-icon name="refresh" [size]="16" extraClass="spin-icon" />
            <span>Anulando...</span>
          } @else {
            <app-icon name="trash" [size]="16" />
            <span>Confirmar Anulación</span>
          }
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .comprobante-body {
      display: flex;
      justify-content: center;
      background: var(--bg-subtle, #f1f5f9);
      padding: 1rem;
      border-radius: var(--radius-md);
      max-height: 70vh;
      overflow-y: auto;
    }

    .ticket-paper {
      background: #ffffff;
      color: #000000;
      width: 100%;
      max-width: 360px;
      padding: 1.5rem 1.25rem;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      font-family: 'Courier New', Courier, monospace, monospace;
      font-size: 12px;
      line-height: 1.35;
    }

    .ticket-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }

    .ticket-logo {
      max-height: 50px;
      max-width: 140px;
      object-fit: contain;
      margin-bottom: 0.35rem;
    }

    .ticket-logo-icon {
      color: var(--primary, #d97706);
      margin-bottom: 0.25rem;
    }

    .comercio-nombre {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .comercio-dato {
      font-size: 11px;
      color: #222;
    }

    .timbrado-box {
      margin-top: 0.4rem;
      padding: 0.3rem 0.5rem;
      border: 1px dashed #333;
      border-radius: 3px;
      font-size: 10.5px;
      width: 100%;
      background: #fafafa;
    }

    .timbrado-iva {
      font-weight: bold;
      margin-top: 0.15rem;
    }

    .ticket-divider {
      text-align: center;
      color: #555;
      font-size: 10px;
      overflow: hidden;
      white-space: nowrap;
      margin: 0.4rem 0;
      user-select: none;
    }

    .comprobante-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 12px;
      padding: 0.15rem 0;
    }

    .comprobante-tipo {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.25px;
    }

    .comprobante-nro {
      font-size: 12px;
      font-weight: 700;
    }

    .trx-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      margin-bottom: 0.15rem;
      color: #222;
    }

    .ticket-meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      font-size: 11px;
      margin-top: 0.25rem;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
    }

    .cliente-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 11.5px;
    }

    .info-line {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 10px;
      color: #555;
      text-transform: uppercase;
    }

    .info-value {
      word-break: break-word;
    }

    .ticket-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .ticket-table th {
      border-bottom: 1px solid #333;
      padding: 0.25rem 0;
      text-align: left;
      font-size: 10.5px;
      text-transform: uppercase;
    }

    .ticket-table td {
      padding: 0.35rem 0;
      vertical-align: top;
    }

    .col-cant {
      width: 15%;
      font-weight: bold;
    }

    .col-desc {
      width: 55%;
    }

    .col-subt {
      width: 30%;
      text-align: right;
      font-weight: bold;
    }

    .item-title {
      font-weight: 600;
    }

    .item-subinfo {
      font-size: 10px;
      color: #444;
      line-height: 1.2;
    }

    .item-unit-price {
      font-size: 9.5px;
      color: #666;
    }

    .totales-block {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      padding: 0.35rem 0;
      border-top: 1px dashed #333;
      border-bottom: 1px dashed #333;
    }

    .total-label {
      font-weight: 700;
    }

    .total-val {
      font-size: 11px;
      font-weight: 700;
    }

    .iva-box {
      font-size: 10px;
      border: 1px solid #ddd;
      padding: 0.35rem;
      border-radius: 3px;
      background: #fafafa;
    }

    .iva-title {
      font-weight: bold;
      text-align: center;
      margin-bottom: 0.2rem;
      text-transform: uppercase;
      font-size: 9.5px;
      color: #333;
    }

    .iva-row {
      display: flex;
      justify-content: space-between;
      color: #444;
    }

    .iva-total {
      font-weight: bold;
      border-top: 1px dashed #ccc;
      margin-top: 0.2rem;
      padding-top: 0.15rem;
      color: #000;
    }

    .iva-tag {
      font-size: 8.5px;
      font-weight: 600;
      color: #64748b;
      margin-left: 0.25rem;
    }

    .iva-tag-5 {
      color: #b45309;
    }

    .iva-tag-ex {
      color: #475569;
    }

    .ticket-notas {
      font-size: 10.5px;
      color: #333;
      font-style: italic;
    }

    .ticket-footer {
      text-align: center;
      font-size: 10.5px;
      margin-top: 0.4rem;
    }

    .footer-msg {
      font-weight: bold;
      margin: 0;
    }

    .footer-sub {
      margin: 0.1rem 0;
      color: #444;
    }

    .footer-legal {
      font-size: 9px;
      color: #666;
      margin: 0.3rem 0 0 0;
      text-transform: uppercase;
    }

    /* ESTILOS DE IMPRESIÓN */
    @media print {
      :host {
        display: block !important;
      }
      .no-print {
        display: none !important;
      }
      .comprobante-body {
        background: transparent !important;
        padding: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }
      .ticket-paper {
        box-shadow: none !important;
        max-width: 80mm !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    }

    .footer-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .printer-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin: 0;
    }

    .select-printer {
      font-size: 0.8125rem;
      padding: 0.3rem 0.6rem;
      height: 2.25rem;
      min-width: 170px;
    }

    .footer-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 680px) {
      .footer-wrapper {
        flex-direction: column;
        align-items: stretch;
      }
      .footer-left, .footer-actions {
        width: 100%;
        justify-content: space-between;
      }
    }

    .ticket-anulado-badge {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px dashed #ef4444;
      border-radius: 4px;
      padding: 0.35rem 0.5rem;
      font-weight: 800;
      font-size: 11px;
      text-align: center;
      margin-bottom: 0.5rem;
      width: 100%;
      letter-spacing: 0.5px;
    }

    .anular-modal-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .anular-warning-icon {
      color: #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .anular-text {
      font-size: 0.9375rem;
      color: var(--text-main, #0f172a);
      margin: 0;
    }

    .anular-info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 0.5rem;
      padding: 0.75rem;
      color: #92400e;
      font-size: 0.8125rem;
      text-align: left;
    }

    .anular-caja-cerrada-box {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 0.5rem;
      padding: 0.75rem;
      color: #991b1b;
      font-size: 0.8125rem;
      text-align: left;
    }

    .anular-auth-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      text-align: left;
      margin-top: 0.25rem;
    }

    .auth-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .auth-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main, #1e293b);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .auth-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: 0.375rem;
      outline: none;
      background: var(--bg-surface, #ffffff);
      color: var(--text-main, #0f172a);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .auth-input:focus {
      border-color: var(--primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ComprobanteModalComponent implements OnInit {
  public readonly institucionService = inject(InstitucionService);
  public readonly impresorasService = inject(ImpresorasService);
  private readonly pedidosService = inject(PedidosService);
  private readonly toast = inject(ToastService);

  isOpen = input<boolean>(false);
  pedido = input<Pedido | null>(null);
  close = output<void>();
  pedidoAnulado = output<number>();

  modalConfirmarAnular = signal<boolean>(false);
  anulando = signal<boolean>(false);
  adminPassword = '';
  motivoAnulacion = '';

  imprimiendoTicketera = signal<boolean>(false);
  impresoraSeleccionadaId: number | null = null;

  esFactura = computed(() => {
    return this.pedido()?.tipoComprobante === 'FACTURA';
  });

  modalTitle = computed(() => {
    const p = this.pedido();
    if (!p) return 'Comprobante';
    return p.tipoComprobante === 'FACTURA' ? `Factura Legal ${this.numeroComprobante()}` : `Ticket de Venta #${p.id}`;
  });

  numeroComprobante = computed(() => {
    const p = this.pedido();
    if (!p) return '';
    if (p.tipoComprobante === 'FACTURA' && p.numeroFactura) {
      return p.numeroFactura;
    }
    return `#${p.id}`;
  });

  trxId = computed(() => {
    const p = this.pedido();
    if (!p) return '';
    return p.trxId || (p.id ? `TRX-${p.id.toString().padStart(6, '0')}` : '');
  });

  detalles = computed(() => {
    const p = this.pedido();
    if (!p) return [];
    return p.detalles || p.items || [];
  });

  total = computed(() => {
    return this.pedido()?.total || 0;
  });

  totalExentas = computed(() => {
    const p = this.pedido();
    if (p?.totalExentas !== undefined && p.totalExentas !== null) {
      return p.totalExentas;
    }
    return this.detalles()
      .filter(d => (d.tipoIva || d.productoSimple?.tipoIva || d.presentacion?.tipoIva) === 'EXENTA')
      .reduce((acc, d) => acc + (d.subtotal || 0), 0);
  });

  totalMonto5 = computed(() => {
    return this.detalles()
      .filter(d => (d.tipoIva || d.productoSimple?.tipoIva || d.presentacion?.tipoIva) === 'IVA_5')
      .reduce((acc, d) => acc + (d.subtotal || 0), 0);
  });

  iva5 = computed(() => {
    const p = this.pedido();
    if (p?.totalIva5 !== undefined && p.totalIva5 !== null) {
      return p.totalIva5;
    }
    return Math.round(this.totalMonto5() / 21);
  });

  gravada5 = computed(() => {
    const p = this.pedido();
    if (p?.totalGravada5 !== undefined && p.totalGravada5 !== null) {
      return p.totalGravada5;
    }
    return this.totalMonto5() - this.iva5();
  });

  totalMonto10 = computed(() => {
    return this.detalles()
      .filter(d => {
        const tipo = d.tipoIva || d.productoSimple?.tipoIva || d.presentacion?.tipoIva;
        return !tipo || tipo === 'IVA_10';
      })
      .reduce((acc, d) => acc + (d.subtotal || 0), 0);
  });

  iva10 = computed(() => {
    const p = this.pedido();
    if (p?.totalIva10 !== undefined && p.totalIva10 !== null) {
      return p.totalIva10;
    }
    if (this.totalMonto5() === 0 && this.totalExentas() === 0) {
      return Math.round(this.total() / 11);
    }
    return Math.round(this.totalMonto10() / 11);
  });

  gravada10 = computed(() => {
    const p = this.pedido();
    if (p?.totalGravada10 !== undefined && p.totalGravada10 !== null) {
      return p.totalGravada10;
    }
    if (this.totalMonto5() === 0 && this.totalExentas() === 0) {
      return this.total() - this.iva10();
    }
    return this.totalMonto10() - this.iva10();
  });

  totalIva = computed(() => {
    const p = this.pedido();
    if (p?.totalIva !== undefined && p.totalIva !== null) {
      return p.totalIva;
    }
    return this.iva5() + this.iva10();
  });

  obtenerIndicadorIva(item: DetallePedido): string {
    const tipo = item.tipoIva || item.productoSimple?.tipoIva || item.presentacion?.tipoIva;
    if (tipo === 'IVA_5') return '5%';
    if (tipo === 'EXENTA') return 'Ex';
    return '10%';
  }

  fechaFormateada = computed(() => {
    const p = this.pedido();
    if (!p) return '';
    const raw = p.fechaCreacion || p.createdAt || p.fecha;
    if (!raw) return new Date().toLocaleString();
    try {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toLocaleString('es-PY');
    } catch {
      return raw;
    }
  });

  obtenerNombresSabores(sabores: any[]): string {
    return sabores.map(s => s.nombre || s).join(', ');
  }

  obtenerNombresToppings(toppings: any[]): string {
    return toppings.map(t => t.nombre || t).join(', ');
  }

  obtenerPrecioUnitario(item: DetallePedido): number {
    if (item.precioUnitario !== undefined && item.precioUnitario !== null) {
      return item.precioUnitario;
    }
    if (item.precio !== undefined && item.precio !== null) {
      return item.precio;
    }
    if (item.subtotal && item.cantidad) {
      return Math.round(item.subtotal / item.cantidad);
    }
    return 0;
  }

  constructor() {
    effect(() => {
      const imps = this.impresorasService.impresoras();
      if (imps.length > 0) {
        const saved = localStorage.getItem('pos_impresora_id');
        const savedId = saved ? Number(saved) : null;
        const exists = savedId ? imps.some(i => i.id === savedId) : false;
        if (exists && savedId) {
          this.impresoraSeleccionadaId = savedId;
        } else if (!this.impresoraSeleccionadaId) {
          const preferred = imps.find(i => i.nombre.toUpperCase().includes('FTX')) || imps[0];
          if (preferred && preferred.id) {
            this.impresoraSeleccionadaId = preferred.id;
            localStorage.setItem('pos_impresora_id', preferred.id.toString());
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.impresorasService.cargarImpresoras();
  }

  onCambiarImpresora(id: number | null): void {
    if (id !== null && id !== undefined) {
      localStorage.setItem('pos_impresora_id', id.toString());
    } else {
      localStorage.removeItem('pos_impresora_id');
    }
  }

  imprimirNavegador(): void {
    window.print();
  }

  imprimirTicketera(): void {
    const p = this.pedido();
    if (!p) return;

    const idImp = this.impresoraSeleccionadaId ? Number(this.impresoraSeleccionadaId) : undefined;
    this.imprimiendoTicketera.set(true);
    this.pedidosService.imprimirTicket(p.id, idImp).subscribe({
      next: () => {
        this.imprimiendoTicketera.set(false);
      },
      error: (err) => {
        this.imprimiendoTicketera.set(false);
        const msg = (typeof err.error === 'string' && err.error.trim().length > 0)
          ? err.error
          : (err.error?.mensaje || 'Error al comunicarse con la ticketera local.');
        this.toast.error(msg, 'Error Impresión Térmica');
      }
    });
  }

  abrirConfirmarAnular(): void {
    this.adminPassword = '';
    this.motivoAnulacion = '';
    this.modalConfirmarAnular.set(true);
  }

  cerrarConfirmarAnular(): void {
    this.modalConfirmarAnular.set(false);
    this.adminPassword = '';
    this.motivoAnulacion = '';
  }

  confirmarAnulacion(): void {
    const p = this.pedido();
    if (!p || !p.id) return;

    if (!this.adminPassword.trim()) {
      this.toast.error('Debe ingresar la contraseña de administrador para autorizar la anulación.');
      return;
    }

    this.anulando.set(true);
    this.pedidosService.cancelarPedido(p.id, {
      adminPassword: this.adminPassword.trim(),
      motivo: this.motivoAnulacion.trim() || undefined
    }).subscribe({
      next: () => {
        this.anulando.set(false);
        this.modalConfirmarAnular.set(false);
        this.adminPassword = '';
        this.motivoAnulacion = '';
        this.pedidoAnulado.emit(p.id);
        this.close.emit();
      },
      error: (err) => {
        this.anulando.set(false);
        const msg = (typeof err.error === 'string' && err.error.trim().length > 0)
          ? err.error
          : (err.error?.mensaje || 'No se pudo anular el comprobante. Verifique la contraseña de administrador.');
        this.toast.error(msg, 'Autorización Requerida');
      }
    });
  }
}
