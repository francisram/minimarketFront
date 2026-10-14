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
