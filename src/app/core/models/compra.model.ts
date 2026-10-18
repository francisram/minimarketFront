import { TipoArticulo, TipoIva, UnidadMedida } from './producto.model';

export type CondicionCompra = 'CONTADO' | 'CREDITO';
export type EstadoCompra = 'REGISTRADA' | 'ANULADA';

export interface DetalleCompra {
  id?: number;
  productoId: number;
  productoNombre: string;
  codigoBarra?: string;
  tipoArticulo?: TipoArticulo;
  unidadMedida?: UnidadMedida;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  tipoIva: TipoIva;
  montoIva: number;
}

export interface Compra {
  id: number;
  proveedorId: number;
  proveedorRazonSocial: string;
  proveedorRuc: string;
  numeroFactura: string;
  timbrado?: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  condicionCompra: CondicionCompra;
  estado: EstadoCompra;
  totalExenta: number;
  totalIva5: number;
  totalIva10: number;
  total: number;
  observacion?: string;
  usuario?: string;
  fechaCreacion?: string;
  detalles: DetalleCompra[];
}

export interface RegistroDetalleCompraRequest {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  tipoIva: TipoIva;
}

export interface RegistroCompraRequest {
  proveedorId: number;
  numeroFactura: string;
  timbrado?: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  condicionCompra: CondicionCompra;
  observacion?: string;
  detalles: RegistroDetalleCompraRequest[];
}
