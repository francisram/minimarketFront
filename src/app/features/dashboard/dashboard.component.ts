import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { PosService } from '../../core/services/pos.service';
import { ImpresorasService } from '../../core/services/impresoras.service';
import { StockService } from '../../core/services/stock.service';
import { CajaService } from '../../core/services/caja.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent],
  template: `
    <div class="dashboard-page">
      <div class="welcome-banner">
        <div class="banner-text">
          <h1>¡Hola, {{ authService.username() }}!</h1>
          <p>Bienvenido al sistema de gestión de Heladería Artesanal. Panel general de operaciones.</p>
        </div>
        @if (authService.hasPermission('pedidos')) {
          <div class="banner-actions">
            <a routerLink="/pos" class="btn btn-primary btn-lg">
              <app-icon name="shopping-cart" [size]="20" />
              <span>Nueva Venta (POS)</span>
            </a>
          </div>
        }
      </div>

      <!-- TARJETAS KPI -->
      <div class="kpi-grid">
        @if (authService.hasPermission('pedidos')) {
          <div class="kpi-card">
            <div class="kpi-icon kpi-orders">
              <app-icon name="clipboard-list" [size]="24" />
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Pedidos del Día</span>
              <span class="kpi-val">{{ pedidosService.pedidos().length }}</span>
            </div>
          </div>
        }

        @if (authService.hasPermission('sabores')) {
          <div class="kpi-card">
            <div class="kpi-icon kpi-flavors">
              <app-icon name="ice-cream" [size]="24" />
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Sabores Disponibles</span>
              <span class="kpi-val">{{ posService.saboresDisponibles().length }} / {{ posService.sabores().length }}</span>
            </div>
          </div>
        }

        @if (authService.hasPermission('presentaciones')) {
          <div class="kpi-card">
            <div class="kpi-icon kpi-containers">
              <app-icon name="cup-soda" [size]="24" />
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Envases / Presentaciones</span>
              <span class="kpi-val">{{ posService.presentacionesActivas().length }}</span>
            </div>
          </div>
        }

        @if (authService.hasPermission('stock')) {
          <div class="kpi-card" [class.kpi-alert]="stockService.totalAlertas() > 0">
            <div class="kpi-icon kpi-stock">
              <app-icon name="warehouse" [size]="24" />
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Alertas de Stock</span>
              <span class="kpi-val">{{ stockService.totalAlertas() }}</span>
            </div>
          </div>
        }

        @if (authService.hasPermission('impresoras')) {
          <div class="kpi-card">
            <div class="kpi-icon kpi-printers">
              <app-icon name="printer" [size]="24" />
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Impresoras Térmicas</span>
              <span class="kpi-val">{{ impresorasService.impresoras().length }}</span>
            </div>
          </div>
        }
      </div>

      <!-- ACCESOS RÁPIDOS Y ESTADO -->
      <div class="dashboard-sections-grid">
        <div class="card">
          <div class="card-header">
            <h3>Accesos Rápidos</h3>
          </div>
          <div class="card-body quick-links-grid">
            @if (authService.hasPermission('pedidos')) {
              <a routerLink="/pos" class="quick-link-box">
                <app-icon name="shopping-cart" [size]="28" />
                <strong>Punto de Venta</strong>
                <span>Armado táctil de helados y ticket en vivo</span>
              </a>
            }

            @if (authService.hasPermission('caja')) {
              <a routerLink="/caja" class="quick-link-box">
                <app-icon name="banknote" [size]="28" />
                <strong>Control de Caja</strong>
                <span>Turnos, apertura, arqueo de ventas y cierres</span>
              </a>
            }

            @if (authService.hasPermission('pedidos')) {
              <a routerLink="/pedidos" class="quick-link-box">
                <app-icon name="clipboard-list" [size]="28" />
                <strong>Monitor de Cocina</strong>
                <span>Kanban de órdenes pendientes y en preparación</span>
              </a>
            }

            @if (authService.hasPermission('clientes')) {
              <a routerLink="/clientes" class="quick-link-box">
                <app-icon name="users" [size]="28" />
                <strong>Clientes</strong>
                <span>Directorio, RUC / Cédula y datos de contacto</span>
              </a>
            }

            @if (authService.hasPermission('reportes')) {
              <a routerLink="/reportes" class="quick-link-box">
                <app-icon name="bar-chart-3" [size]="28" />
                <strong>Reportes y Analítica</strong>
                <span>Ventas, libro IVA, turnos y talonarios</span>
              </a>
            }

            @if (authService.hasPermission('stock')) {
              <a routerLink="/stock" class="quick-link-box">
                <app-icon name="warehouse" [size]="28" />
                <strong>Control de Stock</strong>
                <span>Bachas por kg, envases y cucuruchos</span>
              </a>
            }

            @if (authService.hasPermission('impresoras')) {
              <a routerLink="/impresoras" class="quick-link-box">
                <app-icon name="printer" [size]="28" />
                <strong>Impresoras Térmicas</strong>
                <span>Configuración TCP Raw, CUPS y pruebas</span>
              </a>
            }

            @if (authService.hasPermission('institucion')) {
              <a routerLink="/institucion" class="quick-link-box">
                <app-icon name="building" [size]="28" />
                <strong>Datos de Marca</strong>
                <span>Nombre y logotipo para tickets</span>
              </a>
            }

            @if (authService.hasPermission('usuarios')) {
              <a routerLink="/usuarios" class="quick-link-box">
                <app-icon name="user" [size]="28" />
                <strong>Usuarios y Personal</strong>
                <span>Cuentas de cajeros y administradores</span>
              </a>
            }

            @if (authService.hasPermission('roles')) {
              <a routerLink="/roles" class="quick-link-box">
                <app-icon name="shield" [size]="28" />
                <strong>Roles y Permisos</strong>
                <span>Perfiles de seguridad y páginas</span>
              </a>
            }

            @if (authService.hasPermission('licencia')) {
              <a routerLink="/licencia" class="quick-link-box">
                <app-icon name="verified" [size]="28" />
                <strong>Licenciamiento</strong>
                <span>Plan activo y módulos habilitados</span>
              </a>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Estado del Turno</h3>
          </div>
          <div class="card-body">
            <div class="status-list">
              <div class="status-item">
                <span class="status-name">Usuario Conectado:</span>
                <strong>{{ authService.username() }} ({{ authService.role() }})</strong>
              </div>

              @if (authService.hasPermission('caja')) {
                <div class="status-item">
                  <span class="status-name">Estado de Caja:</span>
                  @if (cajaService.cajaAbierta()) {
                    <span class="badge badge-listo">Abierta (Sesión #{{ cajaService.estadoCaja()?.sesionId }})</span>
                  } @else {
                    <span class="badge badge-cancelado">Cerrada</span>
                  }
                </div>
              }

              @if (authService.hasPermission('pedidos')) {
                <div class="status-item">
                  <span class="status-name">Punto de Venta:</span>
                  <span class="badge badge-listo">Operativo</span>
                </div>
              }

              @if (authService.hasPermission('impresoras')) {
                <div class="status-item">
                  <span class="status-name">Ticketeras conectadas:</span>
                  <span>{{ impresorasService.impresoras().length }} registradas</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .welcome-banner {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #ffffff;
      border-radius: var(--radius-lg);
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .banner-text h1 {
      color: #ffffff;
      font-size: 1.75rem;
      margin-bottom: 0.35rem;
    }

    .banner-text p {
      color: #94a3b8;
      font-size: 0.9375rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-orders { background: #fef3c7; color: #b45309; }
    .kpi-flavors { background: #dcfce7; color: #15803d; }
    .kpi-containers { background: #e0e7ff; color: #4338ca; }
    .kpi-printers { background: #fae8ff; color: #a21caf; }
    .kpi-stock { background: #fee2e2; color: #dc2626; }

    .kpi-card.kpi-alert {
      border-color: #fca5a5;
      background: #fff5f5;
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .dashboard-sections-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }

    .quick-links-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .quick-link-box {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      color: var(--text-main);
      transition: all 0.15s;
    }

    .quick-link-box:hover {
      border-color: var(--primary);
      background: #fffbeb;
      text-decoration: none;
    }

    .quick-link-box span {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .status-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .status-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .status-name {
      color: var(--text-muted);
    }

    @media (max-width: 900px) {
      .dashboard-sections-grid {
        grid-template-columns: 1fr;
      }
      .quick-links-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  public readonly authService = inject(AuthService);
  public readonly pedidosService = inject(PedidosService);
  public readonly posService = inject(PosService);
  public readonly impresorasService = inject(ImpresorasService);
  public readonly stockService = inject(StockService);
  public readonly cajaService = inject(CajaService);

  ngOnInit(): void {
    if (this.authService.hasPermission('pedidos')) {
      this.pedidosService.cargarPedidos();
    }
    this.posService.cargarCatalogos();
    if (this.authService.hasPermission('impresoras')) {
      this.impresorasService.cargarImpresoras();
    }
    if (this.authService.hasPermission('stock')) {
      this.stockService.cargarAlertas();
    }
    if (this.authService.hasPermission('caja')) {
      this.cajaService.cargarEstado().subscribe();
    }
  }
}
