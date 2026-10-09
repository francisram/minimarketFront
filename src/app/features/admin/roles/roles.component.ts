import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="roles-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Roles y Permisos</h1>
          <p class="page-subtitle">Perfiles de seguridad y páginas autorizadas en el sistema</p>
        </div>
      </div>

      <div class="roles-grid">
        @for (rol of adminService.roles(); track rol.id) {
          <div class="card role-card">
            <div class="card-header space-between">
              <div class="d-flex align-center gap-2">
                <div class="role-icon-box" [ngClass]="'role-' + rol.nombre.toLowerCase()">
                  <app-icon name="shield" [size]="20" />
                </div>
                <div>
                  <h3 class="role-title">{{ rol.nombre }}</h3>
                  <span class="role-id">ID: #{{ rol.id }}</span>
                </div>
              </div>
              <span class="badge" [ngClass]="rol.nombre === 'CAJERO' ? 'badge-listo' : 'badge-warning'">
                {{ rol.paginas.length }} permisos
              </span>
            </div>

            <div class="card-body">
              <h4 class="section-label">Módulos Autorizados:</h4>
              <div class="permissions-chips">
                @for (pag of rol.paginas; track pag) {
                  <span class="perm-chip">
                    <app-icon name="check" [size]="12" />
                    <span>{{ formatearNombreModulo(pag) }}</span>
                  </span>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .roles-page {
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
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .role-card {
      display: flex;
      flex-direction: column;
    }
    .role-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .role-admin, .role-owner {
      background: #fef3c7;
      color: #b45309;
    }
    .role-cajero {
      background: #dcfce7;
      color: #15803d;
    }
    .role-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }
    .role-id {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .section-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .permissions-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .perm-chip {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.3rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-main);
    }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-2 { gap: 0.5rem; }
  `]
})
export class RolesComponent implements OnInit {
  public readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.cargarRoles();
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
