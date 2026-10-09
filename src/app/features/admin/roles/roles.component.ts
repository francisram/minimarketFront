import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Rol } from '../../../core/models/admin.model';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../../shared/components/modal/modal.component';

export interface ModuloSistema {
  clave: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="roles-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Roles y Permisos</h1>
          <p class="page-subtitle">Gestiona los perfiles de seguridad y módulos autorizados para el personal</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cargarDatos()">
            <app-icon name="refresh" [size]="15" />
            <span>Refrescar</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="abrirModalCrear()">
            <app-icon name="plus" [size]="16" />
            <span>Nuevo Rol</span>
          </button>
        </div>
      </div>

      <div class="roles-grid">
        @for (rol of adminService.roles(); track rol.id) {
          <div class="card role-card">
            <div class="card-header space-between">
              <div class="d-flex align-center gap-2">
                <div class="role-icon-box" [ngClass]="getRoleClass(rol.nombre)">
                  <app-icon name="shield" [size]="20" />
                </div>
                <div>
                  <div class="d-flex align-center gap-2">
                    <h3 class="role-title">{{ rol.nombre }}</h3>
                    @if (esRolProtegido(rol.nombre)) {
                      <span class="badge badge-system" title="Rol protegido del sistema">Sistema</span>
                    }
                  </div>
                  <span class="role-id">ID: #{{ rol.id }}</span>
                </div>
              </div>

              <div class="role-actions">
                <button
                  type="button"
                  class="btn-icon"
                  (click)="abrirModalEditar(rol)"
                  title="Editar permisos del rol"
                >
                  <app-icon name="edit" [size]="16" />
                </button>
                @if (!esRolProtegido(rol.nombre)) {
                  <button
                    type="button"
                    class="btn-icon-danger"
                    (click)="confirmarEliminar(rol)"
                    title="Eliminar este rol"
                  >
                    <app-icon name="trash" [size]="16" />
                  </button>
                } @else {
                  <span class="btn-icon-disabled" title="No se puede eliminar un rol base del sistema">
                    <app-icon name="lock" [size]="16" />
                  </span>
                }
              </div>
            </div>

            <div class="card-body">
              <div class="d-flex space-between align-center mb-2">
                <h4 class="section-label">Módulos Autorizados</h4>
                <span class="badge" [ngClass]="rol.paginas.length > 0 ? 'badge-listo' : 'badge-cancelado'">
                  {{ rol.paginas.length }} permisos
                </span>
              </div>

              <div class="permissions-chips">
                @for (pag of rol.paginas; track pag) {
                  <span class="perm-chip">
                    <app-icon name="check" [size]="12" />
                    <span>{{ formatearNombreModulo(pag) }}</span>
                  </span>
                }
                @if (rol.paginas.length === 0) {
                  <span class="text-muted text-sm fst-italic">Sin permisos asignados</span>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- MODAL CREAR / EDITAR ROL -->
      <app-modal
        [isOpen]="modalRolAbierto()"
        [title]="rolEditando ? ('Editar Rol: ' + rolEditando.nombre) : 'Crear Nuevo Rol'"
        size="lg"
        (close)="cerrarModal()"
      >
        <div body class="modal-form-content">
          <div class="form-group mb-3">
            <label class="form-label" for="nombreRol">Nombre del Rol *</label>
            <input
              id="nombreRol"
              type="text"
              class="form-control"
              [(ngModel)]="nombreRol"
              placeholder="Ej. SUPERVISOR, ENCARGADO, REPARTIDOR"
              [disabled]="rolEditando !== null && esRolProtegido(rolEditando.nombre)"
            />
            @if (rolEditando && esRolProtegido(rolEditando.nombre)) {
              <small class="text-muted">El identificador de este rol es reservado del sistema y no puede renombrarse, pero puedes ajustar sus módulos autorizados.</small>
            }
          </div>

          <div class="modules-section">
            <div class="d-flex space-between align-center mb-2">
              <div>
                <label class="form-label mb-0">Permisos y Módulos Permitidos *</label>
                <small class="text-muted d-block">Selecciona qué secciones de la heladería podrá ver y operar este perfil:</small>
              </div>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-subtle" (click)="seleccionarTodos()">
                  <app-icon name="check" [size]="13" />
                  <span>Marcar Todos</span>
                </button>
                <button type="button" class="btn btn-sm btn-subtle" (click)="deseleccionarTodos()">
                  <app-icon name="x" [size]="13" />
                  <span>Limpiar</span>
                </button>
              </div>
            </div>

            <div class="modules-grid">
              @for (mod of modulosDisponibles; track mod.clave) {
                <div
                  class="module-selector-card"
                  [class.selected]="estaSeleccionado(mod.clave)"
                  [class.disabled]="!estaHabilitadoEnLicencia(mod.clave)"
                  (click)="toggleModulo(mod.clave)"
                >
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      [checked]="estaSeleccionado(mod.clave)"
                      [disabled]="!estaHabilitadoEnLicencia(mod.clave)"
                      (change)="toggleModulo(mod.clave)"
                      (click)="$event.stopPropagation()"
                    />
                  </div>
                  <div class="module-icon-wrap">
                    <app-icon [name]="mod.icono" [size]="18" />
                  </div>
                  <div class="module-info">
                    <div class="d-flex align-center gap-2">
                      <strong class="module-title">{{ mod.nombre }}</strong>
                      @if (!estaHabilitadoEnLicencia(mod.clave)) {
                        <span class="badge-pending" title="Pendiente de incorporación en la tabla de licencias del backend">Backend pend.</span>
                      }
                    </div>
                    <span class="module-desc">{{ mod.descripcion }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModal()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="guardarRol()"
            [disabled]="guardando() || !nombreRol.trim() || paginasSeleccionadas.size === 0"
          >
            <span>{{ guardando() ? 'Guardando...' : (rolEditando ? 'Actualizar Rol' : 'Crear Rol') }}</span>
          </button>
        </div>
      </app-modal>
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
      flex-wrap: wrap;
      gap: 1rem;
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
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .role-card {
      display: flex;
      flex-direction: column;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .role-card:hover {
      box-shadow: var(--shadow-md);
    }
    .role-icon-box {
      width: 42px;
      height: 42px;
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
    .role-custom {
      background: #e0e7ff;
      color: #4338ca;
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
    .badge-system {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .role-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-icon {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .btn-icon:hover {
      background: var(--bg-subtle);
      color: var(--primary);
      border-color: var(--primary);
    }
    .btn-icon-danger {
      background: none;
      border: 1px solid transparent;
      color: var(--color-danger);
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .btn-icon-danger:hover {
      background: #fee2e2;
    }
    .btn-icon-disabled {
      color: var(--text-light);
      padding: 0.4rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: not-allowed;
    }
    .section-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0;
    }
    .permissions-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
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
    .perm-chip app-icon {
      color: var(--color-success);
    }
    .btn-subtle {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-subtle:hover {
      background: var(--bg-hover);
    }

    /* Estilos del modal y selección de módulos */
    .modal-form-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modules-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.75rem;
      max-height: 52vh;
      overflow-y: auto;
      padding: 2px;
    }
    .module-selector-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-surface);
      cursor: pointer;
      user-select: none;
      transition: all 0.15s;
    }
    .module-selector-card:hover {
      border-color: var(--primary);
      background: var(--bg-subtle);
    }
    .module-selector-card.selected {
      border-color: var(--primary);
      background: #fffbeb;
    }
    .module-selector-card.disabled {
      opacity: 0.65;
      background: var(--bg-subtle);
      cursor: not-allowed;
    }
    .badge-pending {
      font-size: 0.65rem;
      background: #f1f5f9;
      color: #64748b;
      border: 1px dashed #cbd5e1;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-weight: 500;
      white-space: nowrap;
    }
    .checkbox-container {
      margin-top: 2px;
    }
    .checkbox-container input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--primary);
    }
    .module-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .module-selector-card.selected .module-icon-wrap {
      background: #fef3c7;
      color: #b45309;
    }
    .module-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .module-title {
      font-size: 0.85rem;
      color: var(--text-main);
    }
    .module-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.3;
    }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .space-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .fst-italic { font-style: italic; }
  `]
})
export class RolesComponent implements OnInit {
  public readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  public readonly modalRolAbierto = signal<boolean>(false);
  public readonly guardando = signal<boolean>(false);

  public rolEditando: Rol | null = null;
  public nombreRol: string = '';
  public paginasSeleccionadas = new Set<string>();

  public readonly modulosDisponibles: ModuloSistema[] = [
    { clave: 'dashboard', nombre: 'Dashboard General', descripcion: 'Métricas, resumen diario y accesos rápidos', icono: 'layout-dashboard' },
    { clave: 'pedidos', nombre: 'Punto de Venta / POS', descripcion: 'Venta de helados, productos y comandas', icono: 'shopping-cart' },
    { clave: 'caja', nombre: 'Control de Caja', descripcion: 'Turnos, apertura, arqueo de ventas y cierres de caja', icono: 'banknote' },
    { clave: 'sabores', nombre: 'Catálogo de Sabores', descripcion: 'Gestión y disponibilidad de sabores en bacha', icono: 'sparkles' },
    { clave: 'presentaciones', nombre: 'Envases y Cucuruchos', descripcion: 'Potes térmicos, vasitos y conos', icono: 'package' },
    { clave: 'toppings', nombre: 'Toppings y Agregados', descripcion: 'Salsas, confites y adicionales', icono: 'cup-soda' },
    { clave: 'productos', nombre: 'Productos Simples', descripcion: 'Bebidas, cafetería y snacks empaquetados', icono: 'coffee' },
    { clave: 'stock', nombre: 'Control de Stock', descripcion: 'Inventario general y alertas de reposición', icono: 'warehouse' },
    { clave: 'impresoras', nombre: 'Impresoras ESC/POS', descripcion: 'Configuración de impresoras térmicas de tickets', icono: 'printer' },
    { clave: 'usuarios', nombre: 'Gestión de Usuarios', descripcion: 'Cuentas de usuario y accesos al sistema', icono: 'user' },
    { clave: 'roles', nombre: 'Roles y Permisos', descripcion: 'Definición de perfiles y páginas autorizadas', icono: 'shield' },
    { clave: 'licencia', nombre: 'Licenciamiento', descripcion: 'Estado de suscripción y vigencia del software', icono: 'verified' }
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.adminService.cargarRoles();
    this.adminService.cargarPaginasDisponibles();
  }

  esRolProtegido(nombre: string): boolean {
    const n = (nombre || '').toUpperCase();
    return n === 'ADMIN' || n === 'OWNER';
  }

  getRoleClass(nombre: string): string {
    const n = (nombre || '').toUpperCase();
    if (n === 'ADMIN' || n === 'OWNER') return 'role-admin';
    if (n === 'CAJERO') return 'role-cajero';
    return 'role-custom';
  }

  formatearNombreModulo(clave: string): string {
    const mod = this.modulosDisponibles.find(m => m.clave.toLowerCase() === clave.toLowerCase());
    if (mod) return mod.nombre;

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

  abrirModalCrear(): void {
    this.rolEditando = null;
    this.nombreRol = '';
    this.paginasSeleccionadas = new Set<string>(['pedidos', 'dashboard']);
    this.modalRolAbierto.set(true);
  }

  abrirModalEditar(rol: Rol): void {
    this.rolEditando = rol;
    this.nombreRol = rol.nombre;
    this.paginasSeleccionadas = new Set<string>(rol.paginas || []);
    this.modalRolAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalRolAbierto.set(false);
    this.rolEditando = null;
    this.nombreRol = '';
    this.paginasSeleccionadas.clear();
  }

  estaSeleccionado(clave: string): boolean {
    return this.paginasSeleccionadas.has(clave.toLowerCase());
  }

  estaHabilitadoEnLicencia(clave: string): boolean {
    const pags = this.adminService.paginasDisponibles();
    if (!pags || pags.length === 0) return true;
    return pags.some(p => p.clave.toLowerCase() === clave.toLowerCase());
  }

  toggleModulo(clave: string): void {
    if (!this.estaHabilitadoEnLicencia(clave)) {
      this.toast.info(`El módulo "${this.formatearNombreModulo(clave)}" requiere ser incorporado en el plan de licencia del backend.`);
      return;
    }
    const k = clave.toLowerCase();
    if (this.paginasSeleccionadas.has(k)) {
      this.paginasSeleccionadas.delete(k);
    } else {
      this.paginasSeleccionadas.add(k);
    }
  }

  seleccionarTodos(): void {
    this.modulosDisponibles
      .filter(m => this.estaHabilitadoEnLicencia(m.clave))
      .forEach(m => this.paginasSeleccionadas.add(m.clave.toLowerCase()));
  }

  deseleccionarTodos(): void {
    this.paginasSeleccionadas.clear();
  }

  guardarRol(): void {
    const nombreLimpio = this.nombreRol.trim().toUpperCase();
    if (!nombreLimpio) {
      this.toast.warning('Ingresa el nombre del rol.');
      return;
    }

    if (this.paginasSeleccionadas.size === 0) {
      this.toast.warning('Debes autorizar al menos un módulo o página para este rol.');
      return;
    }

    const paginasArray = Array.from(this.paginasSeleccionadas);
    this.guardando.set(true);

    if (this.rolEditando) {
      this.adminService.actualizarRol(this.rolEditando.id, {
        nombre: nombreLimpio,
        paginas: paginasArray
      }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.mensaje || err.error?.error || 'No se pudo actualizar el rol.';
          this.toast.error(msg);
        }
      });
    } else {
      this.adminService.crearRol({
        nombre: nombreLimpio,
        paginas: paginasArray
      }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.mensaje || err.error?.error || 'No se pudo crear el rol.';
          this.toast.error(msg);
        }
      });
    }
  }

  confirmarEliminar(rol: Rol): void {
    if (this.esRolProtegido(rol.nombre)) {
      this.toast.warning(`El rol "${rol.nombre}" es un rol base del sistema y no puede eliminarse.`);
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar el rol "${rol.nombre}"? Los usuarios asociados perderán este perfil.`)) {
      this.adminService.eliminarRol(rol.id).subscribe({
        error: (err) => {
          const msg = err.error?.mensaje || err.error?.error || 'No se pudo eliminar el rol.';
          this.toast.error(msg);
        }
      });
    }
  }
}
