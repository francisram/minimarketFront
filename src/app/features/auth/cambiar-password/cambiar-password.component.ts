import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent, ToastComponent],
  template: `
    <div class="password-page">
      <app-toast />

      <div class="password-card">
        <div class="card-header-custom">
          <div class="icon-circle">
            <app-icon name="lock" [size]="28" />
          </div>
          <h2>Cambio de Contraseña</h2>
          <p class="subtitle">Actualiza tu contraseña para mantener la seguridad de tu cuenta.</p>
        </div>

        <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="passwordActual">Contraseña Actual</label>
            <input
              id="passwordActual"
              type="password"
              formControlName="passwordActual"
              class="form-control"
              placeholder="Ingresa tu contraseña actual"
              [class.is-invalid]="esInvalido('passwordActual')"
            />
            @if (esInvalido('passwordActual')) {
              <div class="form-error">La contraseña actual es requerida.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="nuevaPassword">Nueva Contraseña</label>
            <input
              id="nuevaPassword"
              type="password"
              formControlName="nuevaPassword"
              class="form-control"
              placeholder="Mínimo 6 caracteres"
              [class.is-invalid]="esInvalido('nuevaPassword')"
            />
            @if (esInvalido('nuevaPassword')) {
              <div class="form-error">Debe tener al menos 6 caracteres.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmarPassword">Confirmar Nueva Contraseña</label>
            <input
              id="confirmarPassword"
              type="password"
              formControlName="confirmarPassword"
              class="form-control"
              placeholder="Repite la nueva contraseña"
              [class.is-invalid]="esInvalido('confirmarPassword') || passwordsNoCoinciden()"
            />
            @if (passwordsNoCoinciden()) {
              <div class="form-error">Las nuevas contraseñas no coinciden.</div>
            }
          </div>

          <div class="actions">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="cancelar()"
              [disabled]="cargando()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="passwordForm.invalid || passwordsNoCoinciden() || cargando()"
            >
              @if (cargando()) {
                <span>Actualizando...</span>
              } @else {
                <span>Guardar Nueva Contraseña</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .password-page {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .password-card {
      width: 100%;
      max-width: 480px;
      background: var(--bg-surface);
      border-radius: 1.25rem;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      padding: 2.25rem 2rem;
    }

    .card-header-custom {
      text-align: center;
      margin-bottom: 2rem;
    }

    .icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary-subtle);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.75rem;
    }
  `]
})
export class CambiarPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  public readonly cargando = signal<boolean>(false);

  public readonly passwordForm = this.fb.group({
    passwordActual: ['', [Validators.required]],
    nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]]
  });

  esInvalido(campo: string): boolean {
    const c = this.passwordForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  passwordsNoCoinciden(): boolean {
    const nueva = this.passwordForm.get('nuevaPassword')?.value;
    const confirm = this.passwordForm.get('confirmarPassword')?.value;
    return !!(nueva && confirm && nueva !== confirm);
  }

  cancelar(): void {
    this.router.navigate(['/pos']);
  }

  onSubmit(): void {
    if (this.passwordForm.invalid || this.passwordsNoCoinciden()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const { passwordActual, nuevaPassword } = this.passwordForm.value;

    this.authService.cambiarPassword({
      passwordActual: passwordActual!,
      nuevaPassword: nuevaPassword!
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.toast.success('Contraseña actualizada con éxito.');
        this.router.navigate(['/pos']);
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err.error?.mensaje || err.error?.error || 'No se pudo cambiar la contraseña. Verifica la contraseña actual.';
        this.toast.error(mensaje);
      }
    });
  }
}
