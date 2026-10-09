import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent, ToastComponent],
  template: `
    <div class="login-page">
      <app-toast />

      <div class="login-card">
        <div class="login-header">
          <div class="brand-badge">
            <app-icon name="ice-cream" [size]="32" />
          </div>
          <h1 class="login-title">Heladería Artesanal</h1>
          <p class="login-subtitle">Sistema de Punto de Venta y Administración</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="username">Usuario</label>
            <div class="input-with-icon">
              <div class="input-icon">
                <app-icon name="user" [size]="18" />
              </div>
              <input
                id="username"
                type="text"
                formControlName="username"
                class="form-control"
                placeholder="Ej. admin"
                [class.is-invalid]="esCampoInvalido('username')"
                autocomplete="username"
              />
            </div>
            @if (esCampoInvalido('username')) {
              <div class="form-error">El usuario es requerido.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Contraseña</label>
            <div class="input-with-icon">
              <div class="input-icon">
                <app-icon name="lock" [size]="18" />
              </div>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="form-control"
                placeholder="••••••••"
                [class.is-invalid]="esCampoInvalido('password')"
                autocomplete="current-password"
              />
            </div>
            @if (esCampoInvalido('password')) {
              <div class="form-error">La contraseña es requerida.</div>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-lg w-100"
            [disabled]="loginForm.invalid || cargando()"
          >
            @if (cargando()) {
              <span>Iniciando sesión...</span>
            } @else {
              <span>Ingresar al Sistema</span>
              <app-icon name="arrow-right" [size]="18" />
            }
          </button>
        </form>

        <div class="login-footer">
          <span class="badge-version">v1.0 • Spring Boot 3 & Angular 20</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 30%, #fffbeb, #f1f5f9 70%);
      padding: 1.5rem;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: var(--bg-surface);
      border-radius: 1.25rem;
      border: 1px solid var(--border-color);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      padding: 2.25rem 2rem;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .brand-badge {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #ffffff;
      border-radius: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.35);
    }

    .login-title {
      font-size: 1.5rem;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }

    .login-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0.875rem;
      color: var(--text-muted);
      pointer-events: none;
      display: flex;
      align-items: center;
    }

    .input-with-icon .form-control {
      padding-left: 2.5rem;
    }

    .w-100 {
      width: 100%;
    }

    .login-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }

    .badge-version {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  public readonly cargando = signal<boolean>(false);

  public readonly loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  esCampoInvalido(campo: string): boolean {
    const c = this.loginForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const { username, password } = this.loginForm.value;

    this.authService.login({
      username: username!.trim(),
      password: password!
    }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.toast.success(`Bienvenido, ${res.username} (${res.rol})`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/pos';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err.error?.mensaje || err.error?.error || 'Credenciales incorrectas.';
        this.toast.error(mensaje, 'Error de Autenticación');
      }
    });
  }
}
