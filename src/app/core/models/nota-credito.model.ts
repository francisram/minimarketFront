export interface LineaFacturaNC {
  detalleId: number;
  descripcion: string;
  cantidad: number;
  cantidadAcreditada: number;
  cantidadDisponible: number;
  precioUnitario: number;
  subtotal: number;
  tipoIva: string;
}

export interface LineaNotaCredito {
  detalleId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  tipoIva: string;
}

export interface NotaCredito {
  id: number;
  numero: string;
  timbrado: string;
  timbradoVencimiento?: string;
  fecha: string;
  motivo: string;
  reintegraStock: boolean;
  usuario: string;
  autorizadoPor?: string;
  pedidoId: number;
  facturaNumero: string;
  facturaTimbrado?: string;
  clienteNombre?: string;
  clienteRuc?: string;
  totalExentas: number;
  totalGravada5: number;
  totalGravada10: number;
  totalIva5: number;
  totalIva10: number;
  totalIva: number;
  total: number;
  lineas: LineaNotaCredito[];
  egresoCajaRegistrado: boolean;
}

export interface FacturaParaNotaCredito {
  pedidoId: number;
  numeroFactura: string;
  timbrado?: string;
  fecha: string;
  clienteNombre?: string;
  clienteRuc?: string;
  metodoPago?: string;
  estado: string;
  total: number;
  puntoExpedicionId?: number;
  serieConfigurada: boolean;
  serieVencimiento?: string;
  lineas: LineaFacturaNC[];
  notasCredito: NotaCredito[];
}

export interface EmitirNotaCreditoRequest {
  motivo: string;
  items: { detalleId: number; cantidad: number }[];
  reintegrarStock: boolean;
  adminPassword?: string;
}

export interface SerieNotaCredito {
  puntoExpedicionId?: number;
  timbrado: string;
  timbradoInicio?: string | null;
  timbradoVencimiento?: string | null;
  numeroInicio?: number | null;
  numeroFin?: number | null;
  ultimoNumero?: number | null;
}
