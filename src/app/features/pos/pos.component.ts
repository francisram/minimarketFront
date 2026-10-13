import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PosService } from '../../core/services/pos.service';
import { CajaService } from '../../core/services/caja.service';
import { ToastService } from '../../core/services/toast.service';
import { Sabor } from '../../core/models/sabor.model';
import { Presentacion } from '../../core/models/presentacion.model';
import { Topping } from '../../core/models/topping.model';
import { ProductoSimple } from '../../core/models/producto-simple.model';
import { TipoEntrega, MetodoPago, TipoComprobante, CondicionVenta, Pedido } from '../../core/models/pedido.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';
import { ComprobanteModalComponent } from '../../shared/components/comprobante-modal/comprobante-modal.component';
import { ImpresorasService } from '../../core/services/impresoras.service';
import { ClientesService } from '../../core/services/clientes.service';
import { Cliente } from '../../core/models/cliente.model';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppIconComponent, AppModalComponent, AppCurrencyPipe, ComprobanteModalComponent],
  template: `
    <div class="pos-wrapper">
      <!-- PANEL IZQUIERDO: CATÁLOGO Y ARMADOR -->
      <div class="pos-main">
        <!-- ALERTA DE CAJA CERRADA / INDICADOR DE TURNO ACTIVO -->
        @if (!cajaService.cajaAbierta()) {
          <div class="caja-alerta-banner mb-3">
            <div class="caja-alerta-content">
              <div class="caja-alerta-icon">
                <app-icon name="alert-triangle" [size]="20" />
              </div>
              <div class="caja-alerta-text">
                <strong>Caja Cerrada:</strong> Debes abrir tu turno de caja para registrar y procesar cobros de ventas.
              </div>
            </div>
            <div class="caja-alerta-actions">
              <button type="button" class="btn btn-warning btn-sm" (click)="abrirModalAperturaRapida()">
                <app-icon name="banknote" [size]="16" />
                <span>Abrir Mi Turno</span>
              </button>
              <a routerLink="/caja" class="btn btn-secondary btn-sm">
                <span>Gestionar Cajas</span>
              </a>
            </div>
          </div>
        } @else {
          <div class="caja-activa-banner mb-3">
            <div class="d-flex align-center gap-2">
              <span class="status-dot-pulse"></span>
              <span class="caja-activa-label">
                <strong>Turno Activo:</strong> {{ cajaService.cajeroActivo() }} (Sesión #{{ cajaService.sesionActivaId() }})
              </span>
            </div>
            <div class="caja-activa-actions">
              <span class="text-muted small">Apertura: {{ cajaService.fechaAperturaActiva() | date:'HH:mm' }}</span>
              <a routerLink="/caja" class="caja-link-turnos">Ver Mi Arqueo</a>
            </div>
          </div>
        }

        <!-- BARRA SUPERIOR DE PESTAÑAS -->
        <div class="pos-tabs">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="tabActiva() === 'HELADOS'" 
            (click)="tabActiva.set('HELADOS')"
          >
            <app-icon name="ice-cream" [size]="20" />
            <span>Helados Artesanales</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="tabActiva() === 'PRODUCTOS'" 
            (click)="tabActiva.set('PRODUCTOS')"
          >
            <app-icon name="coffee" [size]="20" />
            <span>Bebidas y Cafetería</span>
            <span class="tab-badge">{{ posService.productosSimplesActivos().length }}</span>
          </button>
        </div>

        <!-- ==================== VISTA 1: ARMADO DE HELADOS ==================== -->
        @if (tabActiva() === 'HELADOS') {
          <div class="builder-container">
            <!-- PASO 1: SELECCIONAR PRESENTACIÓN -->
            <section class="builder-section">
              <div class="section-header">
                <span class="step-badge">1</span>
                <div>
                  <h2 class="section-title">Elige el Tamaño / Envase</h2>
                  <p class="section-desc">Selecciona la presentación para habilitar los sabores permitidos</p>
                </div>
              </div>

              <div class="presentaciones-grid">
                @for (pres of posService.presentacionesActivas(); track pres.id) {
                  <div
                    class="presentacion-card"
                    [class.selected]="posService.selectedPresentacion()?.id === pres.id"
                    [class.out-of-stock]="pres.stock !== undefined && pres.stock <= 0"
                    (click)="posService.seleccionarPresentacion(pres)"
                  >
                    <div class="pres-icon">
                      <app-icon name="cup-soda" [size]="24" />
                    </div>
                    <div class="pres-info">
                      <div class="pres-name">{{ pres.nombre }}</div>
                      <div class="pres-features">
                        <span class="feature-tag">Hasta {{ pres.maxSabores }} sabores</span>
                        @if (pres.pesoGramosAprox) {
                          <span class="feature-tag">~{{ pres.pesoGramosAprox }}g</span>
                        }
                        @if (pres.stock !== undefined) {
                          @if (pres.stock <= 0) {
                            <span class="badge badge-cancelado">Sin envases</span>
                          } @else if (pres.stockMinimo !== undefined && pres.stock <= pres.stockMinimo) {
                            <span class="badge badge-warning" title="Pocos envases en stock">Pocos envases ({{ pres.stock }})</span>
                          } @else {
                            <span class="feature-tag">{{ pres.stock }} disp.</span>
                          }
                        }
                      </div>
                    </div>
                    <div class="pres-price">{{ pres.precio | appCurrency }}</div>
                  </div>
                }
              </div>
            </section>

            <!-- PASO 2: SELECCIONAR SABORES -->
            <section class="builder-section" [class.disabled-section]="!posService.selectedPresentacion()">
              <div class="section-header space-between">
                <div class="d-flex align-center gap-2">
                  <span class="step-badge">2</span>
                  <div>
                    <h2 class="section-title">Selecciona los Sabores</h2>
                    <p class="section-desc">
                      @if (posService.selectedPresentacion()) {
                        Permite hasta {{ posService.maxSaboresPermitidos() }} sabor(es)
                      } @else {
                        Selecciona un envase arriba para habilitar sabores
                      }
                    </p>
                  </div>
                </div>

                @if (posService.selectedPresentacion()) {
                  <div class="flavor-counter" [class.counter-full]="!posService.puedeAgregarMasSabores()">
                    <span class="counter-label">Seleccionados:</span>
                    <strong class="counter-val">
                      {{ posService.cantidadSaboresSeleccionados() }} / {{ posService.maxSaboresPermitidos() }}
                    </strong>
                  </div>
                }
              </div>

              <!-- FILTROS POR CATEGORÍA -->
              <div class="categoria-filters">
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="filtroCategoria() === 'TODOS'"
                  (click)="filtroCategoria.set('TODOS')"
                >
                  Todos
                </button>
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="filtroCategoria() === 'DULCE_DE_LECHE'"
                  (click)="filtroCategoria.set('DULCE_DE_LECHE')"
                >
                  Dulce de Leche
                </button>
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="filtroCategoria() === 'CHOCOLATE'"
                  (click)="filtroCategoria.set('CHOCOLATE')"
                >
                  Chocolates
                </button>
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="filtroCategoria() === 'FRUTAL'"
                  (click)="filtroCategoria.set('FRUTAL')"
                >
                  Frutales
                </button>
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="filtroCategoria() === 'CREMA'"
                  (click)="filtroCategoria.set('CREMA')"
                >
                  Cremas
                </button>
              </div>

              <!-- GRID DE SABORES -->
              <div class="sabores-grid">
                @for (sabor of saboresFiltrados(); track sabor.id) {
                  <div
                    class="sabor-card"
                    [class.selected]="esSaborSeleccionado(sabor)"
                    [class.unavailable]="!sabor.disponible || (sabor.stockKilos !== undefined && sabor.stockKilos <= 0)"
                    (click)="onSaborClick(sabor)"
                  >
                    <div class="sabor-top">
                      <span class="sabor-name">{{ sabor.nombre }}</span>
                      @if (esSaborSeleccionado(sabor)) {
                        <span class="check-indicator">
                          <app-icon name="check" [size]="14" />
                        </span>
                      }
                    </div>

                    <!-- CHIPS DIETARIOS Y ALERTA DE STOCK DE HELADO -->
                    <div class="diet-badges">
                      @if (sabor.aptoCeliaco) {
                        <span class="badge badge-celiaco" title="Apto para Celíacos (Sin TACC)">Sin TACC</span>
                      }
                      @if (sabor.esVegano) {
                        <span class="badge badge-vegano" title="Apto Vegano">Vegano</span>
                      }
                      @if (sabor.sinAzucar) {
                        <span class="badge badge-sinazucar" title="Sin Azúcar Agregada">Sin Azúcar</span>
                      }
                      @if (!sabor.disponible || (sabor.stockKilos !== undefined && sabor.stockKilos <= 0)) {
                        <span class="badge badge-danger">Agotado</span>
                      } @else if (sabor.stockKilos !== undefined && sabor.stockMinimoKilos !== undefined && sabor.stockKilos <= sabor.stockMinimoKilos) {
                        <span class="badge badge-warning" title="Poco helado en bacha">Quedan {{ sabor.stockKilos }} kg</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- PASO 3: TOPPINGS Y BOTÓN AGREGAR -->
            <section class="builder-section" [class.disabled-section]="!posService.selectedPresentacion()">
              <div class="section-header">
                <span class="step-badge">3</span>
                <div>
                  <h2 class="section-title">Toppings y Agregados (Opcional)</h2>
                  <p class="section-desc">Salsas, praliné, confites y adicionales</p>
                </div>
              </div>

              <div class="toppings-list">
                @for (topping of posService.toppingsDisponibles(); track topping.id) {
                  <div
                    class="topping-card"
                    [class.selected]="esToppingSeleccionado(topping)"
                    (click)="posService.toggleTopping(topping)"
                  >
                    <div class="d-flex align-center gap-2">
                      <app-icon [name]="esToppingSeleccionado(topping) ? 'check' : 'plus'" [size]="16" />
                      <span class="topping-name">{{ topping.nombre }}</span>
                    </div>
                    <span class="topping-price">+ {{ topping.precioExtra | appCurrency }}</span>
                  </div>
                }
              </div>

              <!-- BOTÓN FINALIZAR ARMADO DE HELADO -->
              <div class="builder-submit-bar">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="posService.resetArmadoHelado()"
                  [disabled]="!posService.selectedPresentacion()"
                >
                  Limpiar Selección
                </button>

                <button
                  type="button"
                  class="btn btn-primary btn-lg"
                  (click)="agregarHelado()"
                  [disabled]="!posService.selectedPresentacion() || posService.cantidadSaboresSeleccionados() === 0"
                >
                  <app-icon name="plus" [size]="20" />
                  <span>Agregar al Ticket</span>
                </button>
              </div>
            </section>
          </div>
        }

        <!-- ==================== VISTA 2: PRODUCTOS SIMPLES ==================== -->
        @if (tabActiva() === 'PRODUCTOS') {
          <div class="simple-products-container">
            <div class="search-bar">
              <app-icon name="search" [size]="18" />
              <input
                type="text"
                placeholder="Buscar bebidas, café, postres..."
                [(ngModel)]="busquedaProducto"
                class="search-input"
              />
            </div>

            <div class="productos-grid">
              @for (prod of productosFiltrados(); track prod.id) {
                <div 
                  class="producto-card" 
                  [class.out-of-stock]="prod.stock <= 0"
                  (click)="agregarProducto(prod)"
                >
                  <div class="prod-badge-stock" [class.low-stock]="prod.stock > 0 && prod.stock <= 5">
                    {{ prod.stock > 0 ? (prod.stock + ' disp.') : 'Sin stock' }}
                  </div>
                  <div class="prod-icon-box">
                    <app-icon name="coffee" [size]="32" />
                  </div>
                  <div class="prod-details">
                    <div class="prod-name">{{ prod.nombre }}</div>
                    <div class="prod-price">{{ prod.precio | appCurrency }}</div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline prod-add-btn"
                    [disabled]="prod.stock <= 0"
                    (click)="$event.stopPropagation(); agregarProducto(prod)"
                  >
                    <app-icon name="plus" [size]="16" />
                    <span>Agregar</span>
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- PANEL DERECHO: TICKET EN TIEMPO REAL -->
      <aside class="pos-ticket">
        <div class="ticket-header">
          <div class="ticket-header-title">
            <app-icon name="clipboard-list" [size]="20" />
            <span>Ticket de Venta</span>
          </div>
          <span class="ticket-count-badge">{{ posService.cantidadTotalItems() }} ítems</span>
        </div>

        <!-- ITEMS DEL TICKET -->
        <div class="ticket-items-list">
          @if (posService.ticketItems().length === 0) {
            <div class="empty-ticket">
              <div class="empty-ticket-icon">
                <app-icon name="shopping-cart" [size]="40" />
              </div>
              <p class="empty-ticket-text">El ticket está vacío</p>
              <span class="empty-ticket-sub">Selecciona un helado o producto simple para comenzar</span>
            </div>
          } @else {
            @for (item of posService.ticketItems(); track item.idLocal) {
              <div class="ticket-item-row">
                <div class="item-main-info">
                  <div class="item-title-line">
                    <span class="item-name">
                      @if (item.tipoItem === 'HELADO') {
                        {{ item.presentacion?.nombre }}
                      } @else {
                        {{ item.productoSimple?.nombre }}
                      }
                      @if (item.tipoIva === 'IVA_5') {
                        <span class="badge badge-warning" style="font-size: 0.68rem; padding: 0.1rem 0.35rem; margin-left: 0.3rem;">5%</span>
                      } @else if (item.tipoIva === 'EXENTA') {
                        <span class="badge badge-secondary" style="font-size: 0.68rem; padding: 0.1rem 0.35rem; margin-left: 0.3rem;">Ex</span>
                      }
                    </span>
                    <span class="item-subtotal">{{ item.subtotal | appCurrency }}</span>
                  </div>

                  @if (item.tipoItem === 'HELADO') {
                    <div class="item-flavors">
                      <strong>Sabores:</strong> {{ obtenerNombresSabores(item.sabores) }}
                    </div>
                    @if (item.toppings.length > 0) {
                      <div class="item-toppings">
                        <strong>Toppings:</strong> {{ obtenerNombresToppings(item.toppings) }}
                      </div>
                    }
                  }
                </div>

                <!-- CONTROLES DE CANTIDAD Y ELIMINAR -->
                <div class="item-actions">
                  <div class="qty-control">
                    <button 
                      type="button" 
                      class="btn-qty" 
                      (click)="posService.actualizarCantidad(item.idLocal, -1)"
                      aria-label="Disminuir"
                    >
                      <app-icon name="minus" [size]="14" />
                    </button>
                    <span class="qty-value">{{ item.cantidad }}</span>
                    <button 
                      type="button" 
                      class="btn-qty" 
                      (click)="posService.actualizarCantidad(item.idLocal, 1)"
                      aria-label="Aumentar"
                    >
                      <app-icon name="plus" [size]="14" />
                    </button>
                  </div>

                  <button 
                    type="button" 
                    class="btn-trash" 
                    (click)="posService.eliminarItem(item.idLocal)"
                    title="Eliminar ítem"
                  >
                    <app-icon name="trash" [size]="16" />
                  </button>
                </div>
              </div>
            }
          }
        </div>

        <!-- TOTALES Y BOTÓN FINALIZAR -->
        <div class="ticket-footer">
          <div class="totals-breakdown">
            <div class="total-row total-final">
              <span class="total-label">TOTAL A COBRAR</span>
              <span class="total-value">{{ posService.totalTicket() | appCurrency }}</span>
            </div>
          </div>

          <div class="ticket-buttons">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              (click)="posService.limpiarTicket()"
              [disabled]="posService.ticketItems().length === 0"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-lg flex-1"
              [disabled]="posService.ticketItems().length === 0"
              (click)="abrirModalCheckout()"
            >
              <span>Finalizar Venta</span>
              <app-icon name="arrow-right" [size]="18" />
            </button>
          </div>
        </div>
      </aside>

      <!-- ==================== MODAL DE CHECKOUT ==================== -->
      <app-modal
        [isOpen]="modalCheckoutAbierto()"
        title="Confirmar Pedido y Cobro"
        size="lg"
        (close)="cerrarModalCheckout()"
      >
        <div body class="checkout-form">
          @if (!cajaService.cajaAbierta()) {
            <div class="caja-bloqueo-box mb-3">
              <div class="d-flex align-center gap-2 mb-2">
                <app-icon name="alert-triangle" [size]="18" />
                <strong>Atención: La caja se encuentra cerrada</strong>
              </div>
              <p class="m-0 text-sm mb-2">
                Debes abrir una sesión de caja para poder registrar y cobrar esta venta en el sistema.
              </p>
              <button type="button" class="btn btn-warning btn-sm" (click)="abrirModalAperturaRapida()">
                <app-icon name="banknote" [size]="16" />
                <span>Abrir Caja Ahora</span>
              </button>
            </div>
          }

          <div class="checkout-summary-bar">
            <span>Total del pedido:</span>
            <strong>{{ posService.totalTicket() | appCurrency }}</strong>
          </div>

          <!-- TIPO DE COMPROBANTE -->
          <div class="form-group mb-3">
            <label class="form-label">Tipo de Comprobante *</label>
            <div class="comprobante-options">
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.tipoComprobante === 'TICKET'"
                (click)="onSeleccionarTipoComprobante('TICKET')"
              >
                <app-icon name="printer" [size]="20" />
                <span>Ticket de Venta</span>
              </button>
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.tipoComprobante === 'FACTURA'"
                (click)="onSeleccionarTipoComprobante('FACTURA')"
              >
                <app-icon name="file-text" [size]="20" />
                <span>Factura Legal</span>
              </button>
            </div>
          </div>

          <!-- DATOS DEL CLIENTE (FACTURA vs TICKET) -->
          @if (checkoutData.tipoComprobante === 'FACTURA') {
            <div class="fiscal-inputs-box mb-3">
              <div class="fiscal-inputs-header">
                <app-icon name="file-text" [size]="16" />
                <span>Datos Fiscales del Cliente (Obligatorios)</span>
              </div>
              <div class="form-grid-2">
                <div class="form-group autocomplete-group">
                  <div class="field-header-row">
                    <label class="form-label" for="clienteRuc">R.U.C. o C.I. *</label>
                    @if (buscandoCliente()) {
                      <span class="searching-badge">
                        <app-icon name="refresh" [size]="12" extraClass="spin-icon" />
                        <span>Buscando...</span>
                      </span>
                    } @else if (clienteExistente()) {
                      <span class="existing-badge" title="Cliente registrado en el sistema">
                        <app-icon name="check" [size]="12" />
                        <span>Registrado</span>
                      </span>
                    } @else if (checkoutData.clienteRuc && checkoutData.clienteRuc.trim().length >= 3) {
                      <span class="new-client-badge" title="Se guardará automáticamente al emitir la factura">
                        <app-icon name="plus" [size]="12" />
                        <span>Nuevo</span>
                      </span>
                    }
                  </div>
                  <div class="input-with-icon">
                    <input
                      id="clienteRuc"
                      type="text"
                      class="form-control"
                      placeholder="Ej. 1234567-8 o 4567890"
                      [ngModel]="checkoutData.clienteRuc"
                      (ngModelChange)="onInputRuc($event)"
                      (focus)="onFocusRuc()"
                      (blur)="ocultarSugerenciasConDelay()"
                      autocomplete="off"
                      required
                    />
                  </div>

                  <!-- DROPDOWN DE SUGERENCIAS -->
                  @if (mostrarSugerenciasClientes() && clientesSugeridos().length > 0) {
                    <div class="autocomplete-dropdown">
                      @for (sug of clientesSugeridos(); track sug.id) {
                        <div
                          class="autocomplete-item"
                          (mousedown)="seleccionarClienteSugerido(sug)"
                        >
                          <div class="autocomplete-ruc-row">
                            <span class="autocomplete-ruc">{{ sug.ruc }}</span>
                            <span class="autocomplete-name">{{ sug.razonSocial }}</span>
                          </div>
                          @if (sug.direccion) {
                            <div class="autocomplete-address">{{ sug.direccion }}</div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
                <div class="form-group">
                  <label class="form-label" for="clienteNombreFactura">Razón Social / Nombre *</label>
                  <input
                    id="clienteNombreFactura"
                    type="text"
                    class="form-control"
                    placeholder="Ej. Juan Pérez / Empresa S.A."
                    [(ngModel)]="checkoutData.clienteNombre"
                    required
                  />
                </div>
              </div>

              <div class="form-group mt-2">
                <label class="form-label" for="clienteDireccion">Dirección Fiscal</label>
                <input
                  id="clienteDireccion"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Avda. España 456"
                  [(ngModel)]="checkoutData.clienteDireccion"
                />
              </div>

              <div class="form-group mt-2">
                <label class="form-label">Condición de Venta</label>
                <div class="condicion-options">
                  <button
                    type="button"
                    class="option-tile-sm"
                    [class.active]="checkoutData.condicionVenta === 'CONTADO'"
                    (click)="checkoutData.condicionVenta = 'CONTADO'"
                  >
                    <span>Contado</span>
                  </button>
                  <button
                    type="button"
                    class="option-tile-sm"
                    [class.active]="checkoutData.condicionVenta === 'CREDITO'"
                    (click)="checkoutData.condicionVenta = 'CREDITO'"
                  >
                    <span>Crédito</span>
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <!-- CLIENTE TICKET -->
            <div class="form-group">
              <label class="form-label" for="clienteNombre">Nombre del Cliente (Opcional)</label>
              <input
                id="clienteNombre"
                type="text"
                class="form-control"
                placeholder="Ej. Consumidor Final o Nombre"
                [(ngModel)]="checkoutData.clienteNombre"
              />
            </div>
          }

          <!-- TIPO DE ENTREGA -->
          <div class="form-group">
            <label class="form-label">Tipo de Entrega</label>
            <div class="delivery-options">
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.tipoEntrega === 'MOSTRADOR'"
                (click)="checkoutData.tipoEntrega = 'MOSTRADOR'"
              >
                <app-icon name="ice-cream" [size]="20" />
                <span>Mostrador</span>
              </button>
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.tipoEntrega === 'TAKE_AWAY'"
                (click)="checkoutData.tipoEntrega = 'TAKE_AWAY'"
              >
                <app-icon name="shopping-cart" [size]="20" />
                <span>Take Away</span>
              </button>
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.tipoEntrega === 'DELIVERY'"
                (click)="checkoutData.tipoEntrega = 'DELIVERY'"
              >
                <app-icon name="arrow-right" [size]="20" />
                <span>Delivery</span>
              </button>
            </div>
          </div>

          <!-- MÉTODO DE PAGO -->
          <div class="form-group">
            <label class="form-label">Método de Pago</label>
            <div class="payment-options">
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.metodoPago === 'EFECTIVO'"
                (click)="onSeleccionarMetodoPago('EFECTIVO')"
              >
                <span>💵 Efectivo</span>
              </button>
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.metodoPago === 'TARJETA_DEBITO'"
                (click)="onSeleccionarMetodoPago('TARJETA_DEBITO')"
              >
                <span>💳 Débito</span>
              </button>
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.metodoPago === 'TARJETA_CREDITO'"
                (click)="onSeleccionarMetodoPago('TARJETA_CREDITO')"
              >
                <span>💳 Crédito</span>
              </button>
              <button
                type="button"
                class="option-tile"
                [class.active]="checkoutData.metodoPago === 'TRANSFERENCIA_QR'"
                (click)="onSeleccionarMetodoPago('TRANSFERENCIA_QR')"
              >
                <span>📱 QR / Transf.</span>
              </button>
            </div>
          </div>

          <!-- CAMPO NRO DE VOUCHER (OBLIGATORIO PARA TARJETA DÉBITO Y CRÉDITO) -->
          @if (esVoucherRequerido) {
            <div class="voucher-box mb-3" [class.has-error]="voucherTouched() && esVoucherInvalido()">
              <div class="voucher-header">
                <app-icon name="banknote" [size]="16" />
                <label class="form-label m-0" for="voucherInput">
                  <strong>N° de Boleta / Voucher POS *</strong>
                </label>
                <span class="badge-voucher-req">Obligatorio</span>
              </div>
              <input
                id="voucherInput"
                type="text"
                class="form-control input-voucher"
                [class.is-invalid]="voucherTouched() && esVoucherInvalido()"
                placeholder="Ingresa el N° de boleta o comprobante POS (Ej. 123456)..."
                [(ngModel)]="checkoutData.numeroVoucher"
                (ngModelChange)="onVoucherInput()"
                (blur)="voucherTouched.set(esVoucherInvalido())"
                autocomplete="off"
                required
              />
              @if (voucherTouched() && esVoucherInvalido()) {
                <div class="form-error text-danger mt-1" style="font-size: 0.8125rem; font-weight: 600;">
                  ⚠️ El número de voucher o boleta es obligatorio para pagos con tarjeta.
                </div>
              } @else {
                <span class="form-hint">
                  Registra el número del comprobante impreso por el dispositivo POS (Bancard, Dinelco, etc.)
                </span>
              }
            </div>
          }

          <!-- IMPRESORA DE TICKET / FACTURA -->
          <div class="form-group">
            <label class="form-label" for="impresoraSelect">
              <span class="d-flex align-center gap-1">
                <app-icon name="printer" [size]="16" />
                <span>Impresora Térmica (Ticket / Factura)</span>
              </span>
            </label>
            <select
              id="impresoraSelect"
              class="form-control"
              [(ngModel)]="checkoutData.impresoraId"
              (ngModelChange)="onCambiarImpresora($event)"
            >
              <option [ngValue]="null">🚫 No imprimir automáticamente (Solo en pantalla)</option>
              @for (imp of impresorasService.impresoras(); track imp.id) {
                <option [ngValue]="imp.id">
                  🖨️ {{ imp.nombre }} ({{ imp.tipoConexion }}{{ imp.ip ? ' - ' + imp.ip : '' }})
                </option>
              }
            </select>
            @if (impresorasService.impresoras().length === 0) {
              <small class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem; display: block;">
                No hay impresoras térmicas registradas. Puedes configurarlas en Ajustes > Impresoras.
              </small>
            }
          </div>

          <!-- NOTAS -->
          <div class="form-group">
            <label class="form-label" for="notasPedido">Notas adicionales / Instrucciones</label>
            <textarea
              id="notasPedido"
              class="form-control"
              rows="2"
              placeholder="Ej. Bien frío, servir en vaso, enviar servilletas..."
              [(ngModel)]="checkoutData.notas"
            ></textarea>
          </div>
        </div>

        <div footer>
          <button
            type="button"
            class="btn btn-secondary"
            (click)="cerrarModalCheckout()"
            [disabled]="posService.guardandoPedido()"
          >
            Volver
          </button>
          <button
            type="button"
            class="btn btn-success btn-lg"
            (click)="confirmarVenta()"
            [disabled]="posService.guardandoPedido() || !cajaService.cajaAbierta()"
          >
            @if (posService.guardandoPedido()) {
              <span>Registrando venta...</span>
            } @else if (!cajaService.cajaAbierta()) {
              <app-icon name="lock" [size]="18" />
              <span>Caja Cerrada</span>
            } @else {
              <app-icon name="check" [size]="18" />
              <span>Confirmar y Cobrar</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL DE APERTURA RÁPIDA DE CAJA ==================== -->
      <app-modal
        [isOpen]="modalAperturaRapidaAbierto()"
        title="Apertura Rápida de Caja"
        size="md"
        (close)="cerrarModalAperturaRapida()"
      >
        <div body class="modal-caja-body">
          <div class="info-alert mb-3">
            <app-icon name="banknote" [size]="20" />
            <span>Ingresa el fondo inicial de cambio en efectivo para habilitar el cobro de ventas en este turno.</span>
          </div>

          <div class="form-group mb-3">
            <label class="form-label" for="posMontoInicial">Fondo Inicial en Efectivo (Gs.) *</label>
            <div class="input-currency-wrapper">
              <span class="currency-prefix">Gs.</span>
              <input
                id="posMontoInicial"
                type="number"
                min="0"
                step="5000"
                class="form-control"
                placeholder="Ej. 100000"
                [(ngModel)]="aperturaRapidaMonto"
              />
            </div>
            <div class="quick-amounts">
              <button type="button" class="btn-chip" (click)="aperturaRapidaMonto = 50000">50.000</button>
              <button type="button" class="btn-chip" (click)="aperturaRapidaMonto = 100000">100.000</button>
              <button type="button" class="btn-chip" (click)="aperturaRapidaMonto = 200000">200.000</button>
              <button type="button" class="btn-chip" (click)="aperturaRapidaMonto = 300000">300.000</button>
              <button type="button" class="btn-chip" (click)="aperturaRapidaMonto = 500000">500.000</button>
            </div>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalAperturaRapida()" [disabled]="cajaService.procesando()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="confirmarAperturaRapida()"
            [disabled]="cajaService.procesando() || aperturaRapidaMonto < 0"
          >
            @if (cajaService.procesando()) {
              <span>Abriendo caja...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>Abrir Caja y Continuar</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL COMPROBANTE EMITIDO ==================== -->
      <app-comprobante-modal
        [isOpen]="modalComprobanteAbierto()"
        [pedido]="ultimoPedidoEmitido()"
        (close)="cerrarModalComprobante()"
      />
    </div>
  `,
  styles: [`
    /* ALERTA Y BLOQUEO DE CAJA */
    .caja-activa-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-lg);
      padding: 0.6rem 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .status-dot-pulse {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
    }
    .caja-activa-label {
      color: #166534;
      font-size: 0.875rem;
    }
    .caja-activa-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .caja-link-turnos {
      color: #15803d;
      font-weight: 600;
      font-size: 0.8125rem;
      text-decoration: underline;
    }
    .caja-link-turnos:hover {
      color: #166534;
    }
    .caja-alerta-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fef3c7;
      border: 1px solid #fde047;
      border-radius: var(--radius-lg);
      padding: 0.75rem 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .caja-alerta-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #92400e;
      font-size: 0.9rem;
    }
    .caja-alerta-icon {
      color: #d97706;
      display: flex;
      align-items: center;
    }
    .caja-alerta-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .caja-bloqueo-box {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      padding: 0.75rem 1rem;
      border-radius: 8px;
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
    }

    .pos-wrapper {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1.5rem;
      align-items: start;
    }

    /* PESTAÑAS SUPERIORES */
    .pos-tabs {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
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
      background: rgba(255, 255, 255, 0.2);
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.75rem;
    }

    /* ARMADOR */
    .builder-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .builder-section {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      transition: opacity 0.2s;
    }

    .disabled-section {
      opacity: 0.5;
      pointer-events: none;
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      margin-bottom: 1.125rem;
    }

    .section-header.space-between {
      justify-content: space-between;
      align-items: center;
    }

    .step-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-title {
      font-size: 1.05rem;
      margin: 0;
      color: var(--text-main);
    }

    .section-desc {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0;
    }

    .flavor-counter {
      padding: 0.4rem 0.85rem;
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid var(--border-color);
    }

    .counter-full {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
    }

    .counter-label {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .counter-val {
      font-size: 0.9375rem;
      font-weight: 700;
    }

    /* PRESENTACIONES GRID */
    .presentaciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.875rem;
    }

    .presentacion-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;
      background: var(--bg-surface);
    }

    .presentacion-card:hover {
      border-color: var(--primary);
      background: #fffbeb;
    }

    .presentacion-card.selected {
      border-color: var(--primary);
      background: #fef3c7;
      box-shadow: 0 0 0 2px var(--primary);
    }

    .pres-icon {
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .pres-name {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }

    .pres-features {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 0.75rem;
    }

    .feature-tag {
      font-size: 0.72rem;
      background: rgba(0, 0, 0, 0.05);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      color: var(--text-muted);
    }

    .pres-price {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary);
    }

    /* FILTROS SABORES */
    .categoria-filters {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }

    .filter-chip {
      padding: 0.35rem 0.85rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: 999px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-muted);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .filter-chip.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }

    /* GRID SABORES */
    .sabores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 0.75rem;
    }

    .sabor-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 90px;
      transition: all 0.15s;
      background: var(--bg-surface);
    }

    .sabor-card:hover:not(.unavailable) {
      border-color: var(--border-focus);
      background: #fafafa;
    }

    .sabor-card.selected {
      border-color: var(--primary);
      background: #fffbeb;
      box-shadow: 0 0 0 1px var(--primary);
    }

    .sabor-card.unavailable {
      opacity: 0.45;
      cursor: not-allowed;
      background: #f8fafc;
    }

    .sabor-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .sabor-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .check-indicator {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .diet-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    /* TOPPINGS */
    .toppings-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.65rem;
      margin-bottom: 1.25rem;
    }

    .topping-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s;
    }

    .topping-card:hover {
      background: var(--bg-subtle);
    }

    .topping-card.selected {
      border-color: var(--color-success);
      background: #f0fdf4;
      color: #166534;
    }

    .topping-name {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .topping-price {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
    }

    .builder-submit-bar {
      display: flex;
      justify-content: flex-end;
      gap: 0.875rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    /* PRODUCTOS SIMPLES */
    .simple-products-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.875rem;
    }

    .productos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .producto-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem 1rem;
      text-align: center;
      cursor: pointer;
      position: relative;
      transition: all 0.15s;
      background: var(--bg-surface);
    }

    .producto-card:hover:not(.out-of-stock) {
      box-shadow: var(--shadow-md);
      border-color: var(--border-focus);
    }

    .producto-card.out-of-stock {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .prod-badge-stock {
      position: absolute;
      top: 0.65rem;
      right: 0.65rem;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: #e2e8f0;
      color: #475569;
    }

    .prod-badge-stock.low-stock {
      background: #ffedd5;
      color: #9a3412;
    }

    .prod-icon-box {
      color: var(--primary);
      margin: 0.5rem 0;
    }

    .prod-name {
      font-weight: 700;
      font-size: 0.9375rem;
      margin-bottom: 0.25rem;
    }

    .prod-price {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 0.85rem;
    }

    .prod-add-btn {
      width: 100%;
    }

    /* ASIDE: TICKET EN VIVO */
    .pos-ticket {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 100px);
      position: sticky;
      top: 80px;
      box-shadow: var(--shadow-sm);
    }

    .ticket-header {
      padding: 1.125rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0f172a;
      color: #ffffff;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .ticket-header-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1rem;
    }

    .ticket-count-badge {
      background: #f59e0b;
      color: #0f172a;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .ticket-items-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .empty-ticket {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    .empty-ticket-icon {
      color: var(--text-light);
      margin-bottom: 0.75rem;
    }

    .empty-ticket-text {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }

    .empty-ticket-sub {
      font-size: 0.8125rem;
    }

    .ticket-item-row {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem;
      background: var(--bg-surface);
    }

    .item-title-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.35rem;
    }

    .item-name {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--text-main);
    }

    .item-subtotal {
      font-weight: 800;
      font-size: 0.9375rem;
      color: var(--primary);
    }

    .item-flavors, .item-toppings {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.3;
      margin-top: 0.2rem;
    }

    .item-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--border-color);
    }

    .qty-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-subtle);
      border-radius: var(--radius-sm);
      padding: 0.15rem 0.35rem;
    }

    .btn-qty {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      color: var(--text-main);
    }

    .qty-value {
      font-weight: 700;
      font-size: 0.8125rem;
      min-width: 16px;
      text-align: center;
    }

    .btn-trash {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
    }

    .ticket-footer {
      padding: 1.25rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-subtle);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }

    .totals-breakdown {
      margin-bottom: 1rem;
    }

    .total-final {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-label {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .total-value {
      font-size: 1.45rem;
      font-weight: 900;
      color: var(--text-main);
    }

    .ticket-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .flex-1 {
      flex: 1;
    }

    /* CHECKOUT MODAL */
    .checkout-form {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .checkout-summary-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #fef3c7;
      border-radius: var(--radius-md);
      font-size: 1.1rem;
      color: #92400e;
    }

    .delivery-options, .payment-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 0.65rem;
    }

    .option-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.75rem 0.5rem;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
      transition: all 0.15s;
    }

    .option-tile:hover {
      border-color: var(--primary);
    }

    .option-tile.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }

    .voucher-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      transition: all 0.2s ease;
    }

    .voucher-box.has-error {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    .voucher-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1e40af;
      margin-bottom: 0.35rem;
    }

    .voucher-box.has-error .voucher-header {
      color: #dc2626;
    }

    .badge-voucher-req {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
      margin-left: auto;
    }

    .input-voucher {
      font-weight: 600;
      letter-spacing: 0.5px;
      background: #ffffff;
      transition: all 0.2s ease;
    }

    .input-voucher.is-invalid {
      border-color: #ef4444;
      background-color: #fff;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }

    .comprobante-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .fiscal-inputs-box {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem;
    }

    .fiscal-inputs-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.75rem;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .condicion-options {
      display: flex;
      gap: 0.5rem;
    }

    .option-tile-sm {
      flex: 1;
      padding: 0.45rem 0.5rem;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.75rem;
      text-align: center;
      transition: all 0.15s;
    }

    .option-tile-sm.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }

    /* AUTOCOMPLETE CLIENTES */
    .autocomplete-group {
      position: relative;
    }

    .field-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .searching-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.7rem;
      color: var(--primary, #0284c7);
      font-weight: 600;
    }

    .existing-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.7rem;
      color: #15803d;
      background: #dcfce7;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      font-weight: 600;
    }

    .new-client-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.7rem;
      color: #0369a1;
      background: #e0f2fe;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      font-weight: 600;
    }

    .autocomplete-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
      z-index: 50;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 0.25rem;
    }

    .autocomplete-item {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s;
    }

    .autocomplete-item:last-child {
      border-bottom: none;
    }

    .autocomplete-item:hover {
      background: #f8fafc;
    }

    .autocomplete-ruc-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .autocomplete-ruc {
      font-family: monospace;
      font-weight: 700;
      color: #0369a1;
      font-size: 0.8125rem;
      background: #e0f2fe;
      padding: 0.1rem 0.35rem;
      border-radius: 0.25rem;
    }

    .autocomplete-name {
      font-weight: 600;
      font-size: 0.8125rem;
      color: #0f172a;
    }

    .autocomplete-address {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.15rem;
    }

    /* RESPONSIVE */
    @media (max-width: 1100px) {
      .pos-wrapper {
        grid-template-columns: 1fr;
      }
      .pos-ticket {
        position: static;
        height: auto;
        max-height: 500px;
      }
    }
  `]
})
export class PosComponent implements OnInit {
  public readonly posService = inject(PosService);
  public readonly cajaService = inject(CajaService);
  public readonly impresorasService = inject(ImpresorasService);
  public readonly clientesService = inject(ClientesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  public readonly tabActiva = signal<'HELADOS' | 'PRODUCTOS'>('HELADOS');
  public readonly filtroCategoria = signal<string>('TODOS');
  public busquedaProducto: string = '';

  public readonly modalCheckoutAbierto = signal<boolean>(false);
  public readonly modalAperturaRapidaAbierto = signal<boolean>(false);
  public readonly modalComprobanteAbierto = signal<boolean>(false);
  public readonly ultimoPedidoEmitido = signal<Pedido | null>(null);
  public aperturaRapidaMonto: number = 100000;

  // Autocompletado reactivo de clientes
  public readonly clientesSugeridos = signal<Cliente[]>([]);
  public readonly buscandoCliente = signal<boolean>(false);
  public readonly clienteExistente = signal<Cliente | null>(null);
  public readonly mostrarSugerenciasClientes = signal<boolean>(false);
  public readonly voucherTouched = signal<boolean>(false);
  private readonly busquedaRucSubject = new Subject<string>();

  public checkoutData: {
    clienteNombre: string;
    tipoEntrega: TipoEntrega;
    metodoPago: MetodoPago;
    numeroVoucher: string;
    notas: string;
    tipoComprobante: TipoComprobante;
    condicionVenta: CondicionVenta;
    clienteRuc: string;
    clienteDireccion: string;
    impresoraId: number | null;
  } = {
    clienteNombre: '',
    tipoEntrega: 'MOSTRADOR',
    metodoPago: 'EFECTIVO',
    numeroVoucher: '',
    notas: '',
    tipoComprobante: 'TICKET',
    condicionVenta: 'CONTADO',
    clienteRuc: '',
    clienteDireccion: '',
    impresoraId: null
  };

  ngOnInit(): void {
    this.cajaService.cargarEstado().subscribe();
    this.posService.cargarCatalogos();
    this.impresorasService.cargarImpresoras();

    const savedPrinter = localStorage.getItem('pos_impresora_id');
    if (savedPrinter) {
      this.checkoutData.impresoraId = Number(savedPrinter);
    }

    // Suscripción reactiva para autocompletar clientes con debounce
    this.busquedaRucSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((termino) => {
        if (!termino || termino.trim().length < 2) {
          this.clientesSugeridos.set([]);
          this.buscandoCliente.set(false);
          this.mostrarSugerenciasClientes.set(false);
          this.clienteExistente.set(null);
          return of([]);
        }
        this.buscandoCliente.set(true);
        return this.clientesService.listar(termino.trim()).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe((resultados) => {
      this.buscandoCliente.set(false);
      this.clientesSugeridos.set(resultados || []);
      this.mostrarSugerenciasClientes.set((resultados || []).length > 0);

      const rucLimpio = this.checkoutData.clienteRuc.trim().toLowerCase();
      const exacto = (resultados || []).find(c => c.ruc.trim().toLowerCase() === rucLimpio);
      if (exacto) {
        this.clienteExistente.set(exacto);
      } else {
        this.clienteExistente.set(null);
      }
    });
  }

  // Filtrado reactivo de sabores
  public readonly saboresFiltrados = computed(() => {
    const todos = this.posService.sabores();
    const cat = this.filtroCategoria();
    if (cat === 'TODOS') return todos;
    return todos.filter(s => s.categoria === cat);
  });

  // Filtrado de productos simples
  public productosFiltrados(): ProductoSimple[] {
    const prods = this.posService.productosSimplesActivos();
    if (!this.busquedaProducto.trim()) return prods;
    const term = this.busquedaProducto.toLowerCase();
    return prods.filter(p => p.nombre.toLowerCase().includes(term));
  }

  esSaborSeleccionado(sabor: Sabor): boolean {
    return this.posService.selectedSabores().some(s => s.id === sabor.id);
  }

  esToppingSeleccionado(topping: Topping): boolean {
    return this.posService.selectedToppings().some(t => t.id === topping.id);
  }

  onSaborClick(sabor: Sabor): void {
    this.posService.toggleSabor(sabor);
  }

  agregarHelado(): void {
    this.posService.agregarHeladoAlTicket();
  }

  agregarProducto(prod: ProductoSimple): void {
    this.posService.agregarProductoSimple(prod, 1);
  }

  obtenerNombresSabores(sabores: Sabor[]): string {
    return sabores.map(s => s.nombre).join(', ');
  }

  obtenerNombresToppings(toppings: Topping[]): string {
    return toppings.map(t => t.nombre).join(', ');
  }

  abrirModalAperturaRapida(): void {
    this.aperturaRapidaMonto = 100000;
    this.modalAperturaRapidaAbierto.set(true);
  }

  cerrarModalAperturaRapida(): void {
    this.modalAperturaRapidaAbierto.set(false);
  }

  confirmarAperturaRapida(): void {
    if (this.aperturaRapidaMonto < 0) {
      this.toast.warning('El monto inicial no puede ser negativo.');
      return;
    }

    this.cajaService.abrirCaja({
      montoInicial: this.aperturaRapidaMonto,
      observaciones: 'Apertura rápida desde POS'
    }).subscribe({
      next: (sesion) => {
        this.toast.success(`Caja abierta exitosamente (Sesión #${sesion.id}). Ya puedes facturar ventas.`);
        this.cerrarModalAperturaRapida();
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.error || 'Error al abrir la caja.';
        this.toast.error(msg, 'Error de Apertura');
      }
    });
  }

  abrirModalCheckout(): void {
    if (this.posService.ticketItems().length === 0) {
      this.toast.warning('Agrega productos al ticket antes de finalizar la venta.');
      return;
    }

    if (!this.cajaService.cajaAbierta()) {
      this.toast.warning('La caja se encuentra cerrada. Debes abrir la caja para registrar cobros.', 'Caja Cerrada');
      this.abrirModalAperturaRapida();
      return;
    }

    // Limpiar estado de autocompletado y validación de voucher
    this.voucherTouched.set(false);
    this.clienteExistente.set(null);
    this.clientesSugeridos.set([]);
    this.mostrarSugerenciasClientes.set(false);

    this.modalCheckoutAbierto.set(true);
  }

  cerrarModalCheckout(): void {
    this.modalCheckoutAbierto.set(false);
    this.mostrarSugerenciasClientes.set(false);
  }

  get esVoucherRequerido(): boolean {
    return this.checkoutData.metodoPago === 'TARJETA_DEBITO' || this.checkoutData.metodoPago === 'TARJETA_CREDITO';
  }

  esVoucherInvalido(): boolean {
    return this.esVoucherRequerido && !this.checkoutData.numeroVoucher?.trim();
  }

  onSeleccionarMetodoPago(metodo: MetodoPago): void {
    this.checkoutData.metodoPago = metodo;
    if (metodo === 'TARJETA_DEBITO' || metodo === 'TARJETA_CREDITO') {
      setTimeout(() => {
        const input = document.getElementById('voucherInput') as HTMLInputElement | null;
        if (input) {
          input.focus();
        }
      }, 100);
    } else {
      this.voucherTouched.set(false);
      this.checkoutData.numeroVoucher = '';
    }
  }

  onVoucherInput(): void {
    if (this.voucherTouched() && !this.esVoucherInvalido()) {
      this.voucherTouched.set(false);
    }
  }

  onInputRuc(valor: string): void {
    this.checkoutData.clienteRuc = valor;
    this.busquedaRucSubject.next(valor);
  }

  onFocusRuc(): void {
    if (this.clientesSugeridos().length > 0) {
      this.mostrarSugerenciasClientes.set(true);
    }
  }

  seleccionarClienteSugerido(cliente: Cliente): void {
    this.checkoutData.clienteRuc = cliente.ruc;
    this.checkoutData.clienteNombre = cliente.razonSocial;
    if (cliente.direccion) {
      this.checkoutData.clienteDireccion = cliente.direccion;
    }
    this.clienteExistente.set(cliente);
    this.mostrarSugerenciasClientes.set(false);
    this.clientesSugeridos.set([]);
  }

  ocultarSugerenciasConDelay(): void {
    setTimeout(() => {
      this.mostrarSugerenciasClientes.set(false);
    }, 200);
  }

  onSeleccionarTipoComprobante(tipo: TipoComprobante): void {
    this.checkoutData.tipoComprobante = tipo;
    if (tipo === 'FACTURA' && this.checkoutData.clienteNombre === 'Consumidor Final') {
      this.checkoutData.clienteNombre = '';
    }
  }

  onCambiarImpresora(id: number | null): void {
    if (id !== null && id !== undefined) {
      localStorage.setItem('pos_impresora_id', id.toString());
    } else {
      localStorage.removeItem('pos_impresora_id');
    }
  }

  cerrarModalComprobante(): void {
    this.modalComprobanteAbierto.set(false);
  }

  confirmarVenta(): void {
    if (!this.cajaService.cajaAbierta()) {
      this.toast.error('No se pueden registrar ventas: no existe una sesión de caja abierta.', 'Caja Cerrada');
      this.abrirModalAperturaRapida();
      return;
    }

    if (this.esVoucherRequerido && this.esVoucherInvalido()) {
      this.voucherTouched.set(true);
      const metodoNombre = this.checkoutData.metodoPago === 'TARJETA_DEBITO' ? 'Débito' : 'Crédito';
      this.toast.warning(`Para pagos con Tarjeta de ${metodoNombre}, el N° de Comprobante / Voucher POS es obligatorio.`, 'Voucher Requerido');
      const input = document.getElementById('voucherInput') as HTMLInputElement | null;
      if (input) {
        input.focus();
      }
      return;
    }

    if (this.checkoutData.tipoComprobante === 'FACTURA') {
      if (!this.checkoutData.clienteRuc?.trim()) {
        this.toast.warning('Para emitir Factura Legal, el RUC o C.I. del cliente es obligatorio.', 'Datos Incompletos');
        return;
      }
      if (!this.checkoutData.clienteNombre?.trim()) {
        this.toast.warning('Para emitir Factura Legal, la Razón Social o Nombre del cliente es obligatorio.', 'Datos Incompletos');
        return;
      }
    }

    const clienteFinal = this.checkoutData.clienteNombre?.trim() 
      || (this.checkoutData.tipoComprobante === 'FACTURA' ? 'Sin Nombre' : 'Consumidor Final');

    const impresoraIdSeleccionada = this.checkoutData.impresoraId 
      ? Number(this.checkoutData.impresoraId) 
      : undefined;

    this.posService.registrarPedido({
      clienteNombre: clienteFinal,
      tipoEntrega: this.checkoutData.tipoEntrega,
      metodoPago: this.checkoutData.metodoPago,
      numeroVoucher: (this.checkoutData.metodoPago === 'TARJETA_DEBITO' || this.checkoutData.metodoPago === 'TARJETA_CREDITO')
        ? (this.checkoutData.numeroVoucher?.trim() || undefined)
        : undefined,
      notas: this.checkoutData.notas,
      tipoComprobante: this.checkoutData.tipoComprobante,
      condicionVenta: this.checkoutData.condicionVenta,
      clienteRuc: this.checkoutData.clienteRuc?.trim() || undefined,
      clienteDireccion: this.checkoutData.clienteDireccion?.trim() || undefined,
      impresoraId: impresoraIdSeleccionada
    }).subscribe({
      next: (pedidoCreado) => {
        let msg = pedidoCreado.tipoComprobante === 'FACTURA'
          ? `Factura ${pedidoCreado.numeroFactura || '#' + pedidoCreado.id} emitida.`
          : `Venta #${pedidoCreado.id} confirmada.`;

        if (impresoraIdSeleccionada) {
          const impEncontrada = this.impresorasService.impresoras().find(i => i.id === impresoraIdSeleccionada);
          msg += impEncontrada ? ` Enviando ticket a ${impEncontrada.nombre}...` : ' Enviando ticket a la impresora...';
        }

        this.toast.success(msg);

        this.cajaService.cargarResumen().subscribe();
        this.cerrarModalCheckout();

        // Mostrar vista previa del comprobante emitido
        this.ultimoPedidoEmitido.set(pedidoCreado);
        this.modalComprobanteAbierto.set(true);

        // Reset checkout form conservando la impresora predeterminada
        const savedImp = localStorage.getItem('pos_impresora_id');
        this.checkoutData = {
          clienteNombre: '',
          tipoEntrega: 'MOSTRADOR',
          metodoPago: 'EFECTIVO',
          numeroVoucher: '',
          notas: '',
          tipoComprobante: 'TICKET',
          condicionVenta: 'CONTADO',
          clienteRuc: '',
          clienteDireccion: '',
          impresoraId: savedImp ? Number(savedImp) : null
        };
        this.clienteExistente.set(null);
        this.clientesSugeridos.set([]);
        this.mostrarSugerenciasClientes.set(false);
        this.voucherTouched.set(false);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || err.error?.error || 'Error al procesar el pedido.';
        this.toast.error(mensaje, 'Validación de Venta', 8000);
      }
    });
  }
}
