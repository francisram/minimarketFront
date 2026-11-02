import { PuntoExpedicion } from './punto-expedicion.model';

export type EstadoSesionCaja = 'ABIERTA' | 'CERRADA';

export type TipoMovimientoCaja = 'EGRESO' | 'INGRESO';

export type CategoriaMovimientoCaja =
  | 'GASTO_MENOR'
  | 'RETIRO_EFECTIVO'
  | 'PAGO_PROVEEDOR'
  | 'CAMBIO_SENCILLO'
  | 'OTRO_EGRESO'
  | 'INGRESO_EXTRA'
  | 'DEVOLUCION_GASTO'
  | 'OTRO_INGRESO';

export interface MovimientoCaja {
  id: number;
  sesionId: number;
  tipo: TipoMovimientoCaja;
  categoria: CategoriaMovimientoCaja;
  concepto: string;
  comprobante?: string | null;
  monto: number;
  usuario: string;
  fecha: string;
}

export interface RegistrarMovimientoCajaRequest {
  sesionId?: number;
  tipo: TipoMovimientoCaja;
  categoria: CategoriaMovimientoCaja;
  concepto: string;
  comprobante?: string;
  monto: number;
}

export interface EstadoCaja {
  abierta: boolean;
  sesionId?: number | null;
  cajeroApertura?: string | null;
  fechaApertura?: string | null;
  montoInicial?: number | null;
  puntoExpedicion?: PuntoExpedicion | null;
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
  totalIngresosCaja?: number;
  totalEgresosCaja?: number;
  movimientos?: MovimientoCaja[];
  totalEsperadoEfectivo?: number;
  totalEsperadoTarjeta?: number;
  totalPedidos?: number;
  cantidadVouchers?: number;
  cantidadTransferencias?: number;
  puntoExpedicion?: PuntoExpedicion;
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
  totalIngresosCaja?: number;
  totalEgresosCaja?: number;
  movimientos?: MovimientoCaja[];
  puntoExpedicion?: PuntoExpedicion;
  cantidadPedidos?: number;
  observacionesApertura?: string | null;
  observacionesCierre?: string | null;
}

export interface AbrirCajaRequest {
  montoInicial: number;
  observaciones?: string;
  puntoExpedicionId?: number;
}

export interface CerrarCajaRequest {
  montoRealEfectivo: number;
  montoRealTarjeta?: number | null;
  montoRealTransferenciaQr?: number | null;
  observaciones?: string;
  sesionId?: number;
}
