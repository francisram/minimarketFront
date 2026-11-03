export interface LicenciaEstado {
  estado: 'SIN_LICENCIA' | 'PERPETUA' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDA';
  planNombre: string | null;
  fechaVencimiento: string | null;
  diasRestantes: number | null;
  mensaje: string;
  relojRetrocedido: boolean;
  detalleReloj: string | null;
  ultimaFechaVista: string | null;
}
