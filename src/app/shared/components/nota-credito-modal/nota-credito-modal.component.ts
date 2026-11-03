import { Component, effect, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotasCreditoService } from '../../../core/services/notas-credito.service';
import { ToastService } from '../../../core/services/toast.service';
import { FacturaParaNotaCredito, NotaCredito, SerieNotaCredito } from '../../../core/models/nota-credito.model';
import { AppModalComponent } from '../modal/modal.component';
import { AppCurrencyPipe } from '../../pipes/currency-format.pipe';

/**
 * Emisión de una nota de crédito (total o parcial) sobre una factura. Tras emitirla muestra el comprobante
 * para imprimirlo. Quien no es administrador necesita la clave de un administrador.
 */
@Component({
  selector: 'app-nota-credito-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent, AppCurrencyPipe],
  template: `
    <app-modal [isOpen]="isOpen()" [title]="emitida() ? 'Nota de crédito emitida' : 'Nota de crédito'" size="lg" (close)="cerrar()">
      <div body class="nc-body">
        @if (cargando()) {
          <p class="text-muted">Cargando factura...</p>
        } @else if (emitida(); as nc) {
          <div class="nc-comprobante" id="nc-comprobante-imprimir">
            <h3 class="text-center m-0">NOTA DE CRÉDITO</h3>
            <p class="text-center m-0"><strong>N° {{ nc.numero }}</strong></p>
            <p class="text-center m-0 text-muted">Timbrado {{ nc.timbrado }}@if (nc.timbradoVencimiento) { · válido hasta {{ nc.timbradoVencimiento }} }</p>
            <hr />
            <p class="m-0"><strong>Fecha:</strong> {{ nc.fecha | date:'dd/MM/yyyy HH:mm' }}</p>
            <p class="m-0"><strong>Cliente:</strong> {{ nc.clienteNombre || 'Consumidor Final' }} @if (nc.clienteRuc) { · RUC {{ nc.clienteRuc }} }</p>
            <p class="m-0"><strong>Factura que acredita:</strong> {{ nc.facturaNumero }}@if (nc.facturaTimbrado) { (timbrado {{ nc.facturaTimbrado }}) }</p>
            <p class="m-0"><strong>Motivo:</strong> {{ nc.motivo }}</p>
            <table class="nc-tabla">
              <thead><tr><th>Descripción</th><th class="r">Cant.</th><th class="r">Subtotal</th></tr></thead>
              <tbody>
                @for (l of nc.lineas; track l.detalleId) {
                  <tr><td>{{ l.descripcion }}</td><td class="r">{{ l.cantidad }}</td><td class="r">{{ l.subtotal | appCurrency }}</td></tr>
                }
              </tbody>
            </table>
            <p class="m-0 r">Exentas: {{ nc.totalExentas | appCurrency }} · Gravadas 5%: {{ nc.totalGravada5 | appCurrency }} · Gravadas 10%: {{ nc.totalGravada10 | appCurrency }}</p>
            <p class="m-0 r">IVA 5%: {{ nc.totalIva5 | appCurrency }} · IVA 10%: {{ nc.totalIva10 | appCurrency }} · Total IVA: {{ nc.totalIva | appCurrency }}</p>
            <p class="nc-total r"><strong>TOTAL ACREDITADO: {{ nc.total | appCurrency }}</strong></p>
          </div>
          <p class="text-muted small">
            {{ nc.reintegraStock ? 'La mercadería volvió al inventario.' : 'No se reintegró stock.' }}
            {{ nc.egresoCajaRegistrado ? ' El dinero devuelto se registró como egreso de tu caja.' : '' }}
          </p>
        } @else if (factura(); as f) {
          <p class="m-0"><strong>Factura {{ f.numeroFactura }}</strong> · {{ f.clienteNombre || 'Consumidor Final' }} · Total {{ f.total | appCurrency }}</p>

          @if (!f.serieConfigurada) {
            <div class="nc-aviso">
              <strong>Falta el timbrado de notas de crédito.</strong>
              @if (auth.isAdminOrOwner()) {
                <div class="nc-serie">
                  <input class="form-control" placeholder="N° de timbrado" [(ngModel)]="serie.timbrado" />
                  <label>Válido desde <input type="date" class="form-control" [(ngModel)]="serie.timbradoInicio" /></label>
                  <label>Vence <input type="date" class="form-control" [(ngModel)]="serie.timbradoVencimiento" /></label>
                  <label>Número desde <input type="number" class="form-control" [(ngModel)]="serie.numeroInicio" /></label>
                  <label>Número hasta <input type="number" class="form-control" [(ngModel)]="serie.numeroFin" /></label>
                  <button type="button" class="btn btn-primary btn-sm" (click)="guardarSerie(f)" [disabled]="!serie.timbrado?.trim()">Guardar timbrado</button>
                </div>
              } @else {
                <span> Pide a un administrador que lo cargue.</span>
              }
            </div>
          }

          <table class="nc-tabla">
            <thead><tr><th>Descripción</th><th class="r">Vendido</th><th class="r">Ya acreditado</th><th class="r">Acreditar ahora</th></tr></thead>
            <tbody>
              @for (l of f.lineas; track l.detalleId) {
                <tr>
                  <td>{{ l.descripcion }}</td>
                  <td class="r">{{ l.cantidad }}</td>
                  <td class="r">{{ l.cantidadAcreditada }}</td>
                  <td class="r">
                    @if (l.cantidadDisponible > 0) {
                      <input type="number" min="0" [max]="l.cantidadDisponible" class="form-control nc-cant"
                             [ngModel]="cantidades()[l.detalleId] ?? 0" (ngModelChange)="fijarCantidad(l.detalleId, $event, l.cantidadDisponible)" />
                    } @else { <span class="text-muted">—</span> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <button type="button" class="btn btn-outline btn-sm" (click)="todo(f)">Acreditar todo lo disponible</button>

          <div class="nc-form">
            <label>Motivo (obligatorio)
              <input class="form-control" maxlength="300" [(ngModel)]="motivo" placeholder="Ej: devolución del cliente, error de facturación" />
            </label>
            <label class="nc-check"><input type="checkbox" [(ngModel)]="reintegrarStock" /> La mercadería vuelve al inventario</label>
            @if (!auth.isAdminOrOwner()) {
              <label>Clave de un administrador
                <input type="password" class="form-control" [(ngModel)]="adminPassword" autocomplete="off" />
              </label>
            }
          </div>
        }
      </div>
      <div footer>
        @if (emitida()) {
          <button type="button" class="btn btn-outline" (click)="imprimir()">Imprimir</button>
          <button type="button" class="btn btn-primary" (click)="cerrar()">Listo</button>
        } @else {
          <button type="button" class="btn btn-secondary" (click)="cerrar()">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="emitir()" [disabled]="!puedeEmitir()">
            {{ emitiendo() ? 'Emitiendo...' : 'Emitir nota de crédito' }}
          </button>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .nc-body { display: flex; flex-direction: column; gap: 12px; }
    .nc-tabla { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .nc-tabla th, .nc-tabla td { padding: 6px 8px; border-bottom: 1px solid var(--border-color, #e2e8f0); text-align: left; }
    .r { text-align: right !important; }
    .nc-cant { width: 80px; margin-left: auto; text-align: right; }
    .nc-aviso { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 10px; }
    .nc-serie { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-top: 8px; align-items: end; }
    .nc-form { display: flex; flex-direction: column; gap: 8px; }
    .nc-check { display: flex; gap: 8px; align-items: center; }
    .nc-comprobante { border: 1px dashed var(--border-color, #94a3b8); border-radius: 8px; padding: 14px; }
    .nc-total { font-size: 1.1rem; margin: 8px 0 0; }
  `]
})
export class NotaCreditoModalComponent {
  readonly auth = inject(AuthService);
  private readonly notasCredito = inject(NotasCreditoService);
  private readonly toast = inject(ToastService);

