export interface BackupInfo {
  nombreArchivo: string;
  tamanoBytes: number;
  tamanoLegible: string;
  fechaCreacion: string;
}

export interface BackupResponse {
  exitoso: boolean;
  mensaje: string;
  backup?: BackupInfo;
}

export interface EstadoRespaldo {
  ultimoRespaldo: BackupInfo | null;
  horasDesdeUltimoRespaldo: number | null;
  ultimaEjecucionProgramada: string | null;
  resultadoProgramado: 'OK' | 'ERROR' | null;
  detalleProgramado: string | null;
  fechaVerificacion: string | null;
  resultadoVerificacion: 'OK' | 'ERROR' | null;
  nivelVerificacion: 'COMPLETA' | 'INTEGRIDAD' | null;
  detalleVerificacion: string | null;
  copiaExternaConfigurada: boolean;
  fechaCopiaExterna: string | null;
  resultadoCopiaExterna: 'OK' | 'ERROR' | 'NO_CONFIGURADA' | null;
  detalleCopiaExterna: string | null;
  alertas: string[];
  advertencias: string[];
  requiereAtencion: boolean;
}
