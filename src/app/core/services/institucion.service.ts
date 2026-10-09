import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Institucion } from '../models/institucion.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class InstitucionService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly institucion = signal<Institucion>({
    nombre: 'Heladería Artesanal',
    logoBase64: ''
  });
  public readonly cargando = signal<boolean>(false);

  cargarInstitucion(): void {
    this.cargando.set(true);
    this.http.get<Institucion>(`${this.apiUrl}/institucion`).pipe(
      catchError(() => {
        // Fallback a /api/institucion
        return this.http.get<Institucion>(`${this.apiUrl}/api/institucion`).pipe(
          catchError(() => of({ nombre: 'Heladería Artesanal', logoBase64: '' }))
        );
      })
    ).subscribe({
      next: (data) => {
        if (data) {
          this.institucion.set(data);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  actualizar(datos: { nombre: string; logoBase64?: string }): Observable<Institucion> {
    // Asegurar que logoBase64 no incluya el prefijo "data:image/...;base64,"
    let cleanLogo = datos.logoBase64 || '';
    if (cleanLogo.includes('base64,')) {
      cleanLogo = cleanLogo.split('base64,')[1];
    }

    const payload: Institucion = {
      nombre: datos.nombre.trim(),
      logoBase64: cleanLogo
    };

    return this.http.put<Institucion>(`${this.apiUrl}/institucion`, payload).pipe(
      tap(actualizado => {
        this.institucion.set(actualizado || payload);
        this.toast.success('Datos del negocio actualizados correctamente.');
      })
    );
  }
}
