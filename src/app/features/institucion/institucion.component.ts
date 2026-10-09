import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstitucionService } from '../../core/services/institucion.service';
import { ToastService } from '../../core/services/toast.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-institucion',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="institucion-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Datos del Negocio y Marca</h1>
          <p class="page-subtitle">Personaliza el nombre de la heladería y el logotipo impreso en tickets y comandas</p>
        </div>
      </div>

      <div class="institucion-card">
        <form (ngSubmit)="guardar()" class="institucion-form">
          <!-- NOMBRE -->
          <div class="form-group">
            <label class="form-label" for="nombreNegocio">Nombre de la Heladería *</label>
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

          <!-- LOGOTIPO -->
          <div class="form-group">
            <label class="form-label">Logotipo de la Empresa</label>
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
                Se enviará a la API en formato Base64 puro sin prefijo de esquema.
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
      max-width: 720px;
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
      gap: 1.5rem;
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
  `]
})
export class InstitucionComponent implements OnInit {
  public readonly institucionService = inject(InstitucionService);
  private readonly toast = inject(ToastService);

  public nombre: string = '';
  public readonly logoBase64 = signal<string>('');
  public readonly guardando = signal<boolean>(false);

  ngOnInit(): void {
    const inst = this.institucionService.institucion();
    this.nombre = inst.nombre || '';
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
          // Extraer base64 puro sin prefijo "data:image/...;base64,"
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
      logoBase64: this.logoBase64()
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
