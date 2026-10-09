import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-licencia',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="licencia-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Licenciamiento del Sistema</h1>
          <p class="page-subtitle">Información del plan contratado y estado de la suscripción</p>
        </div>
      </div>

      <!-- ESTADO DE LA LICENCIA ACTUAL -->
      @if (adminService.licencia(); as lic) {
        <div class="licencia-hero card">
          <div class="hero-header">
            <div class="d-flex align-center gap-3">
              <div class="hero-badge-icon">
                <app-icon name="verified" [size]="28" />
              </div>
              <div>
                <span class="hero-kicker">Plan Activo</span>
                <h2 class="hero-title">{{ lic.planNombre }}</h2>
              </div>
            </div>

            <div class="hero-expiration">
              <span class="exp-label">Vencimiento:</span>
              <strong class="exp-date">{{ lic.fechaVencimiento || 'Indefinido' }}</strong>
              <span class="badge badge-listo">Licencia Activa</span>
            </div>
          </div>

          <div class="hero-body">
            <h4 class="modules-title">Módulos Habilitados en tu suscripción ({{ lic.paginas.length }}):</h4>
            <div class="modules-grid">
              @for (pag of lic.paginas; track pag) {
                <div class="module-item">
                  <app-icon name="check" [size]="16" class="text-success" />
                  <span>{{ formatearNombreModulo(pag) }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- COMPARATIVA DE PLANES -->
      <div class="card">
        <div class="card-header">
          <h3>Planes Disponibles de la Plataforma</h3>
        </div>
        <div class="card-body">
          <div class="planes-grid">
            @for (plan of adminService.planesLicencia(); track plan.id) {
              <div 
                class="plan-card" 
                [class.plan-active]="adminService.licencia()?.planId === plan.id"
              >
                <div class="plan-header">
                  <h4 class="plan-name">{{ plan.nombre }}</h4>
                  @if (adminService.licencia()?.planId === plan.id) {
                    <span class="badge badge-warning">Actual</span>
                  }
                </div>
                <div class="plan-modules">
                  @for (mod of plan.paginas; track mod) {
                    <div class="plan-module-row">
                      <app-icon name="check" [size]="14" />
                      <span>{{ formatearNombreModulo(mod) }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .licencia-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .licencia-hero {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #ffffff;
      border: 1px solid #334155;
    }
    .hero-header {
      padding: 1.5rem;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .hero-badge-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f59e0b;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero-kicker {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }
    .hero-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .hero-expiration {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
    }
    .exp-label {
      color: #94a3b8;
      font-size: 0.8125rem;
    }
    .exp-date {
      color: #ffffff;
      font-size: 0.9375rem;
    }
    .hero-body {
      padding: 1.5rem;
    }
    .modules-title {
      font-size: 0.875rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
    }
    .module-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
    }
    .text-success {
      color: #22c55e;
    }
    .planes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .plan-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: var(--bg-surface);
    }
    .plan-card.plan-active {
      border-color: #f59e0b;
      box-shadow: 0 0 0 1px #f59e0b;
    }
    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .plan-name {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0;
    }
    .plan-modules {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .plan-module-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-main);
    }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-3 { gap: 1rem; }
  `]
})
export class LicenciaComponent implements OnInit {
  public readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.cargarLicencia();
  }

  formatearNombreModulo(clave: string): string {
    const mapa: Record<string, string> = {
      dashboard: 'Dashboard General',
      pedidos: 'Punto de Venta / Pedidos',
      sabores: 'Catálogo de Sabores',
      presentaciones: 'Envases y Cucuruchos',
      toppings: 'Toppings y Agregados',
      productos: 'Bebidas y Cafetería',
      stock: 'Control de Stock',
      impresoras: 'Impresoras ESC/POS',
      usuarios: 'Gestión de Usuarios',
      roles: 'Roles y Permisos',
      licencia: 'Licenciamiento'
    };
    return mapa[clave.toLowerCase()] || clave;
  }
}
