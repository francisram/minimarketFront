import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstitucionService } from '../../core/services/institucion.service';
import { ToastService } from '../../core/services/toast.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { Institucion } from '../../core/models/institucion.model';

@Component({
  selector: 'app-institucion',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
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
                <input
                  id="rucNegocio"
                  type="text"
                  class="form-control"
                  placeholder="Ej. 80099887-1"
                  [(ngModel)]="ruc"
                  name="ruc"
                />
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
                <small class="field-hint">El backend genera automáticamente el correlativo sucesivo.</small>
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
    </div>
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

    @media (max-width: 640px) {
      .form-grid {
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
  private readonly toast = inject(ToastService);

  public nombre: string = '';
  public ruc: string = '';
  public timbrado: string = '';
  public timbradoVencimiento: string = '';
  public establecimiento: string = '001';
  public puntoEmision: string = '001';
  public ultimoNumeroFactura: number = 0;
  public direccion: string = '';
  public telefono: string = '';
  public ciudad: string = 'Asunción';

  public readonly logoBase64 = signal<string>('');
  public readonly guardando = signal<boolean>(false);

  ngOnInit(): void {
    const inst = this.institucionService.institucion();
    this.cargarDatos(inst);

    this.institucionService.obtenerInstitucion().subscribe((datos: Institucion) => {
      this.cargarDatos(datos);
    });
  }

  private cargarDatos(inst: Institucion): void {
    if (!inst) return;
    this.nombre = inst.nombre || '';
    this.ruc = inst.ruc || '';
    this.timbrado = inst.timbrado || '';
    this.timbradoVencimiento = inst.timbradoVencimiento || '';
    this.establecimiento = inst.establecimiento || '001';
    this.puntoEmision = inst.puntoEmision || '001';
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

  guardar(): void {
    if (!this.nombre.trim()) return;

    this.guardando.set(true);
    this.institucionService.actualizar({
      nombre: this.nombre,
      logoBase64: this.logoBase64(),
      ruc: this.ruc,
      timbrado: this.timbrado,
      timbradoVencimiento: this.timbradoVencimiento,
      establecimiento: this.establecimiento,
      puntoEmision: this.puntoEmision,
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
}
