import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ClientesService } from '../../core/services/clientes.service';
import { ToastService } from '../../core/services/toast.service';
import { Cliente, ClienteRequest } from '../../core/models/cliente.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="clientes-page">
      <!-- ENCABEZADO -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Padrón de Clientes</h1>
          <p class="page-subtitle">Base de datos de clientes, RUC/C.I. y datos fiscales para facturación</p>
        </div>

        <button type="button" class="btn btn-primary" (click)="abrirModalCrear()">
          <app-icon name="plus" [size]="18" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <!-- BARRA DE BÚSQUEDA Y ESTADÍSTICAS -->
      <div class="filter-card">
        <div class="search-box">
          <app-icon name="search" [size]="18" extraClass="search-icon" />
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por RUC, Cédula o Razón Social..."
            [(ngModel)]="terminoBusqueda"
            (input)="onBuscar()"
          />
          @if (terminoBusqueda) {
            <button type="button" class="btn-clear" (click)="limpiarBusqueda()">
              <app-icon name="x" [size]="16" />
            </button>
          }
        </div>
        <div class="stats-badge">
          <span>Total: <strong>{{ clientesService.clientes().length }}</strong> clientes</span>
        </div>
      </div>

      <!-- TABLA DE CLIENTES -->
      <div class="table-container">
        @if (clientesService.cargando()) {
          <div class="loading-state">
            <app-icon name="refresh" [size]="28" extraClass="spin-icon" />
            <span>Cargando padrón de clientes...</span>
          </div>
        } @else if (clientesService.clientes().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <app-icon name="users" [size]="48" />
            </div>
            <h3>No se encontraron clientes</h3>
            <p>
              {{ terminoBusqueda ? 'No hay clientes que coincidan con la búsqueda.' : 'Aún no hay clientes registrados en el sistema.' }}
            </p>
            @if (!terminoBusqueda) {
              <button type="button" class="btn btn-primary mt-3" (click)="abrirModalCrear()">
                Registrar Primer Cliente
              </button>
            }
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>RUC / C.I.</th>
                <th>Razón Social / Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección Fiscal</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clientesService.clientes(); track c.id) {
                <tr [class.inactive-row]="!c.activo">
                  <td class="ruc-cell">
                    <span class="ruc-badge">{{ c.ruc }}</span>
                  </td>
                  <td class="name-cell">
                    <strong>{{ c.razonSocial }}</strong>
                  </td>
                  <td>{{ c.telefono || '—' }}</td>
                  <td>{{ c.email || '—' }}</td>
                  <td class="address-cell">{{ c.direccion || '—' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="c.activo" [class.badge-danger]="!c.activo">
                      {{ c.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="actions-group">
                      <button
                        type="button"
                        class="btn-icon"
                        title="Editar Cliente"
                        (click)="abrirModalEditar(c)"
                      >
                        <app-icon name="edit" [size]="16" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon"
                        [title]="c.activo ? 'Desactivar Cliente' : 'Activar Cliente'"
                        (click)="conmutarEstado(c)"
                      >
                        <app-icon [name]="c.activo ? 'minus' : 'check'" [size]="16" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon btn-icon-danger"
                        title="Eliminar Cliente"
                        (click)="confirmarEliminar(c)"
                      >
                        <app-icon name="trash" [size]="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- MODAL CREAR / EDITAR CLIENTE -->
      <app-modal
        [isOpen]="modalAbierto()"
        [title]="clienteEditando() ? 'Editar Cliente' : 'Nuevo Cliente'"
        size="md"
        (close)="cerrarModal()"
      >
        <div body>
          <form [formGroup]="clienteForm" (ngSubmit)="guardarCliente()" id="clienteForm">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="ruc">RUC o Cédula *</label>
                <input
                  id="ruc"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 1234567-8 o 4567890"
                  formControlName="ruc"
                  [class.is-invalid]="f['ruc'].touched && f['ruc'].invalid"
                />
                @if (f['ruc'].touched && f['ruc'].errors?.['required']) {
                  <span class="error-text">El RUC o Cédula es obligatorio</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="razonSocial">Razón Social / Nombre *</label>
                <input
                  id="razonSocial"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Juan Pérez o Comercial S.A."
                  formControlName="razonSocial"
                  [class.is-invalid]="f['razonSocial'].touched && f['razonSocial'].invalid"
                />
                @if (f['razonSocial'].touched && f['razonSocial'].errors?.['required']) {
                  <span class="error-text">La Razón Social o Nombre es obligatoria</span>
                }
              </div>
            </div>

            <div class="form-grid-2 mt-3">
              <div class="form-group">
                <label class="form-label" for="telefono">Teléfono / WhatsApp</label>
                <input
                  id="telefono"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 0981-123456"
                  formControlName="telefono"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="email">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  placeholder="Ej. cliente@correo.com"
                  formControlName="email"
                />
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label" for="direccion">Dirección Fiscal / Domicilio</label>
              <input
                id="direccion"
                type="text"
                class="form-control"
                placeholder="Ej. Av. Eusebio Ayala 1234"
                formControlName="direccion"
              />
            </div>

            <div class="form-check mt-3">
              <input
                id="activo"
                type="checkbox"
                class="form-check-input"
                formControlName="activo"
              />
              <label class="form-check-label" for="activo">Cliente Activo</label>
            </div>
          </form>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModal()" [disabled]="guardando()">
            Cancelar
          </button>
          <button
            type="submit"
            form="clienteForm"
            class="btn btn-primary"
            [disabled]="clienteForm.invalid || guardando()"
          >
            @if (guardando()) {
              <app-icon name="refresh" [size]="16" extraClass="spin-icon" />
              <span>Guardando...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>{{ clienteEditando() ? 'Guardar Cambios' : 'Registrar Cliente' }}</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- MODAL CONFIRMAR ELIMINACIÓN -->
      <app-modal
        [isOpen]="modalEliminarAbierto()"
        title="Confirmar Eliminación"
        size="sm"
        (close)="cerrarModalEliminar()"
      >
        <div body class="delete-modal-body">
          <div class="delete-warning-icon">
            <app-icon name="alert-triangle" [size]="48" />
          </div>
          <p class="delete-warning-text">
            ¿Está seguro de que desea eliminar al cliente <strong>{{ clienteAEliminar()?.razonSocial }}</strong> (RUC/C.I.: {{ clienteAEliminar()?.ruc }})?
          </p>
          <div class="alert-box-info">
            <app-icon name="info" [size]="16" />
            <span>El cliente se eliminará del directorio. Las facturas y comprobantes emitidos en el pasado conservarán sus datos intactos para respaldo fiscal.</span>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalEliminar()" [disabled]="eliminando()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-danger"
            (click)="ejecutarEliminacion()"
            [disabled]="eliminando()"
          >
            @if (eliminando()) {
              <app-icon name="refresh" [size]="16" extraClass="spin-icon" />
              <span>Eliminando...</span>
            } @else {
              <app-icon name="trash" [size]="16" />
              <span>Eliminar</span>
            }
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .clientes-page {
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
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      margin: 0.25rem 0 0 0;
    }

    .filter-card {
      background: var(--bg-surface, #ffffff);
      padding: 0.875rem 1.25rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
      max-width: 480px;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.875rem;
      color: var(--text-muted, #94a3b8);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 2.25rem 0.625rem 2.5rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border-color, #cbd5e1);
      font-size: 0.875rem;
      background: var(--bg-main, #f8fafc);
      color: var(--text-main, #0f172a);
      outline: none;
      transition: all 0.2s;
    }

    .search-input:focus {
      border-color: var(--primary, #0284c7);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }

    .btn-clear {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }

    .btn-clear:hover {
      color: var(--text-main, #0f172a);
    }

    .stats-badge {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
    }

    .table-container {
      background: var(--bg-surface, #ffffff);
      border-radius: 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      overflow-x: auto;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      text-align: left;
    }

    .data-table th {
      background: var(--bg-subtle, #f8fafc);
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--text-muted, #475569);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      white-space: nowrap;
    }

    .data-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-main, #1e293b);
      vertical-align: middle;
    }

    .data-table tbody tr:hover {
      background: var(--bg-subtle, #f8fafc);
    }

    .inactive-row {
      opacity: 0.6;
    }

    .ruc-cell {
      white-space: nowrap;
    }

    .ruc-badge {
      display: inline-block;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.8125rem;
      padding: 0.2rem 0.5rem;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 0.375rem;
    }

    .name-cell {
      font-size: 0.9375rem;
    }

    .address-cell {
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      text-align: center;
    }

    .badge-success {
      background: #dcfce7;
      color: #15803d;
    }

    .badge-danger {
      background: #fee2e2;
      color: #b91c1c;
    }

    .actions-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .btn-icon {
      background: none;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.375rem;
      padding: 0.375rem;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: var(--primary, #0284c7);
      border-color: var(--primary, #0284c7);
    }

    .btn-icon-danger:hover {
      background: #fee2e2 !important;
      color: #ef4444 !important;
      border-color: #fca5a5 !important;
    }

    .text-right {
      text-align: right;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.625rem 1.125rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-primary {
      background: var(--primary, #0284c7);
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-dark, #0369a1);
    }

    .btn-danger {
      background: #ef4444;
      color: #ffffff;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .delete-modal-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .delete-warning-icon {
      color: #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .delete-warning-text {
      font-size: 0.9375rem;
      color: var(--text-main, #0f172a);
      margin: 0;
    }

    .alert-box-info {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: #f0f9ff;
      border: 1px solid #e0f2fe;
      border-radius: 0.5rem;
      padding: 0.75rem;
      color: #0369a1;
      font-size: 0.8125rem;
      text-align: left;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-state,
    .empty-state {
      padding: 3.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: var(--text-muted, #64748b);
    }

    .empty-icon {
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      color: var(--text-main, #0f172a);
      margin: 0;
    }

    .empty-state p {
      max-width: 400px;
      margin: 0;
      font-size: 0.875rem;
    }

    /* FORMULARIOS */
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main, #334155);
    }

    .form-control {
      padding: 0.625rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border-color, #cbd5e1);
      font-size: 0.875rem;
      color: var(--text-main, #0f172a);
      background: #ffffff;
      outline: none;
      transition: all 0.2s;
    }

    .form-control:focus {
      border-color: var(--primary, #0284c7);
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }

    .form-control.is-invalid {
      border-color: #ef4444;
    }

    .error-text {
      font-size: 0.75rem;
      color: #ef4444;
    }

    .form-check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-check-input {
      width: 1.125rem;
      height: 1.125rem;
      accent-color: var(--primary, #0284c7);
      cursor: pointer;
    }

    .form-check-label {
      font-size: 0.875rem;
      color: var(--text-main, #334155);
      cursor: pointer;
    }

    .mt-3 { margin-top: 1rem; }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ClientesComponent implements OnInit {
  protected readonly clientesService = inject(ClientesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  terminoBusqueda = '';
  modalAbierto = signal<boolean>(false);
  clienteEditando = signal<Cliente | null>(null);
  guardando = signal<boolean>(false);

  // Modal Confirmar Eliminación
  modalEliminarAbierto = signal<boolean>(false);
  clienteAEliminar = signal<Cliente | null>(null);
  eliminando = signal<boolean>(false);

  clienteForm!: FormGroup;

  get f() {
    return this.clienteForm.controls;
  }

  ngOnInit(): void {
    this.initForm();
    this.clientesService.cargarClientes();
  }

  private initForm(): void {
    this.clienteForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.maxLength(30)]],
      razonSocial: ['', [Validators.required, Validators.maxLength(120)]],
      telefono: ['', [Validators.maxLength(30)]],
      email: ['', [Validators.email, Validators.maxLength(80)]],
      direccion: ['', [Validators.maxLength(150)]],
      activo: [true]
    });
  }

  onBuscar(): void {
    this.clientesService.cargarClientes(this.terminoBusqueda);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.clientesService.cargarClientes();
  }

  abrirModalCrear(): void {
    this.clienteEditando.set(null);
    this.clienteForm.reset({
      ruc: '',
      razonSocial: '',
      telefono: '',
      email: '',
      direccion: '',
      activo: true
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(cliente: Cliente): void {
    this.clienteEditando.set(cliente);
    this.clienteForm.patchValue({
      ruc: cliente.ruc,
      razonSocial: cliente.razonSocial,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      activo: cliente.activo
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.clienteEditando.set(null);
  }

  guardarCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const formVal = this.clienteForm.value;
    const dto: ClienteRequest = {
      ruc: formVal.ruc.trim(),
      razonSocial: formVal.razonSocial.trim(),
      telefono: formVal.telefono?.trim() || null,
      email: formVal.email?.trim() || null,
      direccion: formVal.direccion?.trim() || null,
      activo: formVal.activo
    };

    const editando = this.clienteEditando();
    if (editando) {
      this.clientesService.actualizar(editando.id, dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          this.toast.error(err.error?.mensaje || 'Error al actualizar cliente.');
        }
      });
    } else {
      this.clientesService.crear(dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          this.toast.error(err.error?.mensaje || 'Error al crear cliente.');
        }
      });
    }
  }

  conmutarEstado(cliente: Cliente): void {
    const nuevoEstado = !cliente.activo;
    this.clientesService.cambiarEstado(cliente.id, nuevoEstado).subscribe({
      error: () => {
        this.toast.error('No se pudo cambiar el estado del cliente.');
      }
    });
  }

  confirmarEliminar(cliente: Cliente): void {
    this.clienteAEliminar.set(cliente);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
    this.clienteAEliminar.set(null);
  }

  ejecutarEliminacion(): void {
    const c = this.clienteAEliminar();
    if (!c) return;

    this.eliminando.set(true);
    this.clientesService.eliminar(c.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.cerrarModalEliminar();
      },
      error: (err) => {
        this.eliminando.set(false);
        this.toast.error(err.error?.mensaje || 'Error al eliminar el cliente.');
      }
    });
  }
}
