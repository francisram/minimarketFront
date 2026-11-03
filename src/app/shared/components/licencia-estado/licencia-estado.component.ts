import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { AppIconComponent } from '../icon/icon.component';
import { LicenciaEstadoService } from '../../../core/services/licencia-estado.service';
import { AuthService } from '../../../core/services/auth.service';

/** Aviso de vencimiento de licencia y de retroceso del reloj del servidor (solo informativo). */
@Component({
  selector: 'app-licencia-estado',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    @if (licencia.estado(); as e) {
      @if (e.estado === 'VENCIDA' || e.estado === 'POR_VENCER' || e.estado === 'SIN_LICENCIA') {
        <div class="lic-banner" [class.lic-vencida]="e.estado === 'VENCIDA' || e.estado === 'SIN_LICENCIA'" role="alert">
          <app-icon name="shield" [size]="20" />
          <span><strong>Licencia:</strong> {{ e.mensaje }}</span>
        </div>
      }
      @if (e.relojRetrocedido) {
        <div class="lic-banner lic-vencida" role="alert">
          <app-icon name="alert-triangle" [size]="20" />
          <span><strong>Reloj del servidor:</strong> {{ e.detalleReloj }}</span>
          @if (auth.isOwner()) {
            <button type="button" class="btn btn-secondary btn-sm" [disabled]="enviando" (click)="reconocer()">
              Ya corregí la hora
            </button>
          }
        </div>
      }
    }
  `,
  styles: [`
    .lic-banner { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; background: #fef3c7; border: 1px solid #fde047;
      color: #78350f; border-radius: 0.75rem; padding: 0.6rem 1.25rem; margin-bottom: 1rem; }
    .lic-vencida { background: #fee2e2; border-color: #fca5a5; color: #7f1d1d; }
  `]
})
export class LicenciaEstadoComponent implements OnInit {
  public readonly licencia = inject(LicenciaEstadoService);
  public readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  public enviando = false;

  ngOnInit(): void {
    timer(0, 300_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.licencia.actualizar());
  }

  reconocer(): void {
    this.enviando = true;
    this.licencia.reconocerReloj().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => (this.enviando = false),
      error: () => (this.enviando = false)
    });
  }
}
