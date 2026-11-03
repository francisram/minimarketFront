import { Component, inject } from '@angular/core';
import { InactividadService } from '../../../core/services/inactividad.service';

/** Aviso con cuenta regresiva antes de cerrar la sesión por inactividad. */
@Component({
  selector: 'app-aviso-inactividad',
  standalone: true,
  template: `
    @if (inactividad.avisoVisible()) {
      <div class="aviso-fondo" role="alertdialog" aria-modal="true" aria-labelledby="aviso-inact-titulo">
        <div class="aviso-caja">
          <h3 id="aviso-inact-titulo">¿Sigues ahí?</h3>
          <p>
            Tu sesión se cerrará por inactividad en
            <strong>{{ inactividad.segundosRestantes() }}</strong> segundos.
          </p>
          <div class="aviso-acciones">
            <button type="button" class="btn btn-outline" (click)="inactividad.cerrarAhora()">Cerrar sesión</button>
            <button type="button" class="btn btn-primary" (click)="inactividad.continuar()">Seguir conectado</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .aviso-fondo {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, 0.6); padding: 16px;
    }
    .aviso-caja {
      background: var(--bg-surface, #fff); color: var(--text-primary, #0f172a);
      border-radius: 12px; padding: 24px; max-width: 380px; width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35); text-align: center;
    }
    .aviso-caja h3 { margin: 0 0 8px; font-size: 1.25rem; }
    .aviso-caja p { margin: 0 0 20px; }
    .aviso-caja strong { font-size: 1.4rem; color: var(--color-danger, #dc2626); }
    .aviso-acciones { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  `]
})
export class AvisoInactividadComponent {
  public readonly inactividad = inject(InactividadService);
}
