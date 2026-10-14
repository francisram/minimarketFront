import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BackupInfo, BackupResponse } from '../models/backup.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  public readonly respaldos = signal<BackupInfo[]>([]);
  public readonly cargando = signal<boolean>(false);
  public readonly generandoBackup = signal<boolean>(false);
  public readonly restaurando = signal<boolean>(false);

  listarRespaldos(): Observable<BackupInfo[]> {
    this.cargando.set(true);
    return this.http.get<BackupInfo[]>(`${this.apiUrl}/api/backup/listar`).pipe(
      tap(lista => this.respaldos.set(lista || [])),
      catchError(err => {
        const msg = err.error?.mensaje || 'Error al obtener las copias de seguridad del servidor.';
        this.toast.error(msg);
        return throwError(() => err);
      }),
      finalize(() => this.cargando.set(false))
    );
  }

  crearRespaldo(): Observable<BackupResponse> {
    this.generandoBackup.set(true);
    return this.http.post<BackupResponse>(`${this.apiUrl}/api/backup/crear`, {}).pipe(
      tap(res => {
        if (res.exitoso && res.backup) {
          this.toast.success(res.mensaje || 'Copia de seguridad generada exitosamente.');
          this.respaldos.update(prev => [res.backup!, ...prev]);
          // Descargar automáticamente el respaldo recién generado
          this.descargarRespaldo(res.backup.nombreArchivo);
        }
      }),
      catchError(err => {
        const msg = err.error?.mensaje || 'Error al generar la copia de seguridad.';
        this.toast.error(msg);
        return throwError(() => err);
      }),
      finalize(() => this.generandoBackup.set(false))
    );
  }

  descargarRespaldo(nombreArchivo: string): void {
    this.http.get(`${this.apiUrl}/api/backup/descargar/${encodeURIComponent(nombreArchivo)}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        const msg = err.error?.mensaje || 'Error al descargar el archivo de respaldo.';
        this.toast.error(msg);
      }
    });
  }

  eliminarRespaldo(nombreArchivo: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/backup/${encodeURIComponent(nombreArchivo)}`).pipe(
      tap(() => {
        this.toast.success(`Copia '${nombreArchivo}' eliminada correctamente.`);
        this.respaldos.update(prev => prev.filter(b => b.nombreArchivo !== nombreArchivo));
      }),
      catchError(err => {
        const msg = err.error?.mensaje || 'Error al eliminar el archivo de respaldo.';
        this.toast.error(msg);
        return throwError(() => err);
      })
    );
  }

  restaurarDesdeArchivo(archivo: File): Observable<BackupResponse> {
    this.restaurando.set(true);
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<BackupResponse>(`${this.apiUrl}/api/backup/restaurar`, formData).pipe(
      tap(res => {
        if (res.exitoso) {
          this.toast.success(res.mensaje || 'Base de datos restaurada correctamente.');
          this.listarRespaldos().subscribe();
        }
      }),
      catchError(err => {
        const msg = err.error?.mensaje || 'Fallo durante la restauración de la base de datos.';
        this.toast.error(msg, 'Error Crítico de Restauración');
        return throwError(() => err);
      }),
      finalize(() => this.restaurando.set(false))
    );
  }

  restaurarDesdeServidor(nombreArchivo: string): Observable<BackupResponse> {
    this.restaurando.set(true);
    return this.http.post<BackupResponse>(`${this.apiUrl}/api/backup/restaurar-servidor/${encodeURIComponent(nombreArchivo)}`, {}).pipe(
      tap(res => {
        if (res.exitoso) {
          this.toast.success(res.mensaje || 'Base de datos restaurada correctamente desde el servidor.');
          this.listarRespaldos().subscribe();
        }
      }),
      catchError(err => {
        const msg = err.error?.mensaje || 'Fallo durante la restauración de la base de datos.';
        this.toast.error(msg, 'Error Crítico de Restauración');
        return throwError(() => err);
      }),
      finalize(() => this.restaurando.set(false))
    );
  }
}
