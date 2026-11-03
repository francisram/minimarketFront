import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { timer } from 'rxjs';
import { AppIconComponent } from '../icon/icon.component';
import { BackupService } from '../../../core/services/backup.service';

/**
 * Salud de los respaldos automáticos.
 * - modo "banner": solo aparece si hay alertas (se usa en el layout para ADMIN/OWNER).
 * - modo "panel": detalle completo (se usa en la página de copias de seguridad).
 */
@Component({
  selector: 'app-backup-estado',
  standalone: true,
  imports: [AppIconComponent, DatePipe],
  template: `
    @if (backupService.estado(); as e) {
      @if (modo() === 'banner') {
        @if (e.requiereAtencion) {
          <div class="bk-banner" role="alert">
            <app-icon name="alert-triangle" [size]="20" />
            <div>
              <strong>Atención con los respaldos de la base de datos.</strong>
              <ul>
                @for (a of e.alertas; track a) { <li>{{ a }}</li> }
              </ul>
            </div>
          </div>
        }
      } @else {
        <section class="bk-panel" [class.bk-panel-alerta]="e.requiereAtencion">
          <h3 class="bk-title">
            <app-icon [name]="e.requiereAtencion ? 'alert-triangle' : 'database'" [size]="18" />
            {{ e.requiereAtencion ? 'Los respaldos requieren atención' : 'Respaldos automáticos al día' }}
          </h3>

          @for (a of e.alertas; track a) { <p class="bk-alerta">{{ a }}</p> }
          @for (a of e.advertencias; track a) { <p class="bk-aviso">{{ a }}</p> }

          <dl class="bk-grid">
            <div>
              <dt>Último respaldo</dt>
              <dd>
                @if (e.ultimoRespaldo) {
                  {{ e.ultimoRespaldo.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}
                  <small>(hace {{ e.horasDesdeUltimoRespaldo }} h, {{ e.ultimoRespaldo.tamanoLegible }})</small>
                } @else { Ninguno }
              </dd>
            </div>
            <div>
              <dt>Último automático</dt>
              <dd>
                @if (e.ultimaEjecucionProgramada) {
                  <span [class]="'bk-pill bk-' + e.resultadoProgramado">{{ e.resultadoProgramado }}</span>
                  {{ e.ultimaEjecucionProgramada | date: 'dd/MM HH:mm' }}
                } @else { Aún no se ejecutó (programado a las 03:00) }
              </dd>
            </div>
            <div>
              <dt>Verificación de restauración</dt>
              <dd>
                @if (e.resultadoVerificacion) {
                  <span [class]="'bk-pill bk-' + e.resultadoVerificacion">{{ e.resultadoVerificacion }}</span>
                  {{ e.nivelVerificacion === 'COMPLETA' ? 'restauración de prueba' : 'solo integridad del archivo' }}
                } @else { —}
              </dd>
            </div>
            <div>
              <dt>Copia fuera del servidor</dt>
              <dd>
                @if (e.resultadoCopiaExterna === 'OK' || e.resultadoCopiaExterna === 'ERROR') {
                  <span [class]="'bk-pill bk-' + e.resultadoCopiaExterna">{{ e.resultadoCopiaExterna }}</span>
                  {{ e.fechaCopiaExterna | date: 'dd/MM HH:mm' }}
                } @else if (!e.copiaExternaConfigurada) {
                  No configurada
                } @else { — }
              </dd>
            </div>
          </dl>
        </section>
      }
    }
  `,
  styles: [`
    .bk-banner { display: flex; gap: 0.75rem; align-items: flex-start; background: #fee2e2; border: 1px solid #fca5a5;
      color: #7f1d1d; border-radius: 0.75rem; padding: 0.75rem 1.25rem; margin-bottom: 1rem; }
    .bk-banner ul { margin: 0.25rem 0 0; padding-left: 1.1rem; }
    .bk-panel { border: 1px solid var(--border-color, #e2e8f0); background: var(--bg-surface, #fff); border-radius: 1rem;
      padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
    .bk-panel-alerta { border-color: #fca5a5; background: #fff7f7; }
    .bk-title { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.75rem; font-size: 1rem; }
    .bk-alerta { color: #b91c1c; margin: 0.25rem 0; font-weight: 600; }
    .bk-aviso { color: #92400e; margin: 0.25rem 0; }
    .bk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem 1.5rem; margin: 0.75rem 0 0; }
    .bk-grid dt { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted, #64748b); }
    .bk-grid dd { margin: 0.15rem 0 0; }
    .bk-grid small { color: var(--text-muted, #64748b); }
    .bk-pill { display: inline-block; padding: 0 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .bk-OK { background: #dcfce7; color: #166534; }
    .bk-ERROR { background: #fee2e2; color: #991b1b; }
  `]
})
export class BackupEstadoComponent implements OnInit {
  public readonly backupService = inject(BackupService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly modo = input<'banner' | 'panel'>('panel');
  /** Cada cuánto consultar el estado (ms). */
  public readonly intervaloMs = input<number>(60_000);

  ngOnInit(): void {
    timer(0, this.intervaloMs()).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.backupService.actualizarEstado());
  }
}
