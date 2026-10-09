import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Usuario } from '../../../core/models/admin.model';
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
          <p class="page-subtitle">Administra el personal, accesos al POS y roles del sistema</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-primary" (click)="abrirModalCrear()">
            <app-icon name="plus" [size]="16" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header space-between">
          <h3>Usuarios Registrados</h3>
          <button type="button" class="btn btn-sm btn-secondary" (click)="adminService.cargarUsuarios()">
            <app-icon name="refresh" [size]="14" />
            <span>Refrescar</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Seguridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of adminService.usuarios(); track u.id) {
                <tr>
                  <td><strong>#{{ u.id }}</strong></td>
                  <td>
                    <div class="d-flex align-center gap-2">
                      <div class="user-avatar-sm">
                        <app-icon name="user" [size]="14" />
                      </div>
                      <span class="font-bold">{{ u.username }}</span>
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
                    <span class="text-muted text-sm">
                      {{ u.passwordNuncaExpira ? 'Contraseña permanente' : 'Expira periódicamente' }}
                    </span>
                  </td>
                  <td>
                    @if (u.username !== 'admin') {
                      <button
                        type="button"
                        class="btn-icon-danger"
                        (click)="confirmarEliminar(u)"
                        title="Eliminar usuario"
                      >
                        <app-icon name="trash" [size]="16" />
                      </button>
                    } @else {
                      <span class="text-muted text-sm">Sistema</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CREAR USUARIO -->
      <app-modal
        [isOpen]="modalCrearAbierto()"
        title="Crear Nuevo Usuario"
        size="md"
        (close)="modalCrearAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="newUsername">Nombre de Usuario *</label>
            <input
              id="newUsername"
              type="text"
              class="form-control"
              [(ngModel)]="nuevoUsuario.username"
              placeholder="Ej. cajero1"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="newPassword">Contraseña Inicial *</label>
            <input
              id="newPassword"
              type="password"
              class="form-control"
              [(ngModel)]="nuevoUsuario.password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="newRol">Rol Asignado *</label>
            <select id="newRol" class="form-control" [(ngModel)]="nuevoUsuario.rolId">
              @for (rol of adminService.roles(); track rol.id) {
                <option [value]="rol.id">{{ rol.nombre }}</option>
              }
            </select>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalCrearAbierto.set(false)">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="guardarUsuario()" [disabled]="guardando()">
            <span>Guardar Usuario</span>
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
    .user-avatar-sm {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }
    .btn-icon-danger {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .btn-icon-danger:hover {
      background: #fee2e2;
    }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .text-sm {
      font-size: 0.78rem;
    }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-2 { gap: 0.5rem; }
  `]
})
export class UsuariosComponent implements OnInit {
  public readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  public readonly modalCrearAbierto = signal<boolean>(false);
  public readonly guardando = signal<boolean>(false);

  public nuevoUsuario = {
    username: '',
    password: '',
    rolId: 3,
    estado: true
  };

  ngOnInit(): void {
    this.adminService.cargarUsuarios();
    this.adminService.cargarRoles();
  }

  getBadgeRol(rol?: string): string {
    const r = (rol || '').toUpperCase();
    if (r === 'ADMIN' || r === 'OWNER') return 'badge-warning';
    if (r === 'CAJERO') return 'badge-listo';
    return 'badge-subtle';
  }

  abrirModalCrear(): void {
    this.nuevoUsuario = {
      username: '',
      password: '',
      rolId: this.adminService.roles()[0]?.id || 3,
      estado: true
    };
    this.modalCrearAbierto.set(true);
  }

  guardarUsuario(): void {
    if (!this.nuevoUsuario.username.trim() || !this.nuevoUsuario.password) {
      this.toast.warning('Ingresa el nombre de usuario y contraseña.');
      return;
    }

    this.guardando.set(true);
    this.adminService.crearUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalCrearAbierto.set(false);
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.mensaje || err.error?.error || 'No se pudo crear el usuario.';
        this.toast.error(msg);
      }
    });
  }

  confirmarEliminar(u: Usuario): void {
    if (!u.id) return;
    if (confirm(`¿Seguro que deseas eliminar al usuario "${u.username}"?`)) {
      this.adminService.eliminarUsuario(u.id).subscribe();
    }
  }
}
