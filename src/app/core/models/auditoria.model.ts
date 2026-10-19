export interface AuditoriaLog {
  id: number;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
  entidadId?: number | null;
  entidadNombre?: string | null;
  detalle: string;
  ipOrigen?: string | null;
}

export interface ResumenAuditoria {
  totalEventos: number;
  totalUsuarios: number;
  totalModificaciones: number;
  totalBajasOAnulaciones: number;
}

export interface FiltrosAuditoria {
  fechaDesde?: string;
  fechaHasta?: string;
  usuario?: string;
  modulo?: string;
  accion?: string;
  buscar?: string;
}
