export type EstadoTrabajoImpresion = 'PENDIENTE' | 'IMPRIMIENDO' | 'IMPRESO' | 'MUERTO';

export interface TrabajoImpresion {
  id: number;
  tipo: string;
  referenciaId: number;
  impresoraId?: number | null;
  estado: EstadoTrabajoImpresion;
  intentos: number;
  maxIntentos: number;
  proximoIntento: string;
  ultimoError?: string | null;
  usuario?: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export type ResumenTrabajosImpresion = Record<EstadoTrabajoImpresion, number>;
