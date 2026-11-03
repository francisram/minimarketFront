import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

/**
 * Cierra la sesión tras un rato sin actividad del usuario (clic, teclado, mouse, toque, scroll).
 * Sin esto, la renovación automática del token mantendría viva para siempre una pestaña abandonada.
 *
 * Minutos de inactividad: administradores/propietarios 15, el resto (cajeros) 30. Un minuto antes de cerrar
 * se muestra un aviso con cuenta regresiva. La actividad en una pestaña cuenta para todas.
 */
@Injectable({ providedIn: 'root' })
export class InactividadService {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly zone = inject(NgZone);

  private static readonly CLAVE_ACTIVIDAD = 'ultima_actividad';
  /** Solo para pruebas: minutos de inactividad que reemplazan a los de cada rol (localStorage). */
  private static readonly CLAVE_MINUTOS_PRUEBA = 'inactividad_minutos_prueba';
  private static readonly AVISO_MS = 60_000;
  private static readonly EVENTOS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel', 'click'] as const;

  private ultimaLocal = Date.now();
  private ultimaGuardada = 0;
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private readonly alActividad = () => this.registrarActividad();

  /** Segundos que faltan para el cierre, o null si no hay aviso en pantalla. */
  private readonly _segundosRestantes = signal<number | null>(null);
  public readonly segundosRestantes = this._segundosRestantes.asReadonly();
  public readonly avisoVisible = computed(() => this._segundosRestantes() !== null);

  iniciar(): void {
    if (this.intervalo) {
      return;
    }
    this.ultimaLocal = Date.now();
    this.guardarActividad(true);
    // Fuera de la zona de Angular: mousemove dispararía detección de cambios constantemente
    this.zone.runOutsideAngular(() => {
      InactividadService.EVENTOS.forEach(e => document.addEventListener(e, this.alActividad, { passive: true }));
      this.intervalo = setInterval(() => this.zone.run(() => this.revisar()), 1000);
    });
  }

  detener(): void {
    InactividadService.EVENTOS.forEach(e => document.removeEventListener(e, this.alActividad));
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
    this._segundosRestantes.set(null);
  }

  /** El usuario pidió seguir conectado desde el aviso. */
  continuar(): void {
    this._segundosRestantes.set(null);
    this.ultimaLocal = Date.now();
    this.guardarActividad(true);
  }

  /** Cierra la sesión ahora (botón del aviso o fin de la cuenta regresiva). */
  cerrarAhora(porInactividad = false): void {
    this.detener();
    this.auth.logout(true);
    if (porInactividad) {
      this.toast.warning('Tu sesión se cerró por inactividad.', 'Sesión cerrada');
    }
  }

  private registrarActividad(): void {
    // Con el aviso en pantalla solo el botón "Seguir conectado" cuenta: un roce del mouse no debe taparlo
    if (this._segundosRestantes() !== null) {
      return;
    }
    this.ultimaLocal = Date.now();
    this.guardarActividad(false);
  }

  /** Comparte la última actividad con otras pestañas (como mucho cada 5 s para no saturar el almacenamiento). */
  private guardarActividad(forzar: boolean): void {
    const ahora = Date.now();
    if (!forzar && ahora - this.ultimaGuardada < 5_000) {
      return;
    }
    this.ultimaGuardada = ahora;
    try {
      localStorage.setItem(InactividadService.CLAVE_ACTIVIDAD, String(ahora));
    } catch {}
  }

  private actividadDeOtrasPestanas(): number {
    try {
      return Number(localStorage.getItem(InactividadService.CLAVE_ACTIVIDAD)) || 0;
    } catch {
      return 0;
    }
  }

  private limiteMs(): number {
    try {
      const prueba = Number(localStorage.getItem(InactividadService.CLAVE_MINUTOS_PRUEBA));
      if (prueba > 0) {
        return prueba * 60_000;
      }
    } catch {}
    return (this.auth.isAdminOrOwner() ? 15 : 30) * 60_000;
  }

  private revisar(): void {
    if (!this.auth.isAuthenticated()) {
      this.detener();
      return;
    }
    const limite = this.limiteMs();
    const ultima = Math.max(this.ultimaLocal, this.actividadDeOtrasPestanas());
    const inactivoMs = Date.now() - ultima;

    // Otra pestaña tuvo actividad: se descarta un aviso que estuviera a punto de cerrar esta
    if (this._segundosRestantes() !== null && inactivoMs < limite - InactividadService.AVISO_MS) {
      this._segundosRestantes.set(null);
      return;
    }
    if (inactivoMs >= limite) {
      this.cerrarAhora(true);
    } else if (inactivoMs >= limite - InactividadService.AVISO_MS) {
      this._segundosRestantes.set(Math.max(Math.ceil((limite - inactivoMs) / 1000), 0));
    }
  }
}
