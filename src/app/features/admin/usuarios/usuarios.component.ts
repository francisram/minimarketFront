import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Usuario, Rol } from '../../../core/models/admin.model';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="usuarios-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Usuarios</h1>
          <p class="page-subtitle">Administra las credenciales, estados y asignación de roles del personal</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cargarDatos()">
            <app-icon name="refresh" [size]="15" />
            <span>Refrescar</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="abrirModalCrear()">
            <app-icon name="plus" [size]="16" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTRO -->
      <div class="filter-card card">
        <div class="search-box">
          <app-icon name="search" [size]="16" extraClass="search-icon" />
          <input
            type="text"
            class="search-input"
            [(ngModel)]="busqueda"
            placeholder="Buscar usuario por nombre o rol..."
          />
          @if (busqueda) {
            <button type="button" class="btn-clear" (click)="busqueda = ''" title="Limpiar búsqueda">
              <app-icon name="x" [size]="14" />
            </button>
          }
        </div>
        <div class="filter-stats">
          <span class="text-muted text-sm">
            Mostrando <strong>{{ usuariosFiltrados().length }}</strong> de <strong>{{ adminService.usuarios().length }}</strong> usuarios
          </span>
        </div>
      </div>

      <!-- TABLA DE USUARIOS -->
      <div class="card">
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol Asignado</th>
                <th>Estado</th>
                <th>Seguridad</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of usuariosFiltrados(); track u.id) {
                <tr>
                  <td><strong>#{{ u.id }}</strong></td>
                  <td>
                    <div class="d-flex align-center gap-2">
                      <div class="user-avatar-sm" [class.avatar-admin]="u.username === 'admin'">
                        <app-icon name="user" [size]="14" />
                      </div>
                      <div>
                        <strong class="user-name">{{ u.username }}</strong>
                        @if (u.username === 'admin') {
                          <span class="system-tag">Superadmin</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getBadgeRol(u.rolNombre)">
                      {{ u.rolNombre || 'SIN ROL' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="u.estado ? 'badge-listo' : 'badge-cancelado'">
                      {{ u.estado ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <span class="text-muted text-sm d-flex align-center gap-1">
                      <app-icon [name]="u.passwordNuncaExpira ? 'lock' : 'clock'" [size]="13" />
                      <span>{{ u.passwordNuncaExpira ? 'Contraseña fija' : 'Expira periódicamente' }}</span>
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="actions-cell">
                      <button
                        type="button"
                        class="btn-icon"
                        (click)="abrirModalEditar(u)"
                        title="Modificar usuario"
                      >
                        <app-icon name="edit" [size]="15" />
                      </button>

                      @if (u.username !== 'admin') {
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminar(u)"
                          title="Eliminar usuario"
                        >
                          <app-icon name="trash" [size]="15" />
                        </button>
                      } @else {
                        <span class="btn-icon-disabled" title="El usuario principal no puede eliminarse">
                          <app-icon name="lock" [size]="15" />
                        </span>
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (usuariosFiltrados().length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-4 text-muted">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR USUARIO -->
      <app-modal
        [isOpen]="modalAbierto()"
        [title]="usuarioEditando ? ('Modificar Usuario: ' + usuarioEditando.username) : 'Crear Nuevo Usuario'"
        size="md"
        (close)="cerrarModal()"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="usernameInput">Nombre de Usuario *</label>
            <input
              id="usernameInput"
              type="text"
              class="form-control"
              [(ngModel)]="usuarioForm.username"
              placeholder="Ej. cajero1, supervisor"
              [disabled]="usuarioEditando?.username === 'admin'"
            />
            @if (usuarioEditando?.username === 'admin') {
              <small class="text-muted">El nombre de usuario 'admin' es reservado del sistema.</small>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="passwordInput">
              {{ usuarioEditando ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial *' }}
            </label>
            <input
              id="passwordInput"
              type="password"
              class="form-control"
              [(ngModel)]="usuarioForm.password"
              [placeholder]="usuarioEditando ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'"
            />
            @if (usuarioEditando) {
              <small class="text-muted">Si no deseas cambiar la clave del usuario, deja este campo vacío.</small>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="rolSelect">Rol Asignado *</label>
            <select id="rolSelect" class="form-control" [(ngModel)]="usuarioForm.rolId">
              @for (rol of adminService.roles(); track rol.id) {
                <option [value]="rol.id">{{ rol.nombre }}</option>
              }
            </select>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="usuarioForm.estado"
                [disabled]="usuarioEditando?.username === 'admin'"
              />
              <span><strong>Usuario Activo</strong> (Habilita el inicio de sesión)</span>
            </label>

            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="usuarioForm.passwordNuncaExpira"
              />
              <span><strong>Contraseña Permanente</strong> (No solicitar cambio periódico)</span>
            </label>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModal()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="guardarUsuario()"
            [disabled]="guardando() || !usuarioForm.username.trim() || (!usuarioEditando && !usuarioForm.password)"
          >
            <span>{{ guardando() ? 'Guardando...' : (usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario') }}</span>
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .usuarios-page {
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

    /* Barra de búsqueda */
    .filter-card {
      padding: 0.875rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      max-width: 420px;
    }
    .search-box :host ::ng-deep .search-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--text-light);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 2.25rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.875rem;
      background: var(--bg-surface);
      color: var(--text-main);
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus {
      border-color: var(--primary);
    }
    .btn-clear {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    /* Tabla y elementos */
    .user-avatar-sm {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .avatar-admin {
      background: #fef3c7;
      color: #b45309;
    }
    .user-name {
      display: block;
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .system-tag {
      font-size: 0.65rem;
      background: #f1f5f9;
      color: #475569;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      border: 1px solid #cbd5e1;
      display: inline-block;
    }
    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.4rem;
    }
    .btn-icon {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 4px;
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
      padding: 0.35rem;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .btn-icon-danger:hover {
      background: #fee2e2;
    }
    .btn-icon-disabled {
      color: var(--text-light);
      padding: 0.35rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: not-allowed;
    }

    /* Modal Form */
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      padding: 0.75rem;
      background: var(--bg-subtle);
      border-radius: 6px;
      margin-top: 0.25rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      cursor: pointer;
      user-select: none;
    }
    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--primary);
      cursor: pointer;
    }
    .text-sm {
      font-size: 0.78rem;
    }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  `]
})
export class UsuariosComponent implements OnInit {
  public readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  public readonly modalAbierto = signal<boolean>(false);
  public readonly guardando = signal<boolean>(false);

  public busqueda: string = '';
  public usuarioEditando: Usuario | null = null;

  public usuarioForm = {
    username: '',
    password: '',
    rolId: 3,
    estado: true,
    passwordNuncaExpira: true
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.adminService.cargarUsuarios();
    this.adminService.cargarRoles();
  }

  public usuariosFiltrados = computed(() => {
    const list = this.adminService.usuarios();
    const query = this.busqueda.trim().toLowerCase();
    if (!query) return list;
    return list.filter(u =>
      u.username.toLowerCase().includes(query) ||
      (u.rolNombre && u.rolNombre.toLowerCase().includes(query))
    );
  });

  getBadgeRol(rol?: string): string {
    const r = (rol || '').toUpperCase();
    if (r === 'ADMIN' || r === 'OWNER') return 'badge-warning';
    if (r === 'CAJERO') return 'badge-listo';
    return 'badge-subtle';
  }

  abrirModalCrear(): void {
    this.usuarioEditando = null;
    const primerRol = this.adminService.roles()[0]?.id || 3;
    this.usuarioForm = {
      username: '',
      password: '',
      rolId: primerRol,
      estado: true,
      passwordNuncaExpira: true
    };
    this.modalAbierto.set(true);
  }

  abrirModalEditar(u: Usuario): void {
    this.usuarioEditando = u;
    this.usuarioForm = {
      username: u.username,
      password: '',
      rolId: u.rolId || this.adminService.roles()[0]?.id || 3,
      estado: u.estado ?? true,
      passwordNuncaExpira: u.passwordNuncaExpira ?? true
    };
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.usuarioEditando = null;
  }

  guardarUsuario(): void {
    const username = this.usuarioForm.username.trim();
    if (!username) {
      this.toast.warning('Ingresa el nombre de usuario.');
      return;
    }

    if (!this.usuarioEditando && !this.usuarioForm.password) {
      this.toast.warning('Ingresa la contraseña inicial.');
      return;
    }

    this.guardando.set(true);

    if (this.usuarioEditando && this.usuarioEditando.id) {
      const payload: Partial<Usuario> = {
        id: this.usuarioEditando.id,
        username,
        rolId: Number(this.usuarioForm.rolId),
        estado: this.usuarioForm.estado,
        passwordNuncaExpira: this.usuarioForm.passwordNuncaExpira
      };

      if (this.usuarioForm.password && this.usuarioForm.password.trim()) {
        payload.password = this.usuarioForm.password.trim();
      }

      this.adminService.actualizarUsuario(this.usuarioEditando.id, payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.mensaje || err.error?.error || 'No se pudo actualizar el usuario.';
          this.toast.error(msg);
        }
      });
    } else {
      const payload = {
        username,
        password: this.usuarioForm.password,
        rolId: Number(this.usuarioForm.rolId),
        estado: this.usuarioForm.estado,
        passwordNuncaExpira: this.usuarioForm.passwordNuncaExpira
      };

      this.adminService.crearUsuario(payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.mensaje || err.error?.error || 'No se pudo crear el usuario.';
          this.toast.error(msg);
        }
      });
    }
  }

  confirmarEliminar(u: Usuario): void {
    if (!u.id) return;
    if (u.username === 'admin') {
      this.toast.warning('El usuario superadministrador no puede eliminarse.');
      return;
    }

    if (confirm(`¿Seguro que deseas eliminar al usuario "${u.username}"? Esta acción revocará todos sus accesos.`)) {
      this.adminService.eliminarUsuario(u.id).subscribe({
        error: (err) => {
          const msg = err.error?.mensaje || err.error?.error || 'No se pudo eliminar el usuario.';
          this.toast.error(msg);
        }
      });
    }
  }
}
