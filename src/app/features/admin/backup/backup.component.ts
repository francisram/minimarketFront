import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackupService } from '../../../core/services/backup.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../../shared/components/icon/icon.component';
import { BackupInfo } from '../../../core/models/backup.model';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, DatePipe],
  template: `
    <div class="backup-page">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div class="header-titles">
          <div class="header-icon-box">
            <app-icon name="database" [size]="26" />
          </div>
          <div>
            <h1 class="page-title">Copias de Seguridad y Restauración</h1>
            <p class="page-subtitle">
              Gestión integral de snapshots y recuperación ante desastres para PostgreSQL (HeladeriaDB)
            </p>
          </div>
        </div>

        <div class="header-badges">
          <div class="sys-badge">
            <span class="badge-dot dot-online"></span>
            <span class="badge-text">PostgreSQL 16 Alpine</span>
          </div>
          <div class="sys-badge">
            <app-icon name="server" [size]="14" />
            <span class="badge-text">Base: heladeriadb</span>
          </div>
          <div class="sys-badge count-badge">
            <span class="badge-text">{{ backupService.respaldos().length }} respaldos locales</span>
          </div>
        </div>
      </div>

      <!-- GRID DE ACCIONES PRINCIPALES (2 CARDS HERO) -->
      <div class="actions-grid">
        <!-- CARD 1: GENERAR RESPALDO -->
        <div class="action-card generate-card">
          <div class="card-icon-banner">
            <app-icon name="database" [size]="28" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Generar Respaldo Integral</h2>
            <p class="card-desc">
              Crea un volcado completo de la base de datos (ventas, pedidos, stock, sesiones de caja, clientes, talonarios SET y usuarios) en formato binario comprimido de PostgreSQL (<code class="code-tag">.dump</code>).
            </p>

            <div class="card-features">
              <div class="feature-item">
                <app-icon name="check" [size]="16" class="feature-icon" />
                <span>Formato Custom comprimido (pg_dump -Fc)</span>
              </div>
              <div class="feature-item">
                <app-icon name="check" [size]="16" class="feature-icon" />
                <span>Integridad referencial y secuencias fiscales 100% preservadas</span>
              </div>
              <div class="feature-item">
                <app-icon name="check" [size]="16" class="feature-icon" />
                <span>Descarga automática al equipo al finalizar</span>
              </div>
            </div>

            <div class="card-actions">
              <button 
                type="button" 
                class="btn btn-primary btn-generate" 
                [disabled]="backupService.generandoBackup() || backupService.restaurando()"
                (click)="crearRespaldo()"
              >
                @if (backupService.generandoBackup()) {
                  <span class="spinner-sm"></span>
                  <span>Generando copia de seguridad...</span>
                } @else {
                  <app-icon name="download" [size]="18" />
                  <span>Generar y Descargar Respaldo Ahora</span>
                }
              </button>
            </div>
          </div>
        </div>

        <!-- CARD 2: RESTAURAR DESDE ARCHIVO -->
        <div class="action-card restore-card">
          <div class="card-icon-banner restore-banner">
            <app-icon name="upload" [size]="28" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Restaurar Base de Datos</h2>
            <p class="card-desc">
              Sube un archivo de respaldo previo (<code class="code-tag">.dump</code> o <code class="code-tag">.sql</code>) para restablecer la base de datos completa al estado exacto contenido en dicho archivo.
            </p>

            <!-- DROPZONE O INPUT FILE -->
            <div 
              class="dropzone" 
              [class.has-file]="archivoSeleccionado()" 
              (dragover)="onDragOver($event)" 
              (dragleave)="onDragLeave($event)" 
              (drop)="onDrop($event)"
            >
              @if (!archivoSeleccionado()) {
                <label for="fileUploadInput" class="dropzone-label">
                  <app-icon name="upload" [size]="32" class="dropzone-icon" />
                  <span class="dropzone-prompt">Arrastra un archivo aquí o <span class="highlight">haz clic para examinar</span></span>
                  <span class="dropzone-hint">Formatos compatibles: .dump (pg_dump custom) o .sql</span>
                </label>
                <input 
                  id="fileUploadInput" 
                  type="file" 
                  accept=".dump,.sql" 
                  class="sr-only" 
                  (change)="onFileSelected($event)" 
                />
              } @else {
                <div class="selected-file-info">
                  <div class="file-icon-box">
                    <app-icon name="database" [size]="24" />
                  </div>
                  <div class="file-text-details">
                    <span class="file-name">{{ archivoSeleccionado()?.name }}</span>
                    <span class="file-size">{{ formatearBytes(archivoSeleccionado()?.size || 0) }}</span>
                  </div>
                  <button type="button" class="btn-remove-file" (click)="quitarArchivoSeleccionado()" title="Quitar archivo">
                    <app-icon name="x" [size]="18" />
                  </button>
                </div>
              }
            </div>

            <!-- ADVERTENCIA DE SEGURIDAD -->
            <div class="warning-alert">
              <app-icon name="alert-triangle" [size]="18" class="warning-icon" />
              <span>
                <strong>Atención:</strong> La restauración sobrescribirá los datos actuales con los del archivo seleccionado. Se solicitará confirmación estricta.
              </span>
            </div>

            <div class="card-actions">
              <button 
                type="button" 
                class="btn btn-danger btn-restore" 
                [disabled]="!archivoSeleccionado() || backupService.restaurando() || backupService.generandoBackup()"
                (click)="abrirModalRestaurarArchivoLocal()"
              >
                <app-icon name="rotate-ccw" [size]="18" />
                <span>Restaurar Base de Datos con este Archivo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN TABLA: HISTORIAL DE RESPALDOS EN EL SERVIDOR -->
      <div class="history-card">
        <div class="history-header">
          <div class="history-header-left">
            <h3 class="history-title">
              <app-icon name="server" [size]="20" />
              <span>Respaldos Almacenados en el Servidor</span>
            </h3>
            <span class="history-subtitle">Copias de seguridad guardadas en el volumen persistente de la API</span>
          </div>

          <button 
            type="button" 
            class="btn btn-secondary btn-refresh" 
            [disabled]="backupService.cargando()"
            (click)="cargarRespaldos()"
            title="Refrescar lista"
          >
            <app-icon name="refresh" [size]="16" [extraClass]="backupService.cargando() ? 'spin' : ''" />
            <span>Actualizar</span>
          </button>
        </div>

        <div class="history-body">
          @if (backupService.cargando() && backupService.respaldos().length === 0) {
            <div class="empty-state">
              <span class="spinner-md"></span>
              <p>Consultando historial de copias de seguridad...</p>
            </div>
          } @else if (backupService.respaldos().length === 0) {
            <div class="empty-state">
              <div class="empty-icon-box">
                <app-icon name="database" [size]="36" />
              </div>
              <h4 class="empty-title">No hay copias de seguridad en el servidor</h4>
              <p class="empty-desc">
                Aún no se han generado respaldos o fueron eliminados. Puedes presionar "Generar y Descargar Respaldo Ahora" para crear el primer snapshot del sistema.
              </p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nombre del Archivo</th>
                    <th>Fecha y Hora</th>
                    <th>Tamaño</th>
                    <th>Tipo / Formato</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of backupService.respaldos(); track item.nombreArchivo) {
                    <tr>
                      <td class="font-medium text-main">
                        <div class="file-cell">
                          <app-icon name="database" [size]="18" class="cell-icon" />
                          <span class="cell-filename">{{ item.nombreArchivo }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="date-text">{{ item.fechaCreacion | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                      </td>
                      <td>
                        <span class="badge-size">{{ item.tamanoLegible }}</span>
                      </td>
                      <td>
                        <span class="badge-format">PostgreSQL Custom Dump</span>
                      </td>
                      <td class="text-right">
                        <div class="row-actions">
                          <button 
                            type="button" 
                            class="action-btn btn-dl" 
                            (click)="descargar(item.nombreArchivo)" 
                            title="Descargar copia al equipo"
                          >
                            <app-icon name="download" [size]="16" />
                            <span>Descargar</span>
                          </button>
                          
                          <button 
                            type="button" 
                            class="action-btn btn-rt" 
                            [disabled]="backupService.restaurando() || backupService.generandoBackup()"
                            (click)="abrirModalRestaurarServidor(item)" 
                            title="Restaurar base de datos a este punto"
                          >
                            <app-icon name="rotate-ccw" [size]="16" />
                            <span>Restaurar</span>
                          </button>

                          <button 
                            type="button" 
                            class="action-btn btn-del" 
                            [disabled]="backupService.restaurando() || backupService.generandoBackup()"
                            (click)="eliminar(item.nombreArchivo)" 
                            title="Eliminar este respaldo del servidor"
                          >
                            <app-icon name="trash" [size]="16" />
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

      <!-- MODAL DE CONFIRMACIÓN ESTRICTA DE RESTAURACIÓN -->
      @if (modalRestaurarVisible()) {
        <div class="modal-backdrop">
          <div class="modal-container">
            <div class="modal-header modal-header-danger">
              <div class="modal-icon-title">
                <app-icon name="alert-triangle" [size]="24" class="text-danger" />
                <h3 class="modal-title">Confirmar Restauración de Base de Datos</h3>
              </div>
              @if (!backupService.restaurando()) {
                <button type="button" class="btn-close-modal" (click)="cerrarModalRestaurar()">
                  <app-icon name="x" [size]="20" />
                </button>
              }
            </div>

            <div class="modal-body">
              <div class="danger-callout">
                <p class="callout-lead">
                  ¡Atención! Esta es una <strong>operación destructiva e irreversible</strong>.
                </p>
                <p class="callout-desc">
                  La base de datos actual (<code class="code-tag">heladeriadb</code>) será completamente limpiada y reescrita con los datos del respaldo seleccionado:
                </p>
                <div class="target-file-pill">
                  <app-icon name="database" [size]="16" />
                  <strong>{{ archivoRestauracionNombre() }}</strong>
                  <span class="file-source">({{ modoRestauracion() === 'LOCAL' ? 'Archivo Local' : 'Respaldo del Servidor' }})</span>
                </div>
              </div>

              <div class="confirmation-challenge">
                <label for="confirmInput" class="challenge-label">
                  Para proceder, escribe exactamente la palabra <strong class="text-danger">RESTAURAR</strong>:
                </label>
                <input 
                  id="confirmInput"
                  type="text" 
                  class="form-control challenge-input" 
                  [(ngModel)]="textoConfirmacion" 
                  [disabled]="backupService.restaurando()"
                  placeholder="Escribe RESTAURAR" 
                  autocomplete="off"
                />
              </div>

              @if (backupService.restaurando()) {
                <div class="restoration-progress">
                  <span class="spinner-md"></span>
                  <div class="progress-details">
                    <strong class="progress-title">Restaurando base de datos con pg_restore...</strong>
                    <span class="progress-sub">Por favor no recargues ni cierres el navegador mientras finaliza el proceso.</span>
                  </div>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary" 
                [disabled]="backupService.restaurando()"
                (click)="cerrarModalRestaurar()"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                class="btn btn-danger btn-confirm-restore" 
                [disabled]="textoConfirmacion().trim() !== 'RESTAURAR' || backupService.restaurando()"
                (click)="ejecutarRestauracion()"
              >
                @if (backupService.restaurando()) {
                  <span class="spinner-sm"></span>
                  <span>Restaurando...</span>
                } @else {
                  <app-icon name="rotate-ccw" [size]="18" />
                  <span>Sobrescribir y Restaurar Base de Datos</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .backup-page {
      padding: 1.5rem;
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    /* HEADER */
    .page-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.25rem;
      background: var(--card-bg, #ffffff);
      padding: 1.5rem;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .header-titles {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
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
      margin-top: 0.25rem;
    }

    .header-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
    }

    .sys-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #334155;
      border: 1px solid #e2e8f0;
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-online {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .count-badge {
      background: #e0f2fe;
      color: #0369a1;
      border-color: #bae6fd;
    }

    /* GRID HERO CARDS */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      background: var(--card-bg, #ffffff);
      border-radius: 14px;
      border: 1px solid var(--border-color, #e2e8f0);
      padding: 1.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .card-icon-banner {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .restore-banner {
      background: #fef2f2;
      color: #dc2626;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .card-desc {
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 1.25rem 0;
    }

    .code-tag {
      background: #f1f5f9;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8125rem;
      color: #0369a1;
    }

    .card-features {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      margin-bottom: 1.5rem;
      background: #f8fafc;
      padding: 1rem;
      border-radius: 10px;
      border: 1px dashed #cbd5e1;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #334155;
    }

    .feature-icon {
      color: #10b981;
      flex-shrink: 0;
    }

    /* DROPZONE */
    .dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
      padding: 1.25rem;
      text-align: center;
      background: #f8fafc;
      margin-bottom: 1rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .dropzone:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dropzone.has-file {
      border-color: #10b981;
      background: #f0fdf4;
      padding: 0.75rem 1rem;
    }

    .dropzone-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
    }

    .dropzone-icon {
      color: #64748b;
    }

    .dropzone-prompt {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .highlight {
      color: #2563eb;
      text-decoration: underline;
    }

    .dropzone-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .selected-file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .file-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #dcfce7;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .file-text-details {
      display: flex;
      flex-direction: column;
      text-align: left;
      flex-grow: 1;
      overflow: hidden;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.75rem;
      color: #64748b;
    }

    .btn-remove-file {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .btn-remove-file:hover {
      color: #ef4444;
      background: #fee2e2;
    }

    /* WARNING ALERT */
    .warning-alert {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      line-height: 1.4;
      margin-bottom: 1.25rem;
    }

    .warning-icon {
      color: #d97706;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .card-actions {
      margin-top: auto;
    }

    .btn-generate, .btn-restore {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-generate {
      background: #0284c7;
      color: #ffffff;
      border: none;
    }

    .btn-generate:hover:not(:disabled) {
      background: #0369a1;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
    }

    .btn-restore {
      background: #dc2626;
      color: #ffffff;
      border: none;
    }

    .btn-restore:hover:not(:disabled) {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
    }

    /* HISTORIAL CARD */
    .history-card {
      background: var(--card-bg, #ffffff);
      border-radius: 14px;
      border: 1px solid var(--border-color, #e2e8f0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #fafafa;
    }

    .history-header-left {
      display: flex;
      flex-direction: column;
    }

    .history-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .history-subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 0.875rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
    }

    .btn-refresh:hover:not(:disabled) {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* TABLA */
    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 0.875rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .data-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    .data-table tr:hover {
      background: #f8fafc;
    }

    .file-cell {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .cell-icon {
      color: #0284c7;
    }

    .cell-filename {
      font-family: monospace;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f172a;
    }

    .date-text {
      color: #475569;
      font-size: 0.8125rem;
    }

    .badge-size {
      background: #e2e8f0;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .badge-format {
      background: #f1f5f9;
      color: #475569;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .row-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-dl {
      background: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
    }

    .btn-dl:hover {
      background: #dcfce7;
      color: #14532d;
    }

    .btn-rt {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }

    .btn-rt:hover:not(:disabled) {
      background: #fef3c7;
      color: #92400e;
    }

    .btn-del {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
      padding: 0.375rem;
    }

    .btn-del:hover:not(:disabled) {
      background: #fee2e2;
      color: #991b1b;
    }

    /* EMPTY STATE */
    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .empty-icon-box {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .empty-desc {
      font-size: 0.875rem;
      color: #64748b;
      max-width: 480px;
      margin: 0;
      line-height: 1.5;
    }

    /* MODAL DE CONFIRMACIÓN */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1rem;
    }

    .modal-container {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      animation: modalFadeIn 0.2s ease-out;
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header-danger {
      background: #fef2f2;
      border-bottom-color: #fee2e2;
    }

    .modal-icon-title {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #991b1b;
      margin: 0;
    }

    .btn-close-modal {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .btn-close-modal:hover {
      color: #0f172a;
      background: rgba(0, 0, 0, 0.05);
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .danger-callout {
      background: #fff1f2;
      border: 1px solid #ffe4e6;
      border-radius: 10px;
      padding: 1rem;
      color: #9f1239;
    }

    .callout-lead {
      font-weight: 700;
      font-size: 0.9375rem;
      margin: 0 0 0.5rem 0;
    }

    .callout-desc {
      font-size: 0.8125rem;
      line-height: 1.5;
      margin: 0 0 0.75rem 0;
      color: #881337;
    }

    .target-file-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1px solid #fecdd3;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-family: monospace;
      color: #9f1239;
    }

    .file-source {
      font-size: 0.75rem;
      color: #94a3b8;
      font-family: sans-serif;
    }

    .confirmation-challenge {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .challenge-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }

    .challenge-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      text-transform: uppercase;
      box-sizing: border-box;
    }

    .challenge-input:focus {
      outline: none;
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
    }

    .restoration-progress {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1rem;
      border-radius: 10px;
    }

    .progress-details {
      display: flex;
      flex-direction: column;
    }

    .progress-title {
      font-size: 0.875rem;
      color: #1e40af;
    }

    .progress-sub {
      font-size: 0.75rem;
      color: #3b82f6;
    }

    .modal-footer {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .btn-confirm-restore {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #dc2626;
      color: #ffffff;
      border: none;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .btn-confirm-restore:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-confirm-restore:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* SPINNERS */
    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    .spinner-md {
      width: 24px;
      height: 24px;
      border: 3px solid #cbd5e1;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    .text-danger {
      color: #dc2626;
    }

    .text-right {
      text-align: right;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  `]
})
export class BackupComponent implements OnInit {
  readonly backupService = inject(BackupService);
  private readonly toast = inject(ToastService);

