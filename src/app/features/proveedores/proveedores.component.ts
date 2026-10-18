import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { ToastService } from '../../core/services/toast.service';
import { Proveedor, ProveedorRequest } from '../../core/models/proveedor.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="proveedores-page">
      <!-- ENCABEZADO -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Padrón de Proveedores</h1>
          <p class="page-subtitle">Directorio de proveedores, distribuidores y contactos comerciales para compras</p>
        </div>

        <button type="button" class="btn btn-primary" (click)="abrirModalCrear()">
          <app-icon name="plus" [size]="18" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      <!-- BARRA DE BÚSQUEDA Y ESTADÍSTICAS -->
      <div class="filter-card">
        <div class="search-box">
          <app-icon name="search" [size]="18" extraClass="search-icon" />
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por RUC, Razón Social o Contacto..."
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
          <span>Total: <strong>{{ proveedoresService.proveedores().length }}</strong> proveedores</span>
        </div>
      </div>

      <!-- TABLA DE PROVEEDORES -->
      <div class="table-container">
        @if (proveedoresService.cargando()) {
          <div class="loading-state">
            <app-icon name="refresh" [size]="28" extraClass="spin-icon" />
            <span>Cargando padrón de proveedores...</span>
          </div>
        } @else if (proveedoresService.proveedores().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <app-icon name="truck" [size]="48" />
            </div>
            <h3>No se encontraron proveedores</h3>
            <p>
              {{ terminoBusqueda ? 'No hay proveedores que coincidan con la búsqueda.' : 'Aún no hay proveedores registrados en el sistema.' }}
            </p>
            @if (!terminoBusqueda) {
              <button type="button" class="btn btn-primary mt-3" (click)="abrirModalCrear()">
                Registrar Primer Proveedor
              </button>
            }
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>RUC / C.I.</th>
                <th>Razón Social / Empresa</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of proveedoresService.proveedores(); track p.id) {
                <tr [class.inactive-row]="!p.activo">
                  <td class="ruc-cell">
                    <span class="ruc-badge">{{ p.ruc }}</span>
                  </td>
                  <td class="name-cell">
                    <strong>{{ p.razonSocial }}</strong>
                  </td>
                  <td>{{ p.contacto || '—' }}</td>
                  <td>{{ p.telefono || '—' }}</td>
                  <td>{{ p.email || '—' }}</td>
                  <td class="address-cell">{{ p.direccion || '—' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="p.activo" [class.badge-danger]="!p.activo">
                      {{ p.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="actions-group">
                      <button
                        type="button"
                        class="btn-icon"
                        title="Editar Proveedor"
                        (click)="abrirModalEditar(p)"
                      >
                        <app-icon name="edit" [size]="16" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon"
                        [title]="p.activo ? 'Desactivar Proveedor' : 'Activar Proveedor'"
                        (click)="conmutarEstado(p)"
                      >
                        <app-icon [name]="p.activo ? 'minus' : 'check'" [size]="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- MODAL CREAR / EDITAR PROVEEDOR -->
      <app-modal
        [isOpen]="modalAbierto()"
        [title]="proveedorEditando() ? 'Editar Proveedor' : 'Nuevo Proveedor'"
        size="md"
        (close)="cerrarModal()"
      >
        <div body>
          <form [formGroup]="proveedorForm" (ngSubmit)="guardarProveedor()" id="proveedorForm">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="ruc">RUC o Cédula *</label>
                <input
                  id="ruc"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 80012345-6"
                  formControlName="ruc"
                  [class.is-invalid]="f['ruc'].touched && f['ruc'].invalid"
                />
                @if (f['ruc'].touched && f['ruc'].errors?.['required']) {
                  <span class="error-text">El RUC es obligatorio</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="razonSocial">Razón Social / Nombre Comercial *</label>
                <input
                  id="razonSocial"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Lácteos del Valle S.A."
                  formControlName="razonSocial"
                  [class.is-invalid]="f['razonSocial'].touched && f['razonSocial'].invalid"
                />
                @if (f['razonSocial'].touched && f['razonSocial'].errors?.['required']) {
                  <span class="error-text">La Razón Social es obligatoria</span>
                }
              </div>
            </div>

            <div class="form-grid-2 mt-3">
              <div class="form-group">
                <label class="form-label" for="contacto">Persona de Contacto / Vendedor</label>
                <input
                  id="contacto"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Carlos Benítez"
                  formControlName="contacto"
                />
              </div>

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
            </div>

            <div class="form-grid-2 mt-3">
              <div class="form-group">
                <label class="form-label" for="email">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  placeholder="Ej. ventas@proveedor.com"
                  formControlName="email"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="direccion">Dirección / Depósito</label>
                <input
                  id="direccion"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Av. Fernando de la Mora 890"
                  formControlName="direccion"
                />
              </div>
            </div>

            <div class="form-check mt-3">
              <input
                id="activo"
                type="checkbox"
                class="form-check-input"
                formControlName="activo"
              />
              <label class="form-check-label" for="activo">Proveedor Activo</label>
            </div>
          </form>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModal()" [disabled]="guardando()">
            Cancelar
          </button>
          <button
            type="submit"
            form="proveedorForm"
            class="btn btn-primary"
            [disabled]="proveedorForm.invalid || guardando()"
          >
            @if (guardando()) {
              <app-icon name="refresh" [size]="16" extraClass="spin-icon" />
              <span>Guardando...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>{{ proveedorEditando() ? 'Guardar Cambios' : 'Registrar Proveedor' }}</span>
            }
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .proveedores-page {
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
export class ProveedoresComponent implements OnInit {
  protected readonly proveedoresService = inject(ProveedoresService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  terminoBusqueda = '';
  modalAbierto = signal<boolean>(false);
  proveedorEditando = signal<Proveedor | null>(null);
  guardando = signal<boolean>(false);

  proveedorForm!: FormGroup;

  get f() {
    return this.proveedorForm.controls;
  }

  ngOnInit(): void {
    this.initForm();
    this.proveedoresService.cargarProveedores();
  }

  private initForm(): void {
    this.proveedorForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.maxLength(30)]],
      razonSocial: ['', [Validators.required, Validators.maxLength(120)]],
      contacto: ['', [Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(30)]],
      email: ['', [Validators.email, Validators.maxLength(80)]],
      direccion: ['', [Validators.maxLength(150)]],
      activo: [true]
    });
  }

  onBuscar(): void {
    this.proveedoresService.cargarProveedores(this.terminoBusqueda);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.proveedoresService.cargarProveedores();
  }

  abrirModalCrear(): void {
    this.proveedorEditando.set(null);
    this.proveedorForm.reset({
      ruc: '',
      razonSocial: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      activo: true
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(proveedor: Proveedor): void {
    this.proveedorEditando.set(proveedor);
    this.proveedorForm.patchValue({
      ruc: proveedor.ruc,
      razonSocial: proveedor.razonSocial,
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      activo: proveedor.activo
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.proveedorEditando.set(null);
  }

  guardarProveedor(): void {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const formVal = this.proveedorForm.value;
    const dto: ProveedorRequest = {
      ruc: formVal.ruc.trim(),
      razonSocial: formVal.razonSocial.trim(),
      contacto: formVal.contacto?.trim() || null,
      telefono: formVal.telefono?.trim() || null,
      email: formVal.email?.trim() || null,
      direccion: formVal.direccion?.trim() || null,
      activo: formVal.activo
    };

    const editando = this.proveedorEditando();
    if (editando) {
      this.proveedoresService.actualizar(editando.id, dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          this.toast.error(err.error?.mensaje || 'Error al actualizar proveedor.');
        }
      });
    } else {
      this.proveedoresService.crear(dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando.set(false);
          this.toast.error(err.error?.mensaje || 'Error al crear proveedor.');
        }
      });
    }
  }

  conmutarEstado(proveedor: Proveedor): void {
    const nuevoEstado = !proveedor.activo;
    this.proveedoresService.cambiarEstado(proveedor.id, nuevoEstado).subscribe({
      error: () => {
        this.toast.error('No se pudo cambiar el estado del proveedor.');
      }
    });
  }
}