  isOpen = input<boolean>(false);
  pedidoId = input<number | null>(null);
  close = output<void>();
  /** Se emitió una nota de crédito (para que la pantalla de origen se refresque). */
  emitidaOk = output<NotaCredito>();

  readonly factura = signal<FacturaParaNotaCredito | null>(null);
  readonly emitida = signal<NotaCredito | null>(null);
  readonly cargando = signal(false);
  readonly emitiendo = signal(false);
  readonly cantidades = signal<Record<number, number>>({});

  motivo = '';
  reintegrarStock = true;
  adminPassword = '';
  serie: SerieNotaCredito = { timbrado: '' };

  readonly hayCantidad = computed(() => Object.values(this.cantidades()).some(c => c > 0));

  constructor() {
    effect(() => {
      if (this.isOpen() && this.pedidoId()) {
        this.reiniciar();
        this.cargar(this.pedidoId()!);
      }
    });
  }

  private reiniciar(): void {
    this.factura.set(null);
    this.emitida.set(null);
    this.cantidades.set({});
    this.motivo = '';
    this.reintegrarStock = true;
    this.adminPassword = '';
    this.serie = { timbrado: '' };
  }

  private cargar(pedidoId: number): void {
    this.cargando.set(true);
    this.notasCredito.facturaDePedido(pedidoId).subscribe({
      next: f => { this.factura.set(f); this.cargando.set(false); },
      error: err => {
        this.cargando.set(false);
        this.toast.error(err.error?.mensaje || err.error?.error || 'No se pudo cargar la factura.');
        this.close.emit();
      }
    });
  }

