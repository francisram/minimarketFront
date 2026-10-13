export type EstadoSesionCaja = 'ABIERTA' | 'CERRADA';

export interface EstadoCaja {
  abierta: boolean;
  sesionId?: number | null;
  cajeroApertura?: string | null;
  fechaApertura?: string | null;
  montoInicial?: number | null;
}

export interface ResumenCaja {
  sesionId?: number;
  estado?: EstadoSesionCaja;
  usuarioApertura?: string;
  fechaApertura?: string;
  montoInicial?: number;
  totalEfectivo?: number;
  totalTarjetaDebito?: number;
  totalTarjetaCredito?: number;
  totalTransferenciaQr?: number;
  totalVentas?: number;
  totalEsperadoEfectivo?: number;
  totalEsperadoTarjeta?: number;
  totalPedidos?: number;
  cantidadVouchers?: number;
  cantidadTransferencias?: number;
}

export interface SesionCaja {
  id: number;
  estado: EstadoSesionCaja;
  usuarioApertura: string;
  usuarioCierre?: string | null;
  fechaApertura: string;
  fechaCierre?: string | null;
  montoInicial: number;
  montoEsperadoEfectivo?: number;
  montoRealEfectivo?: number | null;
  diferencia?: number | null;
  montoRealTarjeta?: number | null;
  diferenciaTarjeta?: number | null;
  montoRealTransferenciaQr?: number | null;
  diferenciaTransferenciaQr?: number | null;
  totalVentasEfectivo?: number;
  totalVentasTarjetaDebito?: number;
  totalVentasTarjetaCredito?: number;
  totalVentasTransferenciaQr?: number;
  totalVentasGeneral?: number;
  cantidadPedidos?: number;
  observacionesApertura?: string | null;
  observacionesCierre?: string | null;
}

export interface AbrirCajaRequest {
  montoInicial: number;
  observaciones?: string;
}

export interface CerrarCajaRequest {
  montoRealEfectivo: number;
  montoRealTarjeta?: number | null;
  montoRealTransferenciaQr?: number | null;
  observaciones?: string;
  sesionId?: number;
}

