export type PresetFecha = 'hoy' | 'ayer' | '7dias' | 'esteMes' | 'mesAnterior' | 'personalizado';

export interface FiltroReportes {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface FiltroVentas extends FiltroReportes {
  metodoPago?: string;
  tipoComprobante?: string;
  tipoEntrega?: string;
  cajero?: string;
}

export interface FiltroCajas extends FiltroReportes {
  usuario?: string;
}

export interface VentaDiariaDTO {
  fecha: string;
  total: number;
  cantidadPedidos: number;
}

export interface ItemRankingDTO {
  id: number;
  nombre: string;
  tipo: string;
  cantidad: number;
  totalRecaudado: number;
  porcentajeTotal?: number;
}

export interface SaborRankingDTO {
  id: number;
  nombre: string;
  categoria: string;
  cantidadElecciones: number;
  kilosEstimados: number;
  porcentajeTotal?: number;
}

export interface DashboardReporteDTO {
  periodoInicio: string;
  periodoFin: string;
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  totalEfectivo: number;
  totalTarjetaDebito: number;
  totalTarjetaCredito: number;
  totalTransferenciaQr: number;
  totalFacturas: number;
  totalTickets: number;
  totalExentas: number;
  totalGravada5: number;
  totalIva5: number;
  totalGravada10: number;
  totalIva10: number;
  totalIva: number;
  topProductos: ItemRankingDTO[];
  topSabores: SaborRankingDTO[];
  ventasPorDia: VentaDiariaDTO[];
}

export interface PedidoResumenReporteDTO {
  id: number;
  fechaCreacion: string;
  clienteNombre?: string;
  clienteRuc?: string;
  tipoComprobante: string;
  condicionVenta: string;
  numeroFactura?: string;
  numeroVoucher?: string;
  metodoPago: string;
  tipoEntrega: string;
  total: number;
  cajero?: string;
  estado: string;
}

export interface ReporteVentasDTO {
  periodoInicio: string;
  periodoFin: string;
  totalVentas: number;
  cantidadVentas: number;
  resumenMetodosPago: Record<string, number>;
  pedidos: PedidoResumenReporteDTO[];
}

export interface ItemLibroIvaDTO {
  pedidoId: number;
  fecha: string;
  tipoComprobante: string;
  condicionVenta: string;
  numeroComprobante: string;
  clienteRuc: string;
  clienteNombre: string;
  exentas: number;
  gravada5: number;
  iva5: number;
  gravada10: number;
  iva10: number;
  totalIva: number;
  total: number;
}

export interface LibroVentasIvaDTO {
  periodoInicio: string;
  periodoFin: string;
  totalExentas: number;
  totalGravada5: number;
  totalIva5: number;
  totalGravada10: number;
  totalIva10: number;
  totalIva: number;
  granTotal: number;
  cantidadComprobantes: number;
  items: ItemLibroIvaDTO[];
}

export interface SesionCajaReporteDTO {
  id: number;
  cajeroApertura: string;
  usuarioCierre?: string;
  fechaApertura: string;
  fechaCierre?: string;
  montoInicial: number;
  montoEsperadoEfectivo: number;
  montoRealEfectivo: number;
  diferencia: number;
  totalVentasGeneral: number;
  cantidadPedidos: number;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface ReporteCajasDTO {
  periodoInicio: string;
  periodoFin: string;
  totalSesiones: number;
  totalVentasGeneral: number;
  totalSobrante: number;
  totalFaltante: number;
  sesiones: SesionCajaReporteDTO[];
}

export interface RankingProductosDTO {
  periodoInicio: string;
  periodoFin: string;
  topPresentaciones: ItemRankingDTO[];
  topProductosSimples: ItemRankingDTO[];
  topSabores: SaborRankingDTO[];
  topToppings: ItemRankingDTO[];
}
