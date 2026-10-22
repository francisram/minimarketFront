import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService } from '../../core/services/pedidos.service';
import { ToastService } from '../../core/services/toast.service';
import { Pedido, EstadoPedido } from '../../core/models/pedido.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';
import { ComprobanteModalComponent } from '../../shared/components/comprobante-modal/comprobante-modal.component';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent, AppCurrencyPipe, ComprobanteModalComponent],
  template: `
    <div class="pedidos-container">
      <!-- ENCABEZADO Y FILTROS -->
      <div class="monitor-header">
        <div>
          <h1 class="page-title">Monitor de Pedidos (Cocina y Mostrador)</h1>
          <p class="page-subtitle">Seguimiento en tiempo real de órdenes de helados y cafetería</p>
        </div>

        <div class="filters-bar">
          <div class="filter-item">
            <label class="filter-label">Fecha:</label>
            <input 
              type="date" 
              class="form-control date-input" 
              [ngModel]="pedidosService.fechaFiltro()" 
              (ngModelChange)="onFechaChange($event)"
            />
          </div>

          <div class="filter-item">
            <label class="filter-label">Estado:</label>
            <select 
              class="form-control select-input" 
              [ngModel]="pedidosService.estadoFiltro()" 
              (ngModelChange)="onEstadoChange($event)"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PREPARANDO">En Preparación</option>
              <option value="LISTO">Listos para Entrega</option>
              <option value="ENTREGADO">Entregados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>

          <button type="button" class="btn btn-secondary btn-refresh" (click)="pedidosService.cargarPedidos()">
            <app-icon name="refresh" [size]="16" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- TABLERO KANBAN DE ESTADOS -->
      <div class="kanban-grid">
        <!-- COLUMNA 1: PENDIENTE -->
        <div class="kanban-col col-pendiente">
          <div class="col-header">
            <div class="col-title-group">
              <span class="status-dot dot-pendiente"></span>
              <h2 class="col-title">Pendientes</h2>
            </div>
            <span class="col-badge">{{ pedidosPendientes().length }}</span>
          </div>

          <div class="col-cards">
            @for (p of pedidosPendientes(); track p.id) {
              <div class="order-card card-pendiente">
                <div class="order-top">
                  <span class="order-id">#{{ p.id }}</span>
                  <div class="order-top-badges">
                    @if (p.tipoComprobante === 'FACTURA') {
                      <span class="badge badge-factura" title="Factura: {{ p.numeroFactura || 'Emitida' }}">FACTURA</span>
                    }
                    <span class="badge badge-pendiente">{{ p.tipoEntrega }}</span>
                  </div>
                </div>

                <div class="order-client">
                  <strong>Cliente:</strong> {{ p.clienteNombre || 'Consumidor Final' }}
                </div>

                @if (p.notas) {
                  <div class="order-notes">
                    <app-icon name="alert-triangle" [size]="14" />
                    <span>{{ p.notas }}</span>
                  </div>
                }

                <div class="order-items-preview">
                  @for (it of (p.items || p.detalles || []); track it.id || $index) {
                    <div class="order-item-chip">
                      {{ it.cantidad }}x 
                      @if (it.tipoItem === 'HELADO') {
                        {{ it.presentacion?.nombre || 'Helado' }}
                      } @else {
                        {{ it.productoSimple?.nombre || 'Producto' }}
                      }
                    </div>
                  }
                </div>

                <div class="order-bottom">
                  <span class="order-total">{{ p.total | appCurrency }}</span>
                  <div class="card-actions">
                    <button 
                      type="button" 
                      class="btn btn-sm btn-outline btn-icon-only" 
                      (click)="verComprobante(p)"
                      title="Ver / Imprimir Comprobante"
                    >
                      <app-icon name="file-text" [size]="14" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-primary" 
                      (click)="avanzarEstado(p, 'PREPARANDO')"
                      title="Pasar a Preparando"
                    >
                      <span>Preparar</span>
                      <app-icon name="arrow-right" [size]="14" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-danger btn-icon-only" 
                      (click)="confirmarCancelacion(p)"
                      title="Cancelar pedido"
                    >
                      <app-icon name="trash" [size]="14" />
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- COLUMNA 2: PREPARANDO -->
        <div class="kanban-col col-preparando">
          <div class="col-header">
            <div class="col-title-group">
              <span class="status-dot dot-preparando"></span>
              <h2 class="col-title">En Preparación</h2>
            </div>
            <span class="col-badge">{{ pedidosPreparando().length }}</span>
          </div>

          <div class="col-cards">
            @for (p of pedidosPreparando(); track p.id) {
              <div class="order-card card-preparando">
                <div class="order-top">
                  <span class="order-id">#{{ p.id }}</span>
                  <div class="order-top-badges">
                    @if (p.tipoComprobante === 'FACTURA') {
                      <span class="badge badge-factura" title="Factura: {{ p.numeroFactura || 'Emitida' }}">FACTURA</span>
                    }
                    <span class="badge badge-preparando">{{ p.tipoEntrega }}</span>
                  </div>
                </div>

                <div class="order-client">
                  <strong>Cliente:</strong> {{ p.clienteNombre || 'Consumidor Final' }}
                </div>

                @if (p.notas) {
                  <div class="order-notes">
                    <app-icon name="alert-triangle" [size]="14" />
                    <span>{{ p.notas }}</span>
                  </div>
                }

                <div class="order-items-preview">
                  @for (it of (p.items || p.detalles || []); track it.id || $index) {
                    <div class="order-item-chip">
                      {{ it.cantidad }}x 
                      @if (it.tipoItem === 'HELADO') {
                        {{ it.presentacion?.nombre || 'Helado' }}
                      } @else {
                        {{ it.productoSimple?.nombre || 'Producto' }}
                      }
                    </div>
                  }
                </div>

                <div class="order-bottom">
                  <span class="order-total">{{ p.total | appCurrency }}</span>
                  <div class="card-actions">
                    <button 
                      type="button" 
                      class="btn btn-sm btn-outline btn-icon-only" 
                      (click)="verComprobante(p)"
                      title="Ver / Imprimir Comprobante"
                    >
                      <app-icon name="file-text" [size]="14" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-success" 
                      (click)="avanzarEstado(p, 'LISTO')"
                      title="Marcar como Listo"
                    >
                      <span>Listo</span>
                      <app-icon name="check" [size]="14" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-danger btn-icon-only" 
                      (click)="confirmarCancelacion(p)"
                      title="Cancelar pedido"
                    >
                      <app-icon name="trash" [size]="14" />
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- COLUMNA 3: LISTO -->
        <div class="kanban-col col-listo">
          <div class="col-header">
            <div class="col-title-group">
              <span class="status-dot dot-listo"></span>
              <h2 class="col-title">Listos para Entrega</h2>
            </div>
            <span class="col-badge">{{ pedidosListos().length }}</span>
          </div>

          <div class="col-cards">
            @for (p of pedidosListos(); track p.id) {
              <div class="order-card card-listo">
                <div class="order-top">
                  <span class="order-id">#{{ p.id }}</span>
                  <div class="order-top-badges">
                    @if (p.tipoComprobante === 'FACTURA') {
                      <span class="badge badge-factura" title="Factura: {{ p.numeroFactura || 'Emitida' }}">FACTURA</span>
                    }
                    <span class="badge badge-listo">{{ p.tipoEntrega }}</span>
                  </div>
                </div>

                <div class="order-client">
                  <strong>Cliente:</strong> {{ p.clienteNombre || 'Consumidor Final' }}
                </div>

                <div class="order-items-preview">
                  @for (it of (p.items || p.detalles || []); track it.id || $index) {
                    <div class="order-item-chip">
                      {{ it.cantidad }}x 
                      @if (it.tipoItem === 'HELADO') {
                        {{ it.presentacion?.nombre || 'Helado' }}
                      } @else {
                        {{ it.productoSimple?.nombre || 'Producto' }}
                      }
                    </div>
                  }
                </div>

                <div class="order-bottom">
                  <span class="order-total">{{ p.total | appCurrency }}</span>
                  <div class="card-actions">
                    <button 
                      type="button" 
                      class="btn btn-sm btn-outline btn-icon-only" 
                      (click)="verComprobante(p)"
                      title="Ver / Imprimir Comprobante"
                    >
                      <app-icon name="file-text" [size]="14" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-primary" 
                      (click)="avanzarEstado(p, 'ENTREGADO')"
                    >
                      <span>Entregar</span>
                      <app-icon name="check" [size]="14" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-danger btn-icon-only" 
                      (click)="confirmarCancelacion(p)"
                      title="Cancelar pedido / Anular venta"
                    >
                      <app-icon name="trash" [size]="14" />
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- COLUMNA 4: ENTREGADOS / HISTORIAL RECIENTE -->
        <div class="kanban-col col-entregado">
          <div class="col-header">
            <div class="col-title-group">
              <span class="status-dot dot-entregado"></span>
              <h2 class="col-title">Entregados Hoy</h2>
            </div>
            <span class="col-badge">{{ pedidosEntregados().length }}</span>
          </div>

          <div class="col-cards">
            @for (p of pedidosEntregados(); track p.id) {
              <div class="order-card card-entregado">
                <div class="order-top">
                  <span class="order-id">#{{ p.id }}</span>
                  <div class="order-top-badges">
                    @if (p.tipoComprobante === 'FACTURA') {
                      <span class="badge badge-factura" title="Factura: {{ p.numeroFactura || 'Emitida' }}">FACTURA</span>
                    }
                    <span class="badge badge-entregado">Entregado</span>
                  </div>
                </div>
                <div class="order-client">
                  <strong>Cliente:</strong> {{ p.clienteNombre || 'Consumidor Final' }}
                </div>
                <div class="order-bottom">
                  <span class="order-total">{{ p.total | appCurrency }}</span>
                  <div class="card-actions">
                    <button 
                      type="button" 
                      class="btn btn-sm btn-outline btn-icon-only" 
                      (click)="verComprobante(p)"
                      title="Ver / Reimprimir Comprobante"
                    >
                      <app-icon name="file-text" [size]="14" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-danger btn-icon-only" 
                      (click)="confirmarCancelacion(p)"
                      title="Cancelar pedido / Anular venta"
                    >
                      <app-icon name="trash" [size]="14" />
                    </button>
                    <span class="order-method">
                      {{ p.metodoPago }}
                      @if (p.numeroVoucher) {
                        <small title="Voucher de POS"> (#{{ p.numeroVoucher }})</small>
                      }
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- MODAL CONFIRMAR CANCELACIÓN -->
      <app-modal
        [isOpen]="modalCancelarAbierto()"
        title="Confirmar Cancelación de Pedido"
        size="sm"
        (close)="modalCancelarAbierto.set(false)"
      >
        <div body>
          @if (pedidoACancelar()) {
            <p>¿Estás seguro de cancelar el <strong>Pedido #{{ pedidoACancelar()?.id }}</strong>?</p>
            <p class="text-muted mt-2" style="font-size: 0.85rem;">
              Esta acción reintegrará el stock correspondiente a los productos simples involucrados.
            </p>
          }
        </div>
        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalCancelarAbierto.set(false)">
            Volver
          </button>
          <button type="button" class="btn btn-danger" (click)="ejecutarCancelacion()">
            Confirmar Cancelación
          </button>
        </div>
      </app-modal>

      <!-- MODAL VER/IMPRIMIR COMPROBANTE -->
      <app-comprobante-modal
        [isOpen]="modalComprobanteAbierto()"
        [pedido]="pedidoSeleccionado()"
        (close)="cerrarComprobante()"
        (pedidoAnulado)="onPedidoAnuladoDesdeModal($event)"
      />
    </div>
  `,
  styles: [`
    .pedidos-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .monitor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: var(--bg-surface);
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    .page-title {
      font-size: 1.35rem;
      color: var(--text-main);
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.2rem 0 0;
    }

    .filters-bar {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      flex-wrap: wrap;
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .date-input, .select-input {
      padding: 0.45rem 0.75rem;
      font-size: 0.875rem;
      min-width: 140px;
    }

    .btn-refresh {
      min-height: 2.25rem;
      padding: 0.45rem 0.85rem;
    }

    /* KANBAN */
    .kanban-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      align-items: start;
    }

    .kanban-col {
      background: #f8fafc;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 220px);
    }

    .col-header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--border-color);
      background: var(--bg-surface);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .col-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-pendiente { background: #f59e0b; }
    .dot-preparando { background: #3b82f6; }
    .dot-listo { background: #10b981; }
    .dot-entregado { background: #64748b; }

    .col-title {
      font-size: 0.9375rem;
      font-weight: 700;
      margin: 0;
    }

    .col-badge {
      background: var(--bg-subtle);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      color: var(--text-muted);
    }

    .col-cards {
      padding: 0.875rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .order-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .order-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-id {
      font-weight: 800;
      font-size: 1rem;
      color: var(--text-main);
    }

    .order-client {
      font-size: 0.8125rem;
      color: var(--text-main);
    }

    .order-notes {
      font-size: 0.75rem;
      background: #fef3c7;
      color: #92400e;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .order-items-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .order-item-chip {
      font-size: 0.72rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .order-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
      margin-top: 0.25rem;
    }

    .order-total {
      font-weight: 800;
      font-size: 1rem;
      color: var(--primary);
    }

    .card-actions {
      display: flex;
      gap: 0.35rem;
    }

    .btn-icon-only {
      padding: 0.35rem;
      min-height: 2rem;
    }

    .order-method {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .badge-factura {
      background-color: #ede9fe;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
      font-weight: 700;
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
    }

    .order-top-badges {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    @media (max-width: 1200px) {
      .kanban-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .kanban-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PedidosComponent implements OnInit {
  public readonly pedidosService = inject(PedidosService);
  private readonly toast = inject(ToastService);

  public readonly modalCancelarAbierto = signal<boolean>(false);
  public readonly pedidoACancelar = signal<Pedido | null>(null);

  public readonly modalComprobanteAbierto = signal<boolean>(false);
  public readonly pedidoSeleccionado = signal<Pedido | null>(null);

  ngOnInit(): void {
    this.pedidosService.cargarPedidos();
  }

  onFechaChange(nuevaFecha: string): void {
    this.pedidosService.fechaFiltro.set(nuevaFecha);
    this.pedidosService.cargarPedidos();
  }

  onEstadoChange(nuevoEstado: string): void {
    this.pedidosService.estadoFiltro.set(nuevoEstado);
    this.pedidosService.cargarPedidos();
  }

  public readonly pedidosPendientes = computed(() => {
    return this.pedidosService.pedidos().filter(p => p.estado === 'PENDIENTE');
  });

  public readonly pedidosPreparando = computed(() => {
    return this.pedidosService.pedidos().filter(p => p.estado === 'PREPARANDO');
  });

  public readonly pedidosListos = computed(() => {
    return this.pedidosService.pedidos().filter(p => p.estado === 'LISTO');
  });

  public readonly pedidosEntregados = computed(() => {
    return this.pedidosService.pedidos().filter(p => p.estado === 'ENTREGADO');
  });

  avanzarEstado(pedido: Pedido, nuevoEstado: 'PREPARANDO' | 'LISTO' | 'ENTREGADO'): void {
    this.pedidosService.cambiarEstado(pedido.id, nuevoEstado).subscribe();
  }

  confirmarCancelacion(pedido: Pedido): void {
    this.pedidoACancelar.set(pedido);
    this.modalCancelarAbierto.set(true);
  }

  verComprobante(pedido: Pedido): void {
    this.pedidoSeleccionado.set(pedido);
    this.modalComprobanteAbierto.set(true);
  }

  cerrarComprobante(): void {
    this.modalComprobanteAbierto.set(false);
    this.pedidoSeleccionado.set(null);
  }

  ejecutarCancelacion(): void {
    const pedido = this.pedidoACancelar();
    if (!pedido) return;

    this.pedidosService.cancelarPedido(pedido.id).subscribe({
      next: () => {
        this.modalCancelarAbierto.set(false);
        this.pedidoACancelar.set(null);
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'No se pudo cancelar el pedido.';
        this.toast.error(msg);
      }
    });
  }

  onPedidoAnuladoDesdeModal(pedidoId: number): void {
    this.cerrarComprobante();
    this.pedidosService.cargarPedidos();
  }
}
