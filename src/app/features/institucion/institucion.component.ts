import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstitucionService } from '../../core/services/institucion.service';
import { PuntoExpedicionService } from '../../core/services/punto-expedicion.service';
import { ToastService } from '../../core/services/toast.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { Institucion } from '../../core/models/institucion.model';
import { PuntoExpedicion, PuntoExpedicionRequest } from '../../core/models/punto-expedicion.model';
import { validarRucParaguay, autocompletarRucDv } from '../../core/validators/ruc-modulo11.validator';

@Component({
  selector: 'app-institucion',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="institucion-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Datos del Negocio y Facturación</h1>
          <p class="page-subtitle">Configura los datos fiscales para la emisión legal de facturas y tickets del punto de venta</p>
        </div>
      </div>

      <div class="institucion-card">
        <form (ngSubmit)="guardar()" class="institucion-form">
          <!-- SECCIÓN 1: DATOS GENERALES -->
          <div class="form-section">
            <h3 class="section-heading">
              <app-icon name="building" [size]="18" />
              <span>Datos Generales de la Heladería</span>
            </h3>

            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label" for="nombreNegocio">Nombre Comercial / Razón Social *</label>
                <input
                  id="nombreNegocio"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Heladería Artesanal Don Nicola"
                  [(ngModel)]="nombre"
                  name="nombre"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="direccionNegocio">Dirección del Local</label>
                <input
                  id="direccionNegocio"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Av. Mariscal López 1234"
                  [(ngModel)]="direccion"
                  name="direccion"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="ciudadNegocio">Ciudad</label>
                <input
                  id="ciudadNegocio"
                  type="text"
                  class="form-control"
                  placeholder="Ej. Asunción"
                  [(ngModel)]="ciudad"
                  name="ciudad"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="telefonoNegocio">Teléfono de Contacto</label>
                <input
                  id="telefonoNegocio"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 021-123456 / 0981-000000"
                  [(ngModel)]="telefono"
                  name="telefono"
                />
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: DATOS FISCALES -->
          <div class="form-section">
            <h3 class="section-heading">
              <app-icon name="file-text" [size]="18" />
              <span>Datos Fiscales y Timbrado (Facturación)</span>
            </h3>
            <p class="section-desc">Estos datos se imprimirán en las facturas legales y tickets emitidos a los clientes.</p>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="rucNegocio">R.U.C. del Emisor *</label>
                <div class="input-action-group">
                  <input
                    id="rucNegocio"
                    type="text"
                    class="form-control"
                    placeholder="Ej. 80099887-1"
                    [(ngModel)]="ruc"
                    name="ruc"
                  />
                  <button
                    type="button"
                    class="btn-calcular-dv"
                    title="Calcular Dígito Verificador Módulo 11 oficial"
                    (click)="autocompletarRucInstitucion()"
                  >
                    <span>Calcular DV</span>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="timbradoNegocio">N° de Timbrado Vigente</label>
                <input
                  id="timbradoNegocio"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 17894561"
                  [(ngModel)]="timbrado"
                  name="timbrado"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="timbradoInicioNegocio">Inicio Vigencia del Timbrado</label>
                <input
                  id="timbradoInicioNegocio"
                  type="date"
                  class="form-control"
                  [(ngModel)]="timbradoInicio"
                  name="timbradoInicio"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="vencimientoTimbrado">Vigencia del Timbrado (Vencimiento)</label>
                <input
                  id="vencimientoTimbrado"
                  type="date"
                  class="form-control"
                  [(ngModel)]="timbradoVencimiento"
                  name="timbradoVencimiento"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="establecimientoNegocio">Establecimiento</label>
                <input
                  id="establecimientoNegocio"
                  type="text"
                  class="form-control"
                  placeholder="001"
                  maxlength="3"
                  [(ngModel)]="establecimiento"
                  name="establecimiento"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="puntoEmisionNegocio">Punto de Emisión</label>
                <input
                  id="puntoEmisionNegocio"
                  type="text"
                  class="form-control"
                  placeholder="001"
                  maxlength="3"
                  [(ngModel)]="puntoEmision"
                  name="puntoEmision"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="numeroInicioNegocio">Talonario - Desde</label>
                <input
                  id="numeroInicioNegocio"
                  type="number"
                  min="1"
                  class="form-control"
                  placeholder="1"
                  [(ngModel)]="numeroInicioFactura"
                  name="numeroInicioFactura"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="numeroFinNegocio">Talonario - Hasta (Límite)</label>
                <input
                  id="numeroFinNegocio"
                  type="number"
                  min="1"
                  class="form-control"
                  placeholder="1000"
                  [(ngModel)]="numeroFinFactura"
                  name="numeroFinFactura"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="ultimoNumero">Último N° Factura Emitido</label>
                <input
                  id="ultimoNumero"
                  type="number"
                  min="0"
                  class="form-control"
                  placeholder="0"
                  [(ngModel)]="ultimoNumeroFactura"
                  name="ultimoNumeroFactura"
                />
                <small class="field-hint">
                  Próxima factura: <strong>{{ establecimiento || '001' }}-{{ puntoEmision || '001' }}-{{ ((ultimoNumeroFactura || 0) + 1).toString().padStart(7, '0') }}</strong>
                </small>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: LOGOTIPO -->
          <div class="form-section">
            <h3 class="section-heading">
              <app-icon name="sparkles" [size]="18" />
              <span>Logotipo de la Empresa</span>
            </h3>

            <div class="logo-preview-box">
              @if (logoBase64()) {
                <img [src]="'data:image/png;base64,' + logoBase64()" alt="Logo Negocio" class="preview-img" />
                <button type="button" class="btn btn-outline btn-sm mt-2" (click)="quitarLogo()">
                  <app-icon name="trash" [size]="14" />
                  <span>Quitar Logotipo</span>
                </button>
              } @else {
                <div class="no-logo">
                  <app-icon name="ice-cream" [size]="40" />
                  <span>Sin logotipo cargado</span>
                </div>
              }
            </div>

            <div class="file-upload-wrapper mt-3">
              <label class="btn btn-secondary file-btn" for="logoUpload">
                <app-icon name="sparkles" [size]="16" />
                <span>Seleccionar imagen (PNG / JPG)</span>
              </label>
              <input
                id="logoUpload"
                type="file"
                accept="image/png, image/jpeg"
                (change)="onFileSelected($event)"
                class="file-input-hidden"
              />
              <small class="file-hint">
                Se enviará en formato Base64 puro sin prefijo de esquema.
              </small>
            </div>
          </div>

          <!-- BOTÓN GUARDAR -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-lg"
              [disabled]="guardando() || !nombre.trim()"
            >
              @if (guardando()) {
                <span>Guardando cambios...</span>
              } @else {
                <app-icon name="check" [size]="18" />
                <span>Guardar Cambios</span>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- ==================== SECCIÓN 4: PUNTOS DE EXPEDICIÓN FISCALES (MULTI-CAJA) ==================== -->
      <div class="institucion-card">
        <div class="header-puntos mb-3">
          <div>
            <h3 class="section-heading">
              <app-icon name="point_of_sale" [size]="20" />
              <span>Puntos de Expedición y Cajas Registradoras (DNIT / SET)</span>
            </h3>
            <p class="section-desc">
              Cada terminal o caja registradora habilitada emite facturas legales bajo su propio código (EEE-PPP) y secuencia independiente.
            </p>
          </div>
          <button type="button" class="btn btn-primary" (click)="abrirModalPunto()">
            <app-icon name="plus" [size]="16" />
            <span>Nuevo Punto de Expedición</span>
          </button>
        </div>

        @if (puntoExpedicionService.cargando()) {
          <div class="text-center py-4 text-muted">Cargando puntos de expedición...</div>
        } @else if (puntoExpedicionService.puntos().length === 0) {
          <div class="text-center py-4 text-muted">
            <p class="m-0">No hay puntos de expedición configurados todavía.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table-puntos">
              <thead>
                <tr>
                  <th>Nombre de Terminal</th>
                  <th>Prefijo Legal</th>
                  <th>Timbrado Fiscal</th>
                  <th>Talonario</th>
                  <th>Próxima Factura</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of puntoExpedicionService.puntos(); track p.id) {
                  <tr>
                    <td>
                      <div class="font-bold">{{ p.nombre }}</div>
                    </td>
                    <td>
                      <span class="badge badge-code">{{ p.prefijoLegal }}</span>
                    </td>
                    <td>
                      <div class="text-sm font-medium">{{ p.timbrado || timbrado || 'General' }}</div>
                      @if (p.timbradoVencimiento) {
                        <div class="text-xs text-muted">Vence: {{ p.timbradoVencimiento }}</div>
                      }
                    </td>
                    <td>
                      <span class="text-sm">{{ p.numeroInicioFactura }} - {{ p.numeroFinFactura }}</span>
                    </td>
                    <td>
                      <strong class="text-blue">{{ p.proximaFactura }}</strong>
                    </td>
                    <td>
                      <div class="d-flex flex-column gap-1">
                        @if (p.activo) {
                          <span class="badge badge-success">Activo</span>
                        } @else {
                          <span class="badge badge-secondary">Inactivo</span>
                        }
                        @if (p.enUso) {
                          <span class="badge badge-warning" title="Turno abierto por {{ p.usuarioActual }}">
                            En uso: {{ p.usuarioActual }}
                          </span>
                        } @else {
                          <span class="badge badge-info">Libre</span>
                        }
                      </div>
                    </td>
                    <td class="text-right">
                      <div class="d-flex align-center justify-end gap-1">
                        <button
                          type="button"
                          class="btn-icon"
                          title="Editar configuración y talonario"
                          (click)="editarPunto(p)"
                        >
                          <app-icon name="edit" [size]="15" />
                        </button>
                        <button
                          type="button"
                          class="btn-icon"
                          [title]="p.activo ? 'Desactivar punto' : 'Activar punto'"
                          [disabled]="p.enUso"
                          (click)="toggleEstadoPunto(p)"
                        >
                          <app-icon [name]="p.activo ? 'eye-off' : 'eye'" [size]="15" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- MODAL CREAR / EDITAR PUNTO DE EXPEDICIÓN -->
    <app-modal
      [isOpen]="modalPuntoAbierto()"
      [title]="puntoEditandoId ? 'Editar Punto de Expedición' : 'Nuevo Punto de Expedición'"
      size="md"
      (close)="cerrarModalPunto()"
    >
      <div body class="modal-form-grid">
        <div class="form-group full-width">
          <label class="form-label" for="puntoNombre">Nombre de la Terminal / Caja *</label>
          <input
            id="puntoNombre"
            type="text"
            class="form-control"
            placeholder="Ej. Caja 1 - Mostrador / Caja Take Away"
            [(ngModel)]="formPunto.nombre"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="puntoEstab">Establecimiento (3 dígitos) *</label>
          <input
            id="puntoEstab"
            type="text"
            maxlength="3"
            class="form-control"
            placeholder="001"
            [(ngModel)]="formPunto.establecimiento"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="puntoEmisionCod">Punto de Emisión (3 dígitos) *</label>
          <input
            id="puntoEmisionCod"
            type="text"
            maxlength="3"
            class="form-control"
            placeholder="001"
            [(ngModel)]="formPunto.puntoEmision"
            required
          />
        </div>

        <div class="form-group full-width">
          <label class="form-label" for="puntoTimbrado">N° de Timbrado Específico (opcional)</label>
          <input
            id="puntoTimbrado"
            type="text"
            class="form-control"
            placeholder="Dejar vacío para heredar el timbrado general"
            [(ngModel)]="formPunto.timbrado"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="puntoInicio">Talonario - Desde</label>
          <input
            id="puntoInicio"
            type="number"
            min="1"
            class="form-control"
            [(ngModel)]="formPunto.numeroInicioFactura"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="puntoFin">Talonario - Hasta (Límite)</label>
          <input
            id="puntoFin"
            type="number"
            min="1"
            class="form-control"
            [(ngModel)]="formPunto.numeroFinFactura"
          />
        </div>

        <div class="form-group full-width">
          <label class="form-label" for="puntoUltimo">Último Número Emitido</label>
          <input
            id="puntoUltimo"
            type="number"
            min="0"
            class="form-control"
            [(ngModel)]="formPunto.ultimoNumeroFactura"
          />
          <small class="field-hint">
            Próxima factura generada: <strong>{{ formPunto.establecimiento || '001' }}-{{ formPunto.puntoEmision || '001' }}-{{ ((formPunto.ultimoNumeroFactura || 0) + 1).toString().padStart(7, '0') }}</strong>
          </small>
        </div>
      </div>

      <div footer class="d-flex justify-end gap-2">
        <button type="button" class="btn btn-secondary" (click)="cerrarModalPunto()">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          (click)="guardarPunto()"
          [disabled]="guardandoPunto() || !formPunto.nombre.trim()"
        >
          {{ guardandoPunto() ? 'Guardando...' : 'Guardar Punto' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .institucion-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      background: var(--bg-surface);
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    .page-title {
      font-size: 1.35rem;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.2rem 0 0;
    }

    .institucion-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }

    .institucion-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .form-section:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
    }

    .section-heading {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .section-desc {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin: -0.5rem 0 0.5rem 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .full-width {
      grid-column: span 2;
    }

    .field-hint {
      font-size: 0.725rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
      display: block;
    }

    .input-action-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-calcular-dv {
      white-space: nowrap;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary, #d97706);
      background-color: var(--primary-subtle, #fef3c7);
      border: 1px solid var(--primary, #d97706);
      border-radius: var(--radius-md, 0.5rem);
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      flex-shrink: 0;
    }

    .btn-calcular-dv:hover {
      background-color: var(--primary, #d97706);
      color: #ffffff;
    }

    .logo-preview-box {
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      text-align: center;
      background: var(--bg-subtle);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .preview-img {
      max-width: 160px;
      max-height: 120px;
      object-fit: contain;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
    }

    .no-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .file-upload-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .file-input-hidden {
      display: none;
    }

    .file-btn {
      cursor: pointer;
    }

    .file-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }

    .header-puntos {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .table-puntos {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .table-puntos th {
      text-align: left;
      padding: 0.75rem 0.5rem;
      border-bottom: 2px solid var(--border-color);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-puntos td {
      padding: 0.85rem 0.5rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    .table-puntos tr:hover td {
      background: var(--bg-hover, rgba(0,0,0,0.02));
    }

    .badge-code {
      font-family: monospace;
      font-size: 0.9rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      background: var(--primary-bg, #e0f2fe);
      color: var(--primary, #0284c7);
      border-radius: var(--radius-sm, 4px);
    }

    .badge-success {
      background: #dcfce7;
      color: #15803d;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .badge-secondary {
      background: #f1f5f9;
      color: #64748b;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .badge-warning {
      background: #fef9c3;
      color: #a16207;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .badge-info {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .text-blue {
      color: var(--primary, #0284c7);
    }

    .text-right {
      text-align: right;
    }

    .justify-end {
      justify-content: flex-end;
    }

    .btn-icon {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.4rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .btn-icon:hover:not(:disabled) {
      color: var(--primary);
      border-color: var(--primary);
      background: var(--bg-hover, rgba(0,0,0,0.03));
    }

    .btn-icon:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .modal-form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .form-grid,
      .modal-form-grid {
        grid-template-columns: 1fr;
      }
      .full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class InstitucionComponent implements OnInit {
  public readonly institucionService = inject(InstitucionService);
  public readonly puntoExpedicionService = inject(PuntoExpedicionService);
  private readonly toast = inject(ToastService);

  public nombre: string = '';
  public ruc: string = '';
  public timbrado: string = '';
  public timbradoInicio: string = '';
  public timbradoVencimiento: string = '';
  public establecimiento: string = '001';
  public puntoEmision: string = '001';
  public numeroInicioFactura: number = 1;
  public numeroFinFactura: number = 1000;
  public ultimoNumeroFactura: number = 0;
  public direccion: string = '';
  public telefono: string = '';
  public ciudad: string = 'Asunción';

  public readonly logoBase64 = signal<string>('');
  public readonly guardando = signal<boolean>(false);

  public readonly modalPuntoAbierto = signal<boolean>(false);
  public readonly guardandoPunto = signal<boolean>(false);
  public puntoEditandoId: number | null = null;

  public formPunto: PuntoExpedicionRequest = {
    nombre: '',
    establecimiento: '001',
    puntoEmision: '001',
    timbrado: '',
    numeroInicioFactura: 1,
    numeroFinFactura: 1000,
    ultimoNumeroFactura: 0,
    activo: true
  };

  ngOnInit(): void {
    const inst = this.institucionService.institucion();
    this.cargarDatos(inst);

    this.institucionService.obtenerInstitucion().subscribe((datos: Institucion) => {
      this.cargarDatos(datos);
    });

    this.puntoExpedicionService.listarTodos().subscribe();
  }

  private cargarDatos(inst: Institucion): void {
    if (!inst) return;
    this.nombre = inst.nombre || '';
    this.ruc = inst.ruc || '';
    this.timbrado = inst.timbrado || '';
    this.timbradoInicio = inst.timbradoInicio || '';
    this.timbradoVencimiento = inst.timbradoVencimiento || '';
    this.establecimiento = inst.establecimiento || '001';
    this.puntoEmision = inst.puntoEmision || '001';
    this.numeroInicioFactura = inst.numeroInicioFactura ?? 1;
    this.numeroFinFactura = inst.numeroFinFactura ?? 1000;
    this.ultimoNumeroFactura = inst.ultimoNumeroFactura ?? 0;
    this.direccion = inst.direccion || '';
    this.telefono = inst.telefono || '';
    this.ciudad = inst.ciudad || 'Asunción';
    this.logoBase64.set(inst.logoBase64 || '');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const base64Data = result.includes('base64,') ? result.split('base64,')[1] : result;
          this.logoBase64.set(base64Data);
        }
      };

      reader.readAsDataURL(file);
    }
  }

  quitarLogo(): void {
    this.logoBase64.set('');
  }

  autocompletarRucInstitucion(): void {
    if (this.ruc && this.ruc.trim()) {
      const formateado = autocompletarRucDv(this.ruc);
      this.ruc = formateado;
      this.toast.info(`RUC del emisor actualizado con DV oficial: ${formateado}`, 'Módulo 11');
    }
  }

  guardar(): void {
    if (!this.nombre.trim()) return;

    if (this.ruc && this.ruc.trim()) {
      const v = validarRucParaguay(this.ruc.trim(), false);
      if (!v.valido) {
        this.toast.error(
          v.motivo || 'El RUC del emisor fiscal no es válido según el algoritmo Módulo 11 oficial.',
          'RUC Inválido'
        );
        return;
      }
    }

    this.guardando.set(true);
    this.institucionService.actualizar({
      nombre: this.nombre,
      logoBase64: this.logoBase64(),
      ruc: this.ruc,
      timbrado: this.timbrado,
      timbradoInicio: this.timbradoInicio,
      timbradoVencimiento: this.timbradoVencimiento,
      establecimiento: this.establecimiento,
      puntoEmision: this.puntoEmision,
      numeroInicioFactura: this.numeroInicioFactura,
      numeroFinFactura: this.numeroFinFactura,
      ultimoNumeroFactura: this.ultimoNumeroFactura,
      direccion: this.direccion,
      telefono: this.telefono,
      ciudad: this.ciudad
    }).subscribe({
      next: () => {
        this.guardando.set(false);
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.mensaje || 'Error al actualizar datos institucionales.';
        this.toast.error(msg);
      }
    });
  }

  abrirModalPunto(): void {
    this.puntoEditandoId = null;
    const count = this.puntoExpedicionService.puntos().length;
    this.formPunto = {
      nombre: '',
      establecimiento: this.establecimiento || '001',
      puntoEmision: String(count + 1).padStart(3, '0'),
      timbrado: this.timbrado || '',
      numeroInicioFactura: 1,
      numeroFinFactura: 1000,
      ultimoNumeroFactura: 0,
      activo: true
    };
    this.modalPuntoAbierto.set(true);
  }

  editarPunto(p: PuntoExpedicion): void {
    this.puntoEditandoId = p.id;
    this.formPunto = {
      nombre: p.nombre,
      establecimiento: p.establecimiento,
      puntoEmision: p.puntoEmision,
      timbrado: p.timbrado || '',
      numeroInicioFactura: p.numeroInicioFactura,
      numeroFinFactura: p.numeroFinFactura,
      ultimoNumeroFactura: p.ultimoNumeroFactura,
      activo: p.activo
    };
    this.modalPuntoAbierto.set(true);
  }

  cerrarModalPunto(): void {
    this.modalPuntoAbierto.set(false);
  }

  guardarPunto(): void {
    if (!this.formPunto.nombre.trim()) return;

    this.guardandoPunto.set(true);
    const req: PuntoExpedicionRequest = {
      nombre: this.formPunto.nombre.trim(),
      establecimiento: this.formPunto.establecimiento.trim(),
      puntoEmision: this.formPunto.puntoEmision.trim(),
      timbrado: this.formPunto.timbrado?.trim() || undefined,
      numeroInicioFactura: this.formPunto.numeroInicioFactura,
      numeroFinFactura: this.formPunto.numeroFinFactura,
      ultimoNumeroFactura: this.formPunto.ultimoNumeroFactura || 0,
      activo: this.formPunto.activo ?? true
    };

    const op = this.puntoEditandoId
      ? this.puntoExpedicionService.actualizar(this.puntoEditandoId, req)
      : this.puntoExpedicionService.crear(req);

    op.subscribe({
      next: () => {
        this.guardandoPunto.set(false);
        this.cerrarModalPunto();
      },
      error: (err) => {
        this.guardandoPunto.set(false);
        const msg = err.error?.mensaje || 'Error al guardar punto de expedición.';
        this.toast.error(msg);
      }
    });
  }

  toggleEstadoPunto(p: PuntoExpedicion): void {
    if (p.enUso) {
      this.toast.warning(`No puedes desactivar el punto ${p.prefijoLegal} porque está en uso por ${p.usuarioActual}.`);
      return;
    }
    this.puntoExpedicionService.cambiarEstado(p.id, !p.activo).subscribe({
      error: (err) => {
        const msg = err.error?.mensaje || 'Error al cambiar estado del punto.';
        this.toast.error(msg);
      }
    });
  }
}