  fijarCantidad(detalleId: number, valor: number, maximo: number): void {
    const n = Math.max(0, Math.min(Math.floor(Number(valor) || 0), maximo));
    this.cantidades.update(c => ({ ...c, [detalleId]: n }));
  }

  todo(f: FacturaParaNotaCredito): void {
    const todas: Record<number, number> = {};
    f.lineas.forEach(l => { if (l.cantidadDisponible > 0) todas[l.detalleId] = l.cantidadDisponible; });
    this.cantidades.set(todas);
  }

  puedeEmitir(): boolean {
    const f = this.factura();
    return !!f && f.serieConfigurada && this.hayCantidad() && this.motivo.trim().length > 0
      && (this.auth.isAdminOrOwner() || this.adminPassword.trim().length > 0) && !this.emitiendo();
  }

  guardarSerie(f: FacturaParaNotaCredito): void {
    if (!f.puntoExpedicionId) {
      this.toast.error('La factura no tiene punto de expedición.');
      return;
    }
    this.notasCredito.guardarSerie(f.puntoExpedicionId, this.serie).subscribe({
      next: () => { this.toast.success('Timbrado de notas de crédito guardado.'); this.cargar(f.pedidoId); },
      error: err => this.toast.error(err.error?.mensaje || err.error?.error || 'No se pudo guardar el timbrado.')
    });
  }

  emitir(): void {
    const f = this.factura();
    if (!f || !this.puedeEmitir()) return;
    const items = Object.entries(this.cantidades())
      .filter(([, c]) => c > 0)
      .map(([id, c]) => ({ detalleId: Number(id), cantidad: c }));
    this.emitiendo.set(true);
    this.notasCredito.emitir(f.pedidoId, {
      motivo: this.motivo.trim(),
      items,
      reintegrarStock: this.reintegrarStock,
      adminPassword: this.auth.isAdminOrOwner() ? undefined : this.adminPassword
    }).subscribe({
      next: nc => {
        this.emitiendo.set(false);
        this.emitida.set(nc);
        this.toast.success(`Nota de crédito ${nc.numero} emitida.`);
        this.emitidaOk.emit(nc);
      },
      error: err => {
        this.emitiendo.set(false);
        this.toast.error(err.error?.mensaje || err.error?.error || 'No se pudo emitir la nota de crédito.');
      }
    });
  }

  imprimir(): void {
    const nodo = document.getElementById('nc-comprobante-imprimir');
    if (!nodo) return;
    const w = window.open('', '_blank', 'width=700,height=800');
    if (!w) {
      this.toast.warning('El navegador bloqueó la ventana de impresión.');
      return;
    }
    w.document.write(`<html><head><title>Nota de crédito</title>
      <style>body{font-family:sans-serif;padding:16px}table{width:100%;border-collapse:collapse}
      th,td{padding:4px 6px;border-bottom:1px solid #ccc;text-align:left}.r{text-align:right}</style></head>
      <body>${nodo.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  cerrar(): void {
    this.close.emit();
  }
}
