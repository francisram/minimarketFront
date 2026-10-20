import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ImpresorasService } from '../../core/services/impresoras.service';
import { InstitucionService } from '../../core/services/institucion.service';
import { ToastService } from '../../core/services/toast.service';
import { Impresora, TipoConexion } from '../../core/models/impresora.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-impresoras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppIconComponent, AppModalComponent],
  template: `
    <div class="impresoras-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Impresoras Térmicas ESC/POS</h1>
          <p class="page-subtitle">Administra ticketeras de red (TCP Raw), colas CUPS (Linux/Mac) e impresoras compartidas desde Windows (SMB)</p>
        </div>

        <button type="button" class="btn btn-primary" (click)="abrirModalCrear()">
          <app-icon name="plus" [size]="18" />
          <span>Nueva Impresora</span>
        </button>
      </div>

      <!-- LISTADO DE IMPRESORAS -->
      <div class="impresoras-grid">
        @if (impresorasService.cargando()) {
          <div class="loading-state">
            <app-icon name="refresh" [size]="24" />
            <span>Cargando impresoras...</span>
          </div>
        } @else if (impresorasService.impresoras().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <app-icon name="printer" [size]="48" />
            </div>
            <h3>No hay impresoras registradas</h3>
            <p>Registra tu primera impresora térmica de red, recurso compartido de Windows o servidor CUPS para emitir comandas y tickets.</p>
            <button type="button" class="btn btn-primary mt-3" (click)="abrirModalCrear()">
              Registrar Impresora
            </button>
          </div>
        } @else {
          @for (imp of impresorasService.impresoras(); track imp.id) {
            <div class="impresora-card">
              <div class="imp-top">
                <div class="imp-icon-box" [class.cups-box]="imp.tipoConexion === 'CUPS'" [class.windows-box]="imp.tipoConexion === 'WINDOWS'">
                  <app-icon name="printer" [size]="24" />
                </div>
                <div class="imp-title-block">
                  <h3 class="imp-name">{{ imp.nombre }}</h3>
                  <div class="imp-badge-type" [ngClass]="'badge-' + imp.tipoConexion.toLowerCase()">
                    {{ imp.tipoConexion === 'RED' ? 'Socket TCP Raw' : (imp.tipoConexion === 'WINDOWS' ? 'Windows Share' : 'Servidor CUPS') }}
                  </div>
                </div>
              </div>

              <div class="imp-details">
                @if (imp.tipoConexion === 'RED') {
                  <div class="detail-row">
                    <span class="detail-label">Dirección IP:</span>
                    <strong class="detail-val">{{ imp.ip || 'No asignada' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Puerto TCP:</span>
                    <span class="detail-val">{{ imp.puerto || 9100 }}</span>
                  </div>
                } @else if (imp.tipoConexion === 'WINDOWS') {
                  <div class="detail-row">
                    <span class="detail-label">Recurso UNC:</span>
                    <strong class="detail-val win-share">\\\\{{ imp.ip }}\\{{ imp.cola }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Puerto SMB:</span>
                    <span class="detail-val">{{ imp.puerto || 445 }}</span>
                  </div>
                  @if (imp.usuario) {
                    <div class="detail-row">
                      <span class="detail-label">Usuario:</span>
                      <span class="detail-val">{{ imp.usuario }}</span>
                    </div>
                  }
                } @else {
                  <div class="detail-row">
                    <span class="detail-label">Cola CUPS:</span>
                    <strong class="detail-val cups-queue">{{ imp.cola || 'No especificada' }}</strong>
                  </div>
                  @if (imp.ip) {
                    <div class="detail-row">
                      <span class="detail-label">Servidor / Host:</span>
                      <span class="detail-val">{{ imp.ip }}:{{ imp.puerto || 631 }}</span>
                    </div>
                  }
                }
              </div>

              <div class="imp-actions">
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  (click)="abrirModalPrueba(imp)"
                  title="Enviar prueba de impresión"
                >
                  <app-icon name="printer" [size]="15" />
                  <span>Probar</span>
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="abrirModalEditar(imp)"
                  title="Editar configuración"
                >
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  (click)="confirmarEliminar(imp)"
                  title="Eliminar impresora"
                >
                  <app-icon name="trash" [size]="15" />
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- ==================== MODAL FORMULARIO CREAR / EDITAR ==================== -->
      <app-modal
        [isOpen]="modalFormAbierto()"
        [title]="modoEdicion() ? 'Editar Impresora' : 'Registrar Nueva Impresora'"
        size="md"
        (close)="cerrarModalForm()"
      >
        <form [formGroup]="impresoraForm" body class="form-impresora">
          <!-- NOMBRE -->
          <div class="form-group">
            <label class="form-label" for="impNombre">Nombre de la Impresora *</label>
            <input
              id="impNombre"
              type="text"
              class="form-control"
              placeholder="Ej. Termica Mostrador"
              formControlName="nombre"
              [class.is-invalid]="esCampoInvalido('nombre') || !!erroresBackend['nombre']"
            />
            @if (erroresBackend['nombre']) {
              <div class="form-error">{{ erroresBackend['nombre'] }}</div>
            } @else if (esCampoInvalido('nombre')) {
              <div class="form-error">El nombre es requerido.</div>
            }
          </div>

          <!-- TIPO DE CONEXIÓN -->
          <div class="form-group">
            <label class="form-label">Tipo de Conexión *</label>
            <div class="type-selector">
              <button
                type="button"
                class="type-opt"
                [class.active]="tipoConexionActual === 'RED'"
                (click)="cambiarTipoConexion('RED')"
              >
                <strong>RED (Socket TCP)</strong>
                <small>Impresoras Ethernet / Wi-Fi directas (Puerto 9100)</small>
              </button>
              <button
                type="button"
                class="type-opt"
                [class.active]="tipoConexionActual === 'WINDOWS'"
                (click)="cambiarTipoConexion('WINDOWS')"
              >
                <strong>WINDOWS (Compartida SMB)</strong>
                <small>Impresora USB compartida en red desde PC Windows</small>
              </button>
              <button
                type="button"
                class="type-opt"
                [class.active]="tipoConexionActual === 'CUPS'"
                (click)="cambiarTipoConexion('CUPS')"
              >
                <strong>CUPS (Servidor Linux/Mac)</strong>
                <small>Impresoras administradas por servidor CUPS</small>
              </button>
            </div>
          </div>

          <!-- CAMPOS SEGÚN TIPO: RED -->
          @if (tipoConexionActual === 'RED') {
            <div class="form-row-2">
              <div class="form-group flex-2">
                <label class="form-label" for="impIp">Dirección IP *</label>
                <input
                  id="impIp"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 192.168.100.245"
                  formControlName="ip"
                  [class.is-invalid]="esCampoInvalido('ip') || !!erroresBackend['ip']"
                />
                @if (erroresBackend['ip']) {
                  <div class="form-error">{{ erroresBackend['ip'] }}</div>
                } @else if (esCampoInvalido('ip')) {
                  <div class="form-error">La dirección IP es requerida para modo RED.</div>
                }
              </div>

              <div class="form-group flex-1">
                <label class="form-label" for="impPuerto">Puerto TCP</label>
                <input
                  id="impPuerto"
                  type="number"
                  class="form-control"
                  placeholder="9100"
                  formControlName="puerto"
                />
              </div>
            </div>
          }

          <!-- CAMPOS SEGÚN TIPO: WINDOWS -->
          @if (tipoConexionActual === 'WINDOWS') {
            <div class="windows-helper-banner">
              <app-icon name="info" [size]="18" />
              <div>
                <strong>¿Cómo compartir en Windows?</strong>
                <p>En la PC: <em>Panel de control > Dispositivos e impresoras > Propiedades > pestaña Compartir > Marcar "Compartir esta impresora"</em> y colocar un recurso corto (ej. <code>TERMICA</code>).</p>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group flex-2">
                <label class="form-label" for="impWinIp">IP o Nombre de la PC Windows *</label>
                <input
                  id="impWinIp"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 192.168.1.100 o PC-CAJA"
                  formControlName="ip"
                  [class.is-invalid]="esCampoInvalido('ip') || !!erroresBackend['ip']"
                />
                @if (erroresBackend['ip']) {
                  <div class="form-error">{{ erroresBackend['ip'] }}</div>
                } @else if (esCampoInvalido('ip')) {
                  <div class="form-error">La IP o nombre del equipo Windows es requerida.</div>
                }
              </div>

              <div class="form-group flex-1">
                <label class="form-label" for="impWinPuerto">Puerto SMB</label>
                <input
                  id="impWinPuerto"
                  type="number"
                  class="form-control"
                  placeholder="445"
                  formControlName="puerto"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="impWinCola">Nombre del Recurso Compartido (Share) *</label>
              <input
                id="impWinCola"
                type="text"
                class="form-control"
                placeholder="Ej. TERMICA o POS58"
                formControlName="cola"
                [class.is-invalid]="esCampoInvalido('cola') || !!erroresBackend['cola']"
              />
              @if (erroresBackend['cola']) {
                <div class="form-error">{{ erroresBackend['cola'] }}</div>
              } @else if (esCampoInvalido('cola')) {
                <div class="form-error">El recurso compartido es requerido.</div>
              }
              <small class="field-hint">Es el nombre asignado al compartir en Windows (Ruta: <code>\\\\IP\\RECURSO</code>).</small>
            </div>

            <div class="credentials-box">
              <div class="credentials-header">
                <label class="form-label mb-0">Credenciales de Windows (Opcionales)</label>
                <small class="text-muted">Solo si Windows exige usuario/contraseña para acceder a la impresora</small>
              </div>
              <div class="form-row-2">
                <div class="form-group flex-1">
                  <label class="form-label" for="impWinUser">Usuario</label>
                  <input
                    id="impWinUser"
                    type="text"
                    class="form-control"
                    placeholder="Ej. Cajero o Invitado"
                    formControlName="usuario"
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="impWinPass">Contraseña</label>
                  <input
                    id="impWinPass"
                    type="password"
                    class="form-control"
                    [placeholder]="modoEdicion() ? 'Dejar en blanco para conservar' : 'Opcional'"
                    formControlName="password"
                  />
                </div>
              </div>
            </div>
          }

          <!-- CAMPOS SEGÚN TIPO: CUPS -->
          @if (tipoConexionActual === 'CUPS') {
            <div class="form-group">
              <label class="form-label" for="impCola">Nombre de Cola CUPS *</label>
              <input
                id="impCola"
                type="text"
                class="form-control"
                placeholder="Ej. FTX_TDRO58U o EPSON_TM_T20"
                formControlName="cola"
                [class.is-invalid]="esCampoInvalido('cola') || !!erroresBackend['cola']"
              />
              @if (erroresBackend['cola']) {
                <div class="form-error">{{ erroresBackend['cola'] }}</div>
              } @else if (esCampoInvalido('cola')) {
                <div class="form-error">La cola es requerida para conexión CUPS.</div>
              }
              <small class="field-hint">Nombre exacto con el que fue dada de alta en CUPS ('lpstat -p').</small>
            </div>

            <div class="form-row-2">
              <div class="form-group flex-2">
                <label class="form-label" for="impCupsIp">Host / Servidor CUPS (Opcional)</label>
                <input
                  id="impCupsIp"
                  type="text"
                  class="form-control"
                  placeholder="Ej. localhost o 192.168.1.50"
                  formControlName="ip"
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label" for="impCupsPuerto">Puerto CUPS</label>
                <input
                  id="impCupsPuerto"
                  type="number"
                  class="form-control"
                  placeholder="631"
                  formControlName="puerto"
                />
              </div>
            </div>
          }
        </form>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModalForm()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="guardarImpresora()"
            [disabled]="impresoraForm.invalid || guardando()"
          >
            @if (guardando()) {
              <span>Guardando...</span>
            } @else {
              <span>{{ modoEdicion() ? 'Actualizar Impresora' : 'Crear Impresora' }}</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL DE PRUEBA DE IMPRESIÓN ==================== -->
      <app-modal
        [isOpen]="modalPruebaAbierto()"
        [title]="'Prueba de Impresión: ' + (impresoraSeleccionada()?.nombre || '')"
        size="md"
        (close)="modalPruebaAbierto.set(false)"
      >
        <div body class="prueba-body">
          <p class="prueba-info">
            Envía una prueba de impresión ESC/POS para verificar la conectividad de la ticketera.
          </p>

          <div class="form-group">
            <label class="form-label" for="textoPrueba">Contenido del Ticket</label>
            <textarea
              id="textoPrueba"
              class="form-control"
              rows="5"
              [(ngModel)]="textoPrueba"
              style="font-family: monospace;"
            ></textarea>
          </div>

          <div class="form-check logo-check-row">
            <label class="check-label" [class.text-muted]="!tieneLogo">
              <input type="checkbox" [(ngModel)]="incluirLogoPrueba" [disabled]="!tieneLogo" />
              <span>Incluir logotipo del negocio</span>
            </label>
            @if (tieneLogo) {
              <span class="badge-logo-ok">
                <app-icon name="check" [size]="14" />
                Logo configurado
              </span>
            } @else {
              <span class="badge-logo-none">
                Sin logo configurado
              </span>
            }
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalPruebaAbierto.set(false)">
            Cerrar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="ejecutarPruebaImpresion()"
            [disabled]="enviandoPrueba()"
          >
            @if (enviandoPrueba()) {
              <span>Enviando al dispositivo...</span>
            } @else {
              <app-icon name="printer" [size]="16" />
              <span>Despachar Impresión</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- ==================== MODAL CONFIRMAR ELIMINACIÓN ==================== -->
      <app-modal
        [isOpen]="modalEliminarAbierto()"
        title="Eliminar Impresora"
        size="sm"
        (close)="modalEliminarAbierto.set(false)"
      >
        <div body>
          @if (impresoraAEliminar()) {
            <p>¿Seguro que deseas eliminar la impresora <strong>{{ impresoraAEliminar()?.nombre }}</strong>?</p>
            <p class="text-muted mt-2" style="font-size: 0.8125rem;">
              Nota: Si está asignada a una ticketera activa, la API rechazará la acción con Conflicto 409.
            </p>
          }
        </div>
        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalEliminarAbierto.set(false)">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" (click)="ejecutarEliminacion()">
            Eliminar
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .impresoras-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    /* GRID IMPRESORAS */
    .impresoras-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--border-color);
    }

    .empty-icon {
      color: var(--text-light);
      margin-bottom: 1rem;
    }

    .loading-state {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem;
      color: var(--text-muted);
    }

    .impresora-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
      transition: all 0.15s;
    }

    .impresora-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--border-focus);
    }

    .imp-top {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 1.125rem;
    }

    .imp-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .imp-icon-box.cups-box {
      background: #fdf4ff;
      color: #c026d3;
    }

    .imp-icon-box.windows-box {
      background: #e0f2fe;
      color: #0284c7;
    }

    .imp-title-block {
      flex: 1;
      min-width: 0;
    }

    .imp-name {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.2rem;
    }

    .imp-badge-type {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
    }

    .badge-red {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-cups {
      background: #fae8ff;
      color: #86198f;
    }

    .badge-windows {
      background: #e0f2fe;
      color: #0369a1;
    }

    .imp-details {
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      padding: 0.75rem 0.875rem;
      margin-bottom: 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
    }

    .detail-label {
      color: var(--text-muted);
    }

    .detail-val {
      color: var(--text-main);
      font-family: monospace;
    }

    .cups-queue {
      color: #7c2d12;
      font-weight: 700;
    }

    .win-share {
      color: #0369a1;
      font-weight: 700;
      word-break: break-all;
    }

    .imp-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    /* FORM MODAL */
    .form-impresora {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .type-selector {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    @media (max-width: 640px) {
      .type-selector {
        grid-template-columns: 1fr;
      }
    }

    .windows-helper-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-md);
      padding: 0.75rem;
      font-size: 0.8125rem;
      color: #1e40af;
      line-height: 1.4;
    }

    .windows-helper-banner p {
      margin: 0.25rem 0 0;
      font-size: 0.78rem;
      color: #1d4ed8;
    }

    .credentials-box {
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      padding: 0.85rem;
      border: 1px dashed var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .credentials-header {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .mb-0 { margin-bottom: 0 !important; }

    .type-opt {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 0.85rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }

    .type-opt:hover {
      border-color: var(--primary);
    }

    .type-opt.active {
      border-color: var(--primary);
      background: #fffbeb;
    }

    .type-opt small {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .form-row-2 {
      display: flex;
      gap: 0.875rem;
    }

    .flex-2 { flex: 2; }
    .flex-1 { flex: 1; }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
      display: block;
    }

    .prueba-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .prueba-info {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .form-check {
      display: flex;
      align-items: center;
    }

    .logo-check-row {
      justify-content: space-between;
      gap: 1rem;
      background: #f8fafc;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .check-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .check-label.text-muted {
      color: var(--text-muted);
      cursor: not-allowed;
    }

    .badge-logo-ok {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #15803d;
      background: #dcfce7;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .badge-logo-none {
      font-size: 0.75rem;
      color: var(--text-muted);
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class ImpresorasComponent implements OnInit {
  public readonly impresorasService = inject(ImpresorasService);
  public readonly institucionService = inject(InstitucionService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  public readonly modalFormAbierto = signal<boolean>(false);
  public readonly modoEdicion = signal<boolean>(false);
  public readonly guardando = signal<boolean>(false);

  public readonly modalPruebaAbierto = signal<boolean>(false);
  public readonly impresoraSeleccionada = signal<Impresora | null>(null);
  public textoPrueba: string = '';
  public incluirLogoPrueba: boolean = false;
  public readonly enviandoPrueba = signal<boolean>(false);

  public readonly modalEliminarAbierto = signal<boolean>(false);
  public readonly impresoraAEliminar = signal<Impresora | null>(null);

  // Mapeo dinámico de errores 400 devueltos por el backend
  public erroresBackend: Record<string, string> = {};

  public impresoraForm!: FormGroup;

  get tieneLogo(): boolean {
    const logo = this.institucionService.institucion()?.logoBase64;
    return !!(logo && logo.trim().length > 0);
  }

  ngOnInit(): void {
    this.initForm();
    this.impresorasService.cargarImpresoras();
    this.institucionService.cargarInstitucion();
  }

  private initForm(): void {
    this.impresoraForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required]],
      tipoConexion: ['RED' as TipoConexion, [Validators.required]],
      ip: [''],
      puerto: [9100],
      cola: [''],
      usuario: [''],
      password: ['']
    });

    this.actualizarValidadoresPorTipo('RED');
  }

  get tipoConexionActual(): TipoConexion {
    return this.impresoraForm.get('tipoConexion')?.value || 'RED';
  }

  cambiarTipoConexion(tipo: TipoConexion): void {
    const defaultPuerto = tipo === 'RED' ? 9100 : (tipo === 'WINDOWS' ? 445 : 631);
    this.impresoraForm.patchValue({
      tipoConexion: tipo,
      puerto: defaultPuerto
    });
    this.actualizarValidadoresPorTipo(tipo);
  }

  private actualizarValidadoresPorTipo(tipo: TipoConexion): void {
    const ipControl = this.impresoraForm.get('ip');
    const colaControl = this.impresoraForm.get('cola');

    if (tipo === 'RED') {
      ipControl?.setValidators([Validators.required]);
      colaControl?.clearValidators();
      colaControl?.setValue('');
    } else if (tipo === 'WINDOWS') {
      ipControl?.setValidators([Validators.required]);
      colaControl?.setValidators([Validators.required]);
    } else {
      // CUPS: cola es obligatoria
      colaControl?.setValidators([Validators.required]);
      ipControl?.clearValidators();
    }

    ipControl?.updateValueAndValidity();
    colaControl?.updateValueAndValidity();
  }

  esCampoInvalido(campo: string): boolean {
    const c = this.impresoraForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  abrirModalCrear(): void {
    this.erroresBackend = {};
    this.modoEdicion.set(false);
    this.impresoraForm.reset({
      id: null,
      nombre: '',
      tipoConexion: 'RED',
      ip: '',
      puerto: 9100,
      cola: '',
      usuario: '',
      password: ''
    });
    this.actualizarValidadoresPorTipo('RED');
    this.modalFormAbierto.set(true);
  }

  abrirModalEditar(imp: Impresora): void {
    this.erroresBackend = {};
    this.modoEdicion.set(true);
    const tipo = (imp.tipoConexion?.toUpperCase() as TipoConexion) || 'RED';
    const defaultPuerto = tipo === 'RED' ? 9100 : (tipo === 'WINDOWS' ? 445 : 631);
    this.impresoraForm.patchValue({
      id: imp.id,
      nombre: imp.nombre,
      tipoConexion: tipo,
      ip: imp.ip || '',
      puerto: imp.puerto || defaultPuerto,
      cola: imp.cola || '',
      usuario: imp.usuario || '',
      password: ''
    });
    this.actualizarValidadoresPorTipo(tipo);
    this.modalFormAbierto.set(true);
  }

  cerrarModalForm(): void {
    this.modalFormAbierto.set(false);
  }

  guardarImpresora(): void {
    if (this.impresoraForm.invalid) {
      this.impresoraForm.markAllAsTouched();
      return;
    }

    this.erroresBackend = {};
    this.guardando.set(true);
    const val = this.impresoraForm.value;

    const impresora: Impresora = {
      nombre: val.nombre,
      tipoConexion: val.tipoConexion,
      ip: val.ip,
      puerto: val.puerto,
      cola: val.cola,
      usuario: val.usuario,
      password: val.password || null
    };

    const request$ = this.modoEdicion() && val.id
      ? this.impresorasService.actualizar(val.id, impresora)
      : this.impresorasService.crear(impresora);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModalForm();
      },
      error: (err) => {
        this.guardando.set(false);
        if (err.status === 400 && err.error?.campos) {
          // Mapear campos devueltos por el backend directamente a inputs
          this.erroresBackend = err.error.campos;
          this.toast.warning('Por favor, corrige los campos señalados.', 'Error de validación');
        } else {
          const mensaje = err.error?.mensaje || err.error?.error || 'No se pudo guardar la impresora.';
          this.toast.error(mensaje);
        }
      }
    });
  }

  // --- PRUEBA DE IMPRESIÓN ---
  abrirModalPrueba(imp: Impresora): void {
    this.impresoraSeleccionada.set(imp);
    const inst = this.institucionService.institucion();
    const nombreNegocio = inst?.nombre?.trim() || 'Heladería Artesanal';
    const fecha = new Date().toLocaleString();
    this.textoPrueba = `*** PRUEBA DE IMPRESION ***\n${nombreNegocio}\nDispositivo: ${imp.nombre}\nFecha: ${fecha}\nEstado: OK\n***************************\n\n\n`;
    this.incluirLogoPrueba = this.tieneLogo;
    this.modalPruebaAbierto.set(true);
  }

  ejecutarPruebaImpresion(): void {
    const imp = this.impresoraSeleccionada();
    if (!imp || !imp.id) return;

    this.enviandoPrueba.set(true);
    this.impresorasService.probarImpresion(imp.id, {
      texto: this.textoPrueba,
      incluirLogo: this.incluirLogoPrueba
    }).subscribe({
      next: () => {
        this.enviandoPrueba.set(false);
        this.modalPruebaAbierto.set(false);
      },
      error: () => {
        // El servicio ya capturó el 503 en texto plano y mostró el toast
        this.enviandoPrueba.set(false);
      }
    });
  }

  // --- ELIMINAR ---
  confirmarEliminar(imp: Impresora): void {
    this.impresoraAEliminar.set(imp);
    this.modalEliminarAbierto.set(true);
  }

  ejecutarEliminacion(): void {
    const imp = this.impresoraAEliminar();
    if (!imp || !imp.id) return;

    this.impresorasService.eliminar(imp.id).subscribe({
      next: () => {
        this.modalEliminarAbierto.set(false);
        this.impresoraAEliminar.set(null);
      },
      error: () => {
        this.modalEliminarAbierto.set(false);
      }
    });
  }
}
