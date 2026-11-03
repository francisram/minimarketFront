import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { timer } from 'rxjs';
import { AppIconComponent } from '../icon/icon.component';
import { AppModalComponent } from '../modal/modal.component';
import { TrabajosImpresionService } from '../../../core/services/trabajos-impresion.service';
import { ToastService } from '../../../core/services/toast.service';
import { TrabajoImpresion } from '../../../core/models/trabajo-impresion.model';

/**
 * Aviso de tickets que no se pudieron imprimir (dead letter del spooler).
 * Sondea el resumen cada pocos segundos y, si hay tickets sin imprimir, permite revisarlos y reintentar.
 */
@Component({
  selector: 'app-spooler-alert',
  standalone: true,
  imports: [AppIconComponent, AppModalComponent, DatePipe],
  template: `
    @if (trabajos.sinImprimir() > 0) {
      <div class="spooler-banner" role="alert">
        <div class="spooler-text">
          <app-icon name="printer" [size]="20" />
          <span>
            <strong>{{ trabajos.sinImprimir() }}
              {{ trabajos.sinImprimir() === 1 ? 'ticket no se pudo imprimir' : 'tickets no se pudieron imprimir' }}.</strong>
            Revisa la impresora (papel, tapa, red) y reintenta.
          </span>
        </div>
        <button type="button" class="btn btn-danger btn-sm" (click)="abrir()">Ver y reintentar</button>
      </div>
    }

    <app-modal [isOpen]="modalAbierto()" title="Tickets sin imprimir" size="lg" (close)="modalAbierto.set(false)">
      <div body>
        @if (cargando()) {
          <p class="text-muted">Cargando...</p>
        } @else if (pendientes().length === 0) {
          <p class="text-muted">No hay tickets pendientes de reimpresión.</p>
        } @else {
          <table class="spooler-table">
            <thead>
              <tr><th>Pedido</th><th>Fecha</th><th>Intentos</th><th>Último error</th><th></th></tr>
            </thead>
            <tbody>
              @for (t of pendientes(); track t.id) {
                <tr>
                  <td>#{{ t.referenciaId }}</td>
                  <td>{{ t.fechaCreacion | date: 'dd/MM HH:mm' }}</td>
                  <td>{{ t.intentos }}</td>
                  <td class="spooler-error">{{ t.ultimoError || '—' }}</td>
                  <td>
                    <button type="button" class="btn btn-primary btn-sm"
                            [disabled]="reintentando() === t.id" (click)="reintentar(t)">
                      {{ reintentando() === t.id ? 'Enviando...' : 'Reintentar' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
      <div footer>
        <button type="button" class="btn btn-secondary" (click)="modalAbierto.set(false)">Cerrar</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .spooler-banner {
      display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;
      background: #fee2e2; border: 1px solid #fca5a5; color: #7f1d1d;
      border-radius: var(--radius-lg, 0.75rem); padding: 0.75rem 1.25rem; margin-bottom: 1rem;
    }
    .spooler-text { display: flex; align-items: center; gap: 0.75rem; }
    .spooler-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .spooler-table th, .spooler-table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border-color, #e2e8f0); }
    .spooler-error { color: #b91c1c; max-width: 260px; word-break: break-word; }
  `]
})
export class SpoolerAlertComponent implements OnInit {
  public readonly trabajos = inject(TrabajosImpresionService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly modalAbierto = signal(false);
  public readonly cargando = signal(false);
  public readonly pendientes = signal<TrabajoImpresion[]>([]);
  public readonly reintentando = signal<number | null>(null);

  ngOnInit(): void {
    // Primer chequeo inmediato y luego cada 10 s mientras el componente esté en pantalla.
    timer(0, 10_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.trabajos.actualizarResumen();
      if (this.modalAbierto()) {
        this.cargarLista();
      }
    });
  }

  abrir(): void {
    this.modalAbierto.set(true);
    this.cargarLista();
  }

  private cargarLista(): void {
    this.cargando.set(true);
    this.trabajos.listar('MUERTO').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (lista) => { this.pendientes.set(lista); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  reintentar(t: TrabajoImpresion): void {
    this.reintentando.set(t.id);
    this.trabajos.reintentar(t.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.reintentando.set(null);
        this.pendientes.update(l => l.filter(x => x.id !== t.id));
        this.toast.info(`Ticket del pedido #${t.referenciaId} reencolado. Se imprimirá en unos segundos.`);
      },
      error: () => this.reintentando.set(null)
    });
  }
}
