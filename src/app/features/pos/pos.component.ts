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

export interface ItemCatalogoPOS {
  idUnico: string;
  tipo: 'HELADO' | 'PRODUCTO' | 'TOPPING';
  nombre: string;
  categoria: string;
  precio: number;
  stock?: number;
  stockMinimo?: number;
  codigoBarra?: string | null;
  codigoItem?: string | null;
  detalles?: string;
  icon: string;
  rawItem: Presentacion | ProductoSimple | Topping;
}

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

        <!-- BARRA DE CATEGORÍAS Y BÚSQUEDA / ESCÁNER -->
        <div class="pos-catalog-header">
          <!-- SELECTOR DE CATEGORÍA (DROPDOWN + BUSCADOR / ESCÁNER) -->
          <div class="category-selection-row">
            <div class="category-dropdown-group">
              <label for="posCategoriaSelect" class="category-select-label">
                <app-icon name="filter" [size]="16" />
                <span>Categoría:</span>
              </label>
              <select
                id="posCategoriaSelect"
                class="form-select category-select"
                [ngModel]="categoriaSeleccionada()"
                (ngModelChange)="seleccionarCategoria($event)"
              >
                @for (cat of categoriasDisponibles(); track cat.id) {
                  <option [value]="cat.id">
                    {{ cat.nombre }} ({{ cat.count }})
                  </option>
                }
              </select>
            </div>

            <!-- ESCÁNER RÁPIDO Y BÚSQUEDA POR TEXTO O CÓDIGO DE BARRAS CON MULTIPLICADOR DE CANTIDAD -->
            <div class="search-scanner-box">
              <div class="qty-multiplier-wrapper" title="Cantidad a agregar (por defecto: 1)">
                <span class="qty-multiplier-label">Cant:</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  step="1"
                  class="qty-multiplier-input"
                  [ngModel]="cantidadAgregar()"
                  (ngModelChange)="onCambioCantidadAgregar($event)"
                  (focus)="$any($event.target).select()"
                  (keydown.enter)="$event.preventDefault(); searchInput.focus(); searchInput.select()"
                  aria-label="Cantidad a agregar"
                />
              </div>

              <div class="search-input-inner">
                <app-icon name="search" [size]="18" extraClass="search-icon" />
                <input
                  #searchInput
                  type="text"
                  class="search-scanner-input"
                  placeholder="Buscar por nombre, código de barra o Cód/ID (#) [Enter]..."
                  [ngModel]="busquedaTermino()"
                  (ngModelChange)="busquedaTermino.set($event)"
                  (keydown.enter)="onBuscarOEnter($event)"
                />
                @if (busquedaTermino()) {
                  <button type="button" class="btn-clear-search" (click)="busquedaTermino.set('')">
                    <app-icon name="x" [size]="14" />
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- GRILLA UNIFICADA DE PRODUCTOS -->
        <div class="catalog-container">
          @if (posService.cargandoCatalogos()) {
            <div class="catalog-loading">
              <app-icon name="refresh" [size]="28" extraClass="spin-icon" />
              <span>Cargando catálogo de productos...</span>
            </div>
          } @else if (itemsCatalogoFiltrados().length === 0) {
            <div class="catalog-empty">
              <div class="empty-icon-circle">
                <app-icon name="package" [size]="36" />
              </div>
              <h3>No se encontraron productos</h3>
              <p class="text-muted">
                No hay artículos disponibles para la categoría seleccionada
                @if (busquedaTermino().trim()) {
                  con el término "{{ busquedaTermino() }}"
                }.
              </p>
              @if (categoriaSeleccionada() !== 'TODOS' || busquedaTermino().trim()) {
                <button type="button" class="btn btn-secondary btn-sm" (click)="resetFiltros()">
                  Ver Todos los Productos
                </button>
              }
            </div>
          } @else {
            <div class="catalog-grid">
              @for (item of itemsCatalogoFiltrados(); track item.idUnico) {
                <div
                  class="catalog-card"
                  [class.out-of-stock]="item.stock !== undefined && item.stock <= 0"
                  (click)="agregarItemAlTicket(item)"
                >
                  <!-- BADGE STOCK SUPERIOR -->
                  <div class="card-badges-top">
                    <span class="badge-cat">{{ item.categoria }}</span>
                    @if (item.stock !== undefined) {
                      @if (item.stock <= 0) {
                        <span class="badge-stock-empty">Sin stock</span>
                      } @else if (item.stockMinimo !== undefined && item.stock <= item.stockMinimo) {
                        <span class="badge-stock-low">Poco stock ({{ item.stock }})</span>
                      } @else {
                        <span class="badge-stock-ok">{{ item.stock }} disp.</span>
                      }
                    }
                  </div>

                  <!-- ICONO PRINCIPAL DEL PRODUCTO -->
                  <div class="card-icon-wrapper" [class.icon-helado]="item.tipo === 'HELADO'" [class.icon-topping]="item.tipo === 'TOPPING'">
                    <app-icon [name]="item.icon" [size]="32" />
                  </div>

                  <!-- DETALLES DEL PRODUCTO -->
                  <div class="card-body">
                    <h4 class="card-title" [title]="item.nombre">{{ item.nombre }}</h4>
                    
                    @if (item.detalles) {
                      <div class="card-detail-text">{{ item.detalles }}</div>
                    }

                    <div class="card-tags-row">
                      @if (item.codigoItem) {
                        <span class="card-code-tag" title="Código de producto / ID rápido">
                          <app-icon name="hash" [size]="10" />
                          <span>{{ item.codigoItem }}</span>
                        </span>
                      }
                      @if (item.codigoBarra) {
                        <span class="card-barcode-tag" title="Código de barras para lector óptico">
                          <app-icon name="barcode" [size]="11" />
                          <span>{{ item.codigoBarra }}</span>
                        </span>
                      }
                    </div>
                  </div>

                  <!-- PRECIO Y BOTÓN ACCIÓN -->
                  <div class="card-footer">
                    <div class="card-price">{{ item.precio | appCurrency }}</div>
                    <div class="card-action-group">
                      @if (item.tipo === 'HELADO') {
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary card-flavor-quick-btn"
                          title="Elegir y personalizar sabores en bacha para este helado"
                          (click)="$event.stopPropagation(); abrirPersonalizadorSabor(item.rawItem)"
                        >
                          <app-icon name="sparkles" [size]="13" />
                          <span>Sabores</span>
                        </button>
                      }
                      <button
                        type="button"
                        class="btn btn-sm btn-primary card-add-btn"
                        [disabled]="item.stock !== undefined && item.stock <= 0"
                        (click)="$event.stopPropagation(); agregarItemAlTicket(item)"
                        title="Agregar al ticket"
                      >
                        <app-icon name="plus" [size]="16" />
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- VENTANA OPCIONAL DE SELECCIÓN DE SABORES EN BACHA -->
        <div id="panelSabores" class="sabores-panel-card" [class.panel-open]="selectorSaboresActivo()">
          <!-- CABECERA DESPLEGABLE -->
          <div class="sabores-panel-header" (click)="toggleSelectorSabores()">
            <div class="header-left">
              <div class="panel-icon-circle">
                <app-icon name="sparkles" [size]="20" />
              </div>
              <div class="header-titles">
                <div class="d-flex align-center gap-2">
                  <h3 class="panel-title">Especificar Sabores en Bacha & Armador</h3>
                  <span class="badge-opcional">Opcional</span>
                </div>
                <p class="panel-subtitle">
                  @if (selectorSaboresActivo()) {
                    Elige el envase, los sabores disponibles en bachas y toppings extras para personalizar el helado.
                  } @else {
                    Activa esta ventana si deseas especificar los sabores de helado que llevará el pote o cucurucho.
                  }
                </p>
              </div>
            </div>

            <div class="header-right">
              <button 
                type="button" 
                class="btn btn-sm" 
                [class.btn-primary]="!selectorSaboresActivo()" 
                [class.btn-secondary]="selectorSaboresActivo()"
                (click)="$event.stopPropagation(); toggleSelectorSabores()"
              >
                <app-icon [name]="selectorSaboresActivo() ? 'chevron-up' : 'chevron-down'" [size]="16" />
                <span>{{ selectorSaboresActivo() ? 'Ocultar Sabores' : 'Activar Sabores' }}</span>
              </button>
            </div>
          </div>

          <!-- CONTENIDO EXPANDIBLE DEL ARMADOR -->
          @if (selectorSaboresActivo()) {
            <div class="sabores-panel-body">
              <!-- PASO 1: SELECCIÓN DE PRESENTACIÓN / ENVASE -->
              <div class="panel-section">
                <div class="section-title-row">
                  <span class="section-step-badge">1</span>
                  <span class="section-heading">Selecciona la Presentación / Envase:</span>
                  @if (posService.selectedPresentacion()) {
                    <span class="badge badge-success ml-auto">
                      {{ posService.selectedPresentacion()?.nombre }} (Hasta {{ posService.maxSaboresPermitidos() }} sabores)
                    </span>
                  }
                </div>
                <div class="presentaciones-pill-grid">
                  @for (pres of posService.presentacionesActivas(); track pres.id) {
                    <button
                      type="button"
                      class="pres-pill-btn"
                      [class.active]="posService.selectedPresentacion()?.id === pres.id"
                      [disabled]="pres.stock !== undefined && pres.stock <= 0"
                      (click)="posService.seleccionarPresentacion(pres)"
                    >
                      <app-icon name="ice-cream" [size]="16" />
                      <div class="pres-pill-info">
                        <strong class="pres-pill-name">{{ pres.nombre }}</strong>
                        <span class="pres-pill-meta">
                          {{ pres.precio | appCurrency }} &bull; Max {{ pres.maxSabores }} sab.
                        </span>
                      </div>
                    </button>
                  }
                </div>
              </div>

              <!-- PASO 2: CONTADOR Y FILTROS DE CATEGORÍA DE SABOR -->
              <div class="panel-section">
                <div class="section-title-row">
                  <span class="section-step-badge">2</span>
                  <span class="section-heading">Elige los Sabores de Bacha:</span>
                  <div class="flavor-count-pill ml-auto" [class.count-complete]="posService.cantidadSaboresSeleccionados() === posService.maxSaboresPermitidos() && posService.maxSaboresPermitidos() > 0">
                    <app-icon name="check-circle" [size]="14" />
                    <span>
                      Sabores seleccionados: {{ posService.cantidadSaboresSeleccionados() }} / {{ posService.maxSaboresPermitidos() || '0' }}
                    </span>
                  </div>
                </div>

                @if (!posService.selectedPresentacion()) {
                  <div class="sabor-notice-box">
                    <app-icon name="info" [size]="16" />
                    <span>Por favor, selecciona primero un envase o presentación en el paso 1.</span>
                  </div>
                }

                <!-- FILTRO DE CATEGORÍAS DE SABOR -->
                <div class="sabor-category-tabs">
                  @for (cat of categoriasSaborDisponibles(); track cat) {
                    <button
                      type="button"
                      class="sabor-tab-btn"
                      [class.active]="filtroCategoriaSabor() === cat"
                      (click)="seleccionarFiltroCategoriaSabor(cat)"
                    >
                      {{ formatearCategoriaSabor(cat) }}
                    </button>
                  }
                </div>

                <!-- GRILLA DE SABORES -->
                <div class="sabores-grid">
                  @for (sabor of saboresFiltrados(); track sabor.id) {
                    <div
                      class="sabor-card"
                      [class.selected]="esSaborSeleccionado(sabor)"
                      [class.disabled]="!sabor.disponible || (sabor.stockKilos !== undefined && sabor.stockKilos <= 0)"
                      (click)="posService.toggleSabor(sabor)"
                    >
                      <div class="sabor-card-header">
                        <span class="sabor-cat-tag">{{ formatearCategoriaSabor(sabor.categoria) }}</span>
                        @if (sabor.stockKilos !== undefined) {
                          @if (sabor.stockKilos <= 0) {
                            <span class="sabor-stock-empty">Sin bacha</span>
                          } @else {
                            <span class="sabor-stock-tag">{{ sabor.stockKilos | number:'1.1-2' }} kg</span>
                          }
                        }
                      </div>

                      <div class="sabor-card-body">
                        <strong class="sabor-name">{{ sabor.nombre }}</strong>
                      </div>

                      <div class="sabor-diet-badges">
                        @if (sabor.aptoCeliaco) {
                          <span class="diet-badge diet-celiac" title="Apto Celíaco / Sin TACC">Sin TACC</span>
                        }
                        @if (sabor.esVegano) {
                          <span class="diet-badge diet-vegan" title="Vegano">Vegano</span>
                        }
                        @if (sabor.sinAzucar) {
                          <span class="diet-badge diet-sugarfree" title="Sin Azúcar">Sin Azúcar</span>
                        }
                      </div>

                      @if (esSaborSeleccionado(sabor)) {
                        <div class="sabor-check-indicator">
                          <app-icon name="check" [size]="14" />
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- PASO 3: TOPPINGS EXTRAS OPCIONALES PARA ESTE HELADO -->
              @if (posService.toppingsDisponibles().length > 0) {
                <div class="panel-section">
                  <div class="section-title-row">
                    <span class="section-step-badge">3</span>
                    <span class="section-heading">Toppings o Coberturas Adicionales (Opcional):</span>
                  </div>
                  <div class="toppings-chip-group">
                    @for (top of posService.toppingsDisponibles(); track top.id) {
                      <button
                        type="button"
                        class="topping-chip-btn"
                        [class.active]="esToppingSeleccionado(top)"
                        (click)="posService.toggleTopping(top)"
                      >
                        <app-icon name="sparkles" [size]="14" />
                        <span>{{ top.nombre }}</span>
                        <span class="topping-price-tag">+{{ top.precioExtra | appCurrency }}</span>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- BARRA DE ACCIÓN FINAL DEL HELADO PERSONALIZADO -->
              <div class="panel-action-bar">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="posService.resetArmadoHelado()"
                  [disabled]="!posService.selectedPresentacion() && posService.selectedSabores().length === 0"
                >
                  <app-icon name="trash" [size]="14" />
                  <span>Limpiar Armado</span>
                </button>

                <button
                  type="button"
                  class="btn btn-success btn-lg flex-1"
                  [disabled]="!posService.selectedPresentacion() || posService.selectedSabores().length === 0"
                  (click)="posService.agregarHeladoAlTicket()"
                >
                  <app-icon name="plus-circle" [size]="18" />
                  <span>
                    Agregar al Ticket:
                    @if (posService.selectedPresentacion()) {
                      {{ posService.selectedPresentacion()?.nombre }} ({{ posService.selectedSabores().length }} sab.)
                    } @else {
                      Helado con Sabores
                    }
                  </span>
                </button>
              </div>
            </div>
          }
        </div>
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
                      } @else if (item.tipoItem === 'TOPPING') {
                        {{ item.toppings && item.toppings.length > 0 ? item.toppings[0].nombre : 'Topping' }}
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
                    @if (item.sabores && item.sabores.length > 0) {
                      <div class="item-flavors">
                        <strong>Sabores:</strong> {{ obtenerNombresSabores(item.sabores) }}
                      </div>
                    }
                    @if (item.toppings && item.toppings.length > 0) {
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

    /* CABECERA DE CATÁLOGO Y FILTROS */
    .pos-catalog-header {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: var(--shadow-sm);
    }

    .category-selection-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0;
    }

    .category-dropdown-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-width: 280px;
      flex: 1;
    }

    .category-select-label {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .category-select {
      flex: 1;
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-color);
      background-color: var(--bg-subtle);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-main);
      cursor: pointer;
      outline: none;
      transition: all 0.15s ease;
    }

    .category-select:focus, .category-select:hover {
      border-color: var(--primary);
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
    }

    .search-scanner-box {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 340px;
      flex: 1.3;
    }

    .qty-multiplier-wrapper {
      display: inline-flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0 0.5rem;
      height: 38px;
      gap: 0.35rem;
      flex-shrink: 0;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }

    .qty-multiplier-wrapper:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
      background: #ffffff;
    }

    .qty-multiplier-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      user-select: none;
    }

    .qty-multiplier-input {
      width: 44px;
      border: none;
      background: transparent;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
      text-align: center;
      outline: none;
      -moz-appearance: textfield;
    }

    .qty-multiplier-input::-webkit-outer-spin-button,
    .qty-multiplier-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .search-input-inner {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      color: #64748b;
      pointer-events: none;
      z-index: 2;
    }

    .search-scanner-input {
      width: 100%;
      height: 38px;
      padding: 0.5rem 2.2rem 0.5rem 2.5rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-color);
      background: var(--bg-subtle);
      font-size: 0.875rem;
      color: var(--text-main);
      outline: none;
      transition: all 0.2s;
    }

    .search-scanner-input:focus {
      background: #ffffff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
    }

    .btn-clear-search {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }

    .btn-clear-search:hover {
      color: #0f172a;
    }

    /* CONTENEDOR DEL CATÁLOGO DE PRODUCTOS */
    .catalog-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      min-height: 480px;
    }

    .catalog-loading, .catalog-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      text-align: center;
      gap: 0.75rem;
    }

    .catalog-loading {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .empty-icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .catalog-empty h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-main);
    }

    .catalog-empty p {
      max-width: 400px;
      font-size: 0.875rem;
      margin: 0;
    }

    /* GRILLA DE TARJETAS DE PRODUCTOS */
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 1rem;
    }

    .catalog-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      position: relative;
      transition: all 0.18s ease;
    }

    .catalog-card:hover:not(.out-of-stock) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      border-color: #3b82f6;
    }

    .catalog-card.out-of-stock {
      opacity: 0.55;
      background: #fafafa;
      cursor: not-allowed;
    }

    .card-badges-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.65rem;
      gap: 0.5rem;
    }

    .badge-cat {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      color: #64748b;
      background: var(--bg-subtle);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 110px;
    }

    .badge-stock-ok {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      white-space: nowrap;
    }

    .badge-stock-low {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: #ffedd5;
      color: #9a3412;
      white-space: nowrap;
    }

    .badge-stock-empty {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: #fee2e2;
      color: #991b1b;
      white-space: nowrap;
    }

    .card-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0.25rem 0 0.75rem 0;
    }

    .card-icon-wrapper.icon-helado {
      background: #fef3c7;
      color: #d97706;
    }

    .card-icon-wrapper.icon-topping {
      background: #fdf4ff;
      color: #c026d3;
    }

    .card-action-group {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .card-flavor-quick-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
      padding: 0.35rem 0.5rem;
      font-size: 0.775rem;
      border-radius: var(--radius-sm);
      border: 1px solid #0284c7;
      color: #0284c7;
      background: #f0f9ff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .card-flavor-quick-btn:hover {
      background: #0284c7;
      color: #ffffff;
    }

    /* VENTANA OPCIONAL DE SELECCIÓN DE SABORES EN BACHA */
    .sabores-panel-card {
      margin-top: 1.5rem;
      background: var(--bg-surface);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      transition: all 0.25s ease;
      overflow: hidden;
    }

    .sabores-panel-card.panel-open {
      border-color: #38bdf8;
      box-shadow: 0 4px 18px rgba(2, 132, 199, 0.12);
    }

    .sabores-panel-header {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      cursor: pointer;
      background: #f8fafc;
      border-bottom: 1px solid transparent;
      transition: background 0.15s ease;
    }

    .sabores-panel-card.panel-open .sabores-panel-header {
      background: #f0f9ff;
      border-bottom-color: #e0f2fe;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex: 1;
    }

    .panel-icon-circle {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .badge-opcional {
      background: #e2e8f0;
      color: #475569;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .sabores-panel-card.panel-open .badge-opcional {
      background: #bae6fd;
      color: #0369a1;
    }

    .panel-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0;
    }

    .sabores-panel-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .section-step-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .section-heading {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main);
    }

    .presentaciones-pill-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 0.65rem;
    }

    .pres-pill-btn {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-main);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }

    .pres-pill-btn:hover:not(:disabled) {
      border-color: #0284c7;
      background: #f8fafc;
    }

    .pres-pill-btn.active {
      border-color: #0284c7;
      background: #f0f9ff;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
    }

    .pres-pill-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f1f5f9;
    }

    .pres-pill-info {
      display: flex;
      flex-direction: column;
    }

    .pres-pill-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .pres-pill-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .flavor-count-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.775rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
    }

    .flavor-count-pill.count-complete {
      background: #dcfce7;
      color: #15803d;
    }

    .sabor-notice-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      background: #fef3c7;
      border: 1px solid #fde047;
      color: #92400e;
      font-size: 0.8125rem;
    }

    .sabor-category-tabs {
      display: flex;
      gap: 0.4rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scrollbar-width: thin;
    }

    .sabor-tab-btn {
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      border: 1px solid var(--border-color);
      background: var(--bg-subtle);
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .sabor-tab-btn:hover {
      background: #ffffff;
      color: var(--text-main);
    }

    .sabor-tab-btn.active {
      background: #0284c7;
      border-color: #0284c7;
      color: #ffffff;
    }

    .sabores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
    }

    .sabor-card {
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      position: relative;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .sabor-card:hover:not(.disabled) {
      border-color: #0284c7;
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .sabor-card.selected {
      border-color: #0284c7;
      background: #f0f9ff;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.25);
    }

    .sabor-card.disabled {
      opacity: 0.5;
      background: #f8fafc;
      cursor: not-allowed;
    }

    .sabor-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.35rem;
    }

    .sabor-cat-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--bg-subtle);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 90px;
    }

    .sabor-stock-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #166534;
      background: #dcfce7;
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
      white-space: nowrap;
    }

    .sabor-stock-empty {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #991b1b;
      background: #fee2e2;
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
      white-space: nowrap;
    }

    .sabor-card-body {
      flex: 1;
    }

    .sabor-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-main);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.25;
    }

    .sabor-diet-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .diet-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.05rem 0.3rem;
      border-radius: 3px;
    }

    .diet-celiac {
      background: #fef3c7;
      color: #b45309;
    }

    .diet-vegan {
      background: #dcfce7;
      color: #15803d;
    }

    .diet-sugarfree {
      background: #e0e7ff;
      color: #4338ca;
    }

    .sabor-check-indicator {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toppings-chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .topping-chip-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      border: 1.5px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-main);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .topping-chip-btn:hover {
      border-color: #c026d3;
      background: #fdf4ff;
    }

    .topping-chip-btn.active {
      border-color: #c026d3;
      background: #fdf4ff;
      color: #a21caf;
      box-shadow: 0 0 0 2px rgba(192, 38, 211, 0.2);
    }

    .topping-price-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 700;
    }

    .panel-action-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-bottom: 0.75rem;
    }

    .card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 0.35rem 0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-detail-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }

    .card-tags-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.35rem;
    }

    .card-code-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-family: monospace;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #0369a1;
      background: #e0f2fe;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      border: 1px solid #bae6fd;
      width: fit-content;
    }

    .card-barcode-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-family: monospace;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #475569;
      background: var(--bg-subtle);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      width: fit-content;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--border-color);
    }

    .card-price {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text-main);
      white-space: nowrap;
    }

    .card-add-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      padding: 0.35rem 0.55rem;
      min-width: 2.1rem;
      height: 2rem;
      border-radius: var(--radius-sm);
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

  public readonly categoriaSeleccionada = signal<string>('TODOS');
  public readonly busquedaTermino = signal<string>('');
  public readonly cantidadAgregar = signal<number>(1);
  public readonly selectorSaboresActivo = signal<boolean>(false);
  public readonly filtroCategoriaSabor = signal<string>('TODOS');

  onCambioCantidadAgregar(val: any): void {
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      this.cantidadAgregar.set(Math.floor(num));
    } else {
      this.cantidadAgregar.set(1);
    }
  }

  resetCantidadAgregar(): void {
    this.cantidadAgregar.set(1);
  }

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

  // Categorías disponibles unificadas (Helados + Toppings + Categorías de Productos Simples)
  public readonly categoriasDisponibles = computed<{ id: string; nombre: string; icon: string; count: number }[]>(() => {
    const list: { id: string; nombre: string; icon: string; count: number }[] = [];
    const presentaciones = this.posService.presentacionesActivas();
    const productos = this.posService.productosSimplesActivos();
    const toppings = this.posService.toppingsDisponibles();

    list.push({
      id: 'TODOS',
      nombre: 'Todas las Categorías',
      icon: 'filter',
      count: presentaciones.length + productos.length + toppings.length
    });

    if (presentaciones.length > 0) {
      list.push({
        id: 'HELADOS',
        nombre: 'Helados & Envases',
        icon: 'ice-cream',
        count: presentaciones.length
      });
    }

    if (toppings.length > 0) {
      list.push({
        id: 'TOPPINGS',
        nombre: 'Toppings & Agregados',
        icon: 'sparkles',
        count: toppings.length
      });
    }

    const mapCategorias = new Map<string, number>();
    for (const prod of productos) {
      const cat = (prod.categoria && prod.categoria.trim()) ? prod.categoria.trim() : 'General';
      mapCategorias.set(cat, (mapCategorias.get(cat) || 0) + 1);
    }

    const catsSorted = Array.from(mapCategorias.keys()).sort((a, b) => a.localeCompare(b));
    for (const cat of catsSorted) {
      list.push({
        id: cat,
        nombre: cat,
        icon: this.obtenerIconoCategoria(cat),
        count: mapCategorias.get(cat) || 0
      });
    }

    return list;
  });

  private normalizarTexto(texto?: string | null): string {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Catálogo unificado filtrado por categoría y término de búsqueda
  public readonly itemsCatalogoFiltrados = computed<ItemCatalogoPOS[]>(() => {
    const cat = this.categoriaSeleccionada();
    const query = this.busquedaTermino().trim();
    const qNorm = this.normalizarTexto(query);
    const resultado: ItemCatalogoPOS[] = [];

    // Si hay un término de búsqueda, buscar en todo el catálogo; si no, respetar categoría activa
    const aplicarFiltroCat = !qNorm;

    // Presentaciones de helado
    if (!aplicarFiltroCat || cat === 'TODOS' || cat === 'HELADOS') {
      for (const pres of this.posService.presentacionesActivas()) {
        resultado.push({
          idUnico: `pres_${pres.id}`,
          tipo: 'HELADO',
          nombre: pres.nombre,
          categoria: 'Helados',
          precio: pres.precio,
          stock: pres.stock,
          stockMinimo: pres.stockMinimo,
          codigoItem: (pres as any).codigo || `H-${pres.id}`,
          detalles: pres.pesoGramosAprox ? `~${pres.pesoGramosAprox}g` : undefined,
          icon: 'ice-cream',
          rawItem: pres
        });
      }
    }

    // Toppings y agregados
    if (!aplicarFiltroCat || cat === 'TODOS' || cat === 'TOPPINGS') {
      for (const top of this.posService.toppingsDisponibles()) {
        resultado.push({
          idUnico: `top_${top.id}`,
          tipo: 'TOPPING',
          nombre: top.nombre,
          categoria: 'Toppings',
          precio: top.precioExtra,
          codigoItem: (top as any).codigo || `T-${top.id}`,
          detalles: 'Agregado / Extra',
          icon: 'sparkles',
          rawItem: top
        });
      }
    }

    // Productos simples
    const productos = this.posService.productosSimplesActivos();
    for (const prod of productos) {
      const prodCat = (prod.categoria && prod.categoria.trim()) ? prod.categoria.trim() : 'General';
      if (!aplicarFiltroCat || cat === 'TODOS' || cat === prodCat) {
        resultado.push({
          idUnico: `prod_${prod.id}`,
          tipo: 'PRODUCTO',
          nombre: prod.nombre,
          categoria: prodCat,
          precio: prod.precio,
          stock: prod.stock,
          stockMinimo: prod.stockMinimo,
          codigoBarra: prod.codigoBarra,
          codigoItem: prod.codigo || (prod as any).sku || `P-${prod.id}`,
          icon: this.obtenerIconoCategoria(prodCat),
          rawItem: prod
        });
      }
    }

    if (!qNorm) {
      return resultado;
    }

    const qClean = qNorm.replace(/[^a-z0-9]/g, '');

    return resultado.filter(item => {
      const nomNorm = this.normalizarTexto(item.nombre);
      const catNorm = this.normalizarTexto(item.categoria);
      const codNorm = this.normalizarTexto(item.codigoBarra);
      const codItemNorm = this.normalizarTexto(item.codigoItem);
      const codItemClean = codItemNorm.replace(/[^a-z0-9]/g, '');
      const rawIdStr = (item.rawItem && (item.rawItem as any).id != null) ? String((item.rawItem as any).id) : '';

      return nomNorm.includes(qNorm) ||
             catNorm.includes(qNorm) ||
             (codNorm && codNorm.includes(qNorm)) ||
             (codItemNorm && codItemNorm.includes(qNorm)) ||
             (qClean && codItemClean && codItemClean.includes(qClean)) ||
             (qClean && rawIdStr && (rawIdStr === qClean || qNorm === `#${rawIdStr}`));
    });
  });

  seleccionarCategoria(catId: string): void {
    this.categoriaSeleccionada.set(catId);
  }

  resetFiltros(): void {
    this.categoriaSeleccionada.set('TODOS');
    this.busquedaTermino.set('');
  }

  agregarItemAlTicket(item: ItemCatalogoPOS, cant?: number): void {
    const cantidad = cant !== undefined && cant > 0 ? cant : (this.cantidadAgregar() || 1);
    if (item.tipo === 'HELADO') {
      this.posService.agregarPresentacionDirecta(item.rawItem as Presentacion, cantidad);
    } else if (item.tipo === 'TOPPING') {
      this.posService.agregarToppingDirecto(item.rawItem as Topping, cantidad);
    } else {
      this.posService.agregarProductoSimple(item.rawItem as ProductoSimple, cantidad);
    }
    this.resetCantidadAgregar();
  }

  // Métodos y filtros para la ventana opcional de selección de sabores
  public readonly categoriasSaborDisponibles = computed<string[]>(() => {
    const cats = new Set<string>();
    for (const s of this.posService.saboresDisponibles()) {
      if (s.categoria) {
        cats.add(s.categoria);
      }
    }
    return ['TODOS', ...Array.from(cats).sort()];
  });

  public readonly saboresFiltrados = computed<Sabor[]>(() => {
    const cat = this.filtroCategoriaSabor();
    const todos = this.posService.saboresDisponibles();
    if (cat === 'TODOS') {
      return todos;
    }
    return todos.filter(s => s.categoria === cat);
  });

  toggleSelectorSabores(): void {
    this.selectorSaboresActivo.update(v => !v);
  }

  abrirPersonalizadorSabor(itemPres?: any): void {
    this.selectorSaboresActivo.set(true);
    if (itemPres && (itemPres as Presentacion).id) {
      this.posService.seleccionarPresentacion(itemPres as Presentacion);
    } else if (!this.posService.selectedPresentacion()) {
      const presActivas = this.posService.presentacionesActivas();
      if (presActivas.length > 0) {
        this.posService.seleccionarPresentacion(presActivas[0]);
      }
    }
    setTimeout(() => {
      const panel = document.getElementById('panelSabores');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  }

  seleccionarFiltroCategoriaSabor(cat: string): void {
    this.filtroCategoriaSabor.set(cat);
  }

  esSaborSeleccionado(sabor: Sabor): boolean {
    return this.posService.selectedSabores().some(s => s.id === sabor.id);
  }

  esToppingSeleccionado(topping: Topping): boolean {
    return this.posService.selectedToppings().some(t => t.id === topping.id);
  }

  formatearCategoriaSabor(cat: string): string {
    switch (cat) {
      case 'DULCE_DE_LECHE': return 'Dulce de Leche';
      case 'CHOCOLATE': return 'Chocolates';
      case 'FRUTAL': return 'Frutales';
      case 'CREMA': return 'Cremas';
      default: return cat;
    }
  }

  onBuscarOEnter(event?: Event): void {
    if (event) event.preventDefault();
    let query = this.busquedaTermino().trim();
    if (!query) return;

    // 0. Detectar si el cajero escribió el formato clásico multiplicador: ej. "5*código" o "5x código"
    const matchMult = query.match(/^(\d+)\s*[*xX]\s*(.+)$/);
    if (matchMult) {
      const cantMult = parseInt(matchMult[1], 10);
      if (cantMult > 0) {
        this.cantidadAgregar.set(cantMult);
        query = matchMult[2].trim();
      }
    }

    const cantidad = this.cantidadAgregar() || 1;
    const qNorm = this.normalizarTexto(query);
    const qClean = qNorm.replace(/[^a-z0-9]/g, '');

    // 1. ¿Hay coincidencia EXACTA por código de barra en productos simples locales?
    const matchBarra = this.posService.productosSimplesActivos().find(
      p => p.codigoBarra && p.codigoBarra.trim().toLowerCase() === query.toLowerCase()
    );
    if (matchBarra) {
      this.posService.agregarProductoSimple(matchBarra, cantidad);
      this.resetCantidadAgregar();
      this.busquedaTermino.set('');
      return;
    }

    // 2. Obtener los productos que coinciden con la búsqueda actual
    const filtrados = this.itemsCatalogoFiltrados();

    // 2a. Si hay coincidencia exacta por código de barra en el catálogo en pantalla
    const matchBarraCat = filtrados.find(
      item => item.codigoBarra && item.codigoBarra.trim().toLowerCase() === query.toLowerCase()
    );
    if (matchBarraCat) {
      this.agregarItemAlTicket(matchBarraCat, cantidad);
      this.busquedaTermino.set('');
      return;
    }

    // 2b. ¿Coincidencia exacta por CÓDIGO DE PRODUCTO / SKU / CÓDIGO INTERNO (ej. "P-6", "p6", "H-1", "T-2", etc.)?
    const matchCodigoItem = filtrados.find(item => {
      if (!item.codigoItem) return false;
      const codNorm = this.normalizarTexto(item.codigoItem);
      const codClean = codNorm.replace(/[^a-z0-9]/g, '');
      return codNorm === qNorm || (qClean && codClean === qClean);
    });
    if (matchCodigoItem) {
      this.agregarItemAlTicket(matchCodigoItem, cantidad);
      this.busquedaTermino.set('');
      return;
    }

    // 2c. Si el cajero ingresó un ID numérico (#6 o 6) y coincide con un único producto
    const matchesPorId = filtrados.filter(item => {
      const idStr = String((item.rawItem as any)?.id || '');
      return idStr === qClean || `#${idStr}` === query;
    });
    if (matchesPorId.length === 1) {
      this.agregarItemAlTicket(matchesPorId[0], cantidad);
      this.busquedaTermino.set('');
      return;
    }

    // 2d. Si hay coincidencia exacta de nombre
    const matchExactoNombre = filtrados.find(
      item => this.normalizarTexto(item.nombre) === qNorm
    );
    if (matchExactoNombre) {
      this.agregarItemAlTicket(matchExactoNombre, cantidad);
      this.busquedaTermino.set('');
      return;
    }

    // 2e. Si el filtro arrojó exactamente 1 producto único en total
    if (filtrados.length === 1) {
      this.agregarItemAlTicket(filtrados[0], cantidad);
      this.busquedaTermino.set('');
      return;
    }

    // 2f. Si hay múltiples productos (ej. "ca" coincide con Café y Salsa de Caramelo)
    if (filtrados.length > 1) {
      this.toast.info(`Se encontraron ${filtrados.length} productos con "${query}". Selecciona el que deseas en pantalla.`);
      return;
    }

    // 3. Si no hay ningún resultado en el catálogo en pantalla (filtrados.length === 0),
    // consultar al backend por código de barra / código de producto
    this.posService.agregarPorCodigoBarra(query, cantidad).subscribe({
      next: (agregado) => {
        if (agregado) {
          this.resetCantidadAgregar();
          this.busquedaTermino.set('');
        } else {
          this.toast.warning(`No se encontró ningún producto que coincida con "${query}".`);
        }
      }
    });
  }

  obtenerIconoCategoria(categoria: string): string {
    const cat = (categoria || '').toLowerCase();
    if (cat.includes('helado') || cat.includes('pote') || cat.includes('cucurucho')) return 'ice-cream';
    if (cat.includes('cafe') || cat.includes('café') || cat.includes('desayuno')) return 'coffee';
    if (cat.includes('bebida') || cat.includes('gaseosa') || cat.includes('agua') || cat.includes('jugo')) return 'cup-soda';
    return 'package';
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