  readonly archivoSeleccionado = signal<File | null>(null);

  // Estados del modal de confirmación
  readonly modalRestaurarVisible = signal<boolean>(false);
  readonly modoRestauracion = signal<'LOCAL' | 'SERVIDOR'>('LOCAL');
  readonly archivoRestauracionNombre = signal<string>('');
  readonly textoConfirmacion = signal<string>('');

  ngOnInit(): void {
    this.cargarRespaldos();
  }

  cargarRespaldos(): void {
    this.backupService.listarRespaldos().subscribe();
  }

  crearRespaldo(): void {
    this.backupService.crearRespaldo().subscribe();
  }

  descargar(nombreArchivo: string): void {
    this.backupService.descargarRespaldo(nombreArchivo);
  }

  eliminar(nombreArchivo: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la copia '${nombreArchivo}' del servidor?`)) {
      this.backupService.eliminarRespaldo(nombreArchivo).subscribe();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.procesarArchivo(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  private procesarArchivo(file: File): void {
    if (!file.name.endsWith('.dump') && !file.name.endsWith('.sql')) {
      this.toast.error('Formato no soportado. Por favor selecciona un archivo con extensión .dump o .sql');
      return;
    }
    this.archivoSeleccionado.set(file);
  }

  quitarArchivoSeleccionado(): void {
    this.archivoSeleccionado.set(null);
  }

  abrirModalRestaurarArchivoLocal(): void {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.modoRestauracion.set('LOCAL');
    this.archivoRestauracionNombre.set(file.name);
    this.textoConfirmacion.set('');
    this.modalRestaurarVisible.set(true);
  }

  abrirModalRestaurarServidor(item: BackupInfo): void {
    this.modoRestauracion.set('SERVIDOR');
    this.archivoRestauracionNombre.set(item.nombreArchivo);
    this.textoConfirmacion.set('');
    this.modalRestaurarVisible.set(true);
  }

  cerrarModalRestaurar(): void {
    if (this.backupService.restaurando()) return;
    this.modalRestaurarVisible.set(false);
    this.textoConfirmacion.set('');
  }

  ejecutarRestauracion(): void {
    if (this.textoConfirmacion().trim() !== 'RESTAURAR') return;

    if (this.modoRestauracion() === 'LOCAL') {
      const file = this.archivoSeleccionado();
      if (!file) return;

      this.backupService.restaurarDesdeArchivo(file).subscribe({
        next: () => {
          this.cerrarModalRestaurar();
          this.quitarArchivoSeleccionado();
        }
      });
    } else {
      const nombre = this.archivoRestauracionNombre();
      this.backupService.restaurarDesdeServidor(nombre).subscribe({
        next: () => {
          this.cerrarModalRestaurar();
        }
      });
    }
  }

  formatearBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
