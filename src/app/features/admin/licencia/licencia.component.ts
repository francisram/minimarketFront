import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MenuService } from '../../../core/services/menu.service';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-licencia',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="licencia-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Licenciamiento del Sistema</h1>
          <p class="page-subtitle">Información del plan contratado y estado de la suscripción</p>
        </div>
        @if (authService.isOwner()) {
          <button type="button" class="btn btn-primary" (click)="abrirModalEdicion()">
            <app-icon name="shield" [size]="16" />
            <span>Gestionar Licencia</span>
          </button>
        }
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
              <strong class="exp-date">{{ lic.fechaVencimiento || 'Indefinido / Perpetuo' }}</strong>
              <span class="badge" [ngClass]="infoVencimiento().badgeClass">
                {{ infoVencimiento().label }}
              </span>
              @if (authService.isOwner()) {
                <button type="button" class="btn btn-sm btn-warning ml-2" (click)="abrirModalEdicion()" title="Modificar fecha de vencimiento">
                  <app-icon name="edit" [size]="14" />
                  <span>Modificar</span>
                </button>
              }
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

      <!-- PANEL EXCLUSIVO DEL PROPIETARIO / OWNER -->
      @if (authService.isOwner()) {
        <div class="card owner-action-card">
          <div class="d-flex align-center justify-between flex-wrap gap-3">
            <div class="d-flex align-center gap-3">
              <div class="owner-icon-box">
                <app-icon name="shield" [size]="24" />
              </div>
              <div>
                <h3 class="m-0 font-bold">Panel de Propietario (Owner)</h3>
                <p class="m-0 text-muted text-sm">Tienes permisos exclusivos para renovar la vigencia o migrar el plan contratado.</p>
              </div>
            </div>
            <button type="button" class="btn btn-primary" (click)="abrirModalEdicion()">
              <app-icon name="edit" [size]="16" />
              <span>Modificar Vigencia o Plan</span>
            </button>
          </div>
        </div>
      }

      <!-- CRÉDITOS Y AUTORÍA DEL SISTEMA -->
      <div class="card autor-card">
        <div class="autor-wrapper">
          <div class="autor-left">
            <div class="autor-avatar-box">
              <app-icon name="award" [size]="28" />
            </div>
            <div class="autor-details">
              <span class="autor-kicker">Autor y Desarrollador del Sistema</span>
              <h3 class="autor-title">Ing. Francis Lopez</h3>
              <p class="autor-desc">Arquitectura de Software & Desarrollo Fullstack • Todos los derechos reservados</p>
            </div>
          </div>
          <div class="autor-badges">
            <span class="badge badge-autor">
              <app-icon name="verified" [size]="14" />
              <span>Autor Oficial</span>
            </span>
          </div>
        </div>
      </div>

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
      <!-- ==================== MODAL DE GESTIÓN DE LICENCIA (EXCLUSIVO OWNER) ==================== -->
      <app-modal
        [isOpen]="modalEdicionAbierto()"
        title="Gestión de Licencia y Vigencia (Exclusivo OWNER)"
        size="md"
        (close)="cerrarModalEdicion()"
      >
        <div body class="modal-licencia-body">
          <div class="info-alert mb-3">
            <app-icon name="shield" [size]="20" />
            <span>Como <strong>Propietario del Sistema</strong>, puedes asignar un nuevo plan y definir la fecha de expiración o establecer vigencia perpetua.</span>
          </div>

          <!-- SELECTOR DE PLAN -->
          <div class="form-group mb-3">
            <label class="form-label" for="planSelector">Plan de Licencia Contratado *</label>
            <select
              id="planSelector"
              class="form-control"
              [(ngModel)]="formLicencia.planId"
            >
              @for (plan of adminService.planesLicencia(); track plan.id) {
                <option [value]="plan.id">{{ plan.nombre }} ({{ plan.paginas.length }} módulos)</option>
              }
            </select>
          </div>

          <!-- FECHA DE VENCIMIENTO -->
          <div class="form-group mb-3">
            <label class="form-label" for="fechaVencimiento">Fecha de Vencimiento de Suscripción</label>
            <input
              id="fechaVencimiento"
              type="date"
              class="form-control"
              [(ngModel)]="formLicencia.fechaVencimiento"
            />
            <span class="form-hint">Deja el campo vacío o presiona 'Indefinido' para vigencia perpetua sin caducidad.</span>
          </div>

          <!-- ATAJOS RÁPIDOS DE EXTENSIÓN -->
          <div class="quick-renewals mb-2">
            <span class="quick-label">Atajos rápidos de extensión:</span>
            <div class="quick-buttons">
              <button type="button" class="btn-chip" (click)="sumarMeses(6)">+ 6 Meses</button>
              <button type="button" class="btn-chip" (click)="sumarMeses(12)">+ 1 Año</button>
              <button type="button" class="btn-chip" (click)="sumarMeses(24)">+ 2 Años</button>
              <button type="button" class="btn-chip btn-chip-indefinido" (click)="setIndefinido()">Indefinido / Perpetuo</button>
            </div>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalEdicion()" [disabled]="guardando()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="guardarLicencia()"
            [disabled]="guardando() || !formLicencia.planId"
          >
            @if (guardando()) {
              <span>Guardando...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>Guardar y Aplicar</span>
            }
          </button>
        </div>
      </app-modal>
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
      flex-wrap: wrap;
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
    .owner-action-card {
      border: 1px solid #fde68a;
      background: linear-gradient(135deg, #fefce8, #fffbeb);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
    }
    .owner-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #f59e0b;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .modal-licencia-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .info-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }
    .quick-renewals {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .quick-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .quick-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .btn-chip {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.35rem 0.85rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-main);
      transition: all 0.15s ease;
    }
    .btn-chip:hover {
      background: var(--bg-subtle, #f1f5f9);
      border-color: #94a3b8;
    }
    .btn-chip-indefinido {
      border-style: dashed;
      color: #0284c7;
      border-color: #38bdf8;
    }
    .btn-chip-indefinido:hover {
      background: #f0f9ff;
    }
    .autor-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      padding: 1.25rem 1.5rem;
    }
    .autor-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .autor-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .autor-avatar-box {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }
    .autor-details {
      display: flex;
      flex-direction: column;
    }
    .autor-kicker {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }
    .autor-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0.15rem 0;
    }
    .autor-desc {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0;
    }
    .autor-badges {
      display: flex;
      align-items: center;
    }
    .badge-autor {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(34, 197, 94, 0.15);
      color: #16a34a;
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
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
    .justify-between { justify-content: space-between; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-3 { gap: 1rem; }
    .text-sm { font-size: 0.85rem; }
    .m-0 { margin: 0; }
    .font-bold { font-weight: 700; }
    .ml-2 { margin-left: 0.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .form-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `]
})
export class LicenciaComponent implements OnInit {
  public readonly adminService = inject(AdminService);
  public readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly menuService = inject(MenuService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly modalEdicionAbierto = signal<boolean>(false);
  public readonly guardando = signal<boolean>(false);

  public formLicencia = {
    planId: 3,
    fechaVencimiento: ''
  };

  public readonly infoVencimiento = computed(() => {
    const lic = this.adminService.licencia();
    if (!lic || !lic.fechaVencimiento) {
      return {
        estado: 'PERPETUO',
        label: 'Licencia Indefinida / Perpetua',
        badgeClass: 'badge-listo',
        dias: null
      };
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const partes = lic.fechaVencimiento.split('-');
    const fechaVenc = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    fechaVenc.setHours(0, 0, 0, 0);

    const difMs = fechaVenc.getTime() - hoy.getTime();
    const dias = Math.ceil(difMs / (1000 * 60 * 60 * 24));

    if (dias < 0) {
      return {
        estado: 'VENCIDA',
        label: `Licencia Vencida (hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'})`,
        badgeClass: 'badge-cancelado',
        dias
      };
    } else if (dias <= 30) {
      return {
        estado: 'POR_VENCER',
        label: `Por Vencer (${dias} ${dias === 1 ? 'día restante' : 'días restantes'})`,
        badgeClass: 'badge-warning',
        dias
      };
    } else {
      return {
        estado: 'ACTIVA',
        label: `Licencia Activa (${dias} días restantes)`,
        badgeClass: 'badge-listo',
        dias
      };
    }
  });

  ngOnInit(): void {
    this.adminService.cargarLicencia();
  }

  abrirModalEdicion(): void {
    const lic = this.adminService.licencia();
    this.formLicencia = {
      planId: lic?.planId || 3,
      fechaVencimiento: lic?.fechaVencimiento || ''
    };
    this.modalEdicionAbierto.set(true);
  }

  cerrarModalEdicion(): void {
    this.modalEdicionAbierto.set(false);
  }

  sumarMeses(meses: number): void {
    const base = new Date();
    base.setMonth(base.getMonth() + meses);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    this.formLicencia.fechaVencimiento = `${y}-${m}-${d}`;
  }

  setIndefinido(): void {
    this.formLicencia.fechaVencimiento = '';
  }

  guardarLicencia(): void {
    if (!this.formLicencia.planId) {
      this.toast.warning('Selecciona un plan de licencia.');
      return;
    }

    this.guardando.set(true);
    this.adminService.actualizarLicencia({
      planId: Number(this.formLicencia.planId),
      fechaVencimiento: this.formLicencia.fechaVencimiento ? this.formLicencia.fechaVencimiento : null
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (lic) => {
        this.guardando.set(false);
        this.toast.success(`Licencia actualizada al plan "${lic.planNombre}". Vigencia: ${lic.fechaVencimiento || 'Indefinido'}.`);
        this.cerrarModalEdicion();
        this.menuService.cargarPaginasDisponibles();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.mensaje || err.error?.error || 'No se pudo actualizar la licencia.';
        this.toast.error(msg, 'Error al actualizar');
      }
    });
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
      licencia: 'Licenciamiento',
      caja: 'Control de Caja y Turnos',
      clientes: 'Directorio de Clientes',
      proveedores: 'Proveedores',
      compras: 'Compras y Facturas Proveedor',
      reportes: 'Reportes y Libro IVA',
      institucion: 'Datos del Negocio y DNIT',
      backup: 'Respaldos y Restauración',
      auditoria: 'Auditoría y Arqueo Ciego',
      bitacora: 'Bitácora de Eventos'
    };
    return mapa[clave.toLowerCase()] || clave;
  }
}
