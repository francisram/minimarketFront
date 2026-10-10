import { Presentacion } from './presentacion.model';
import { Sabor } from './sabor.model';
import { Topping } from './topping.model';
import { ProductoSimple } from './producto-simple.model';
import { TipoIva } from './tipo-iva.model';

export type TipoEntrega = 'MOSTRADOR' | 'TAKE_AWAY' | 'DELIVERY';
export type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA_QR';
export type EstadoPedido = 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
export type TipoItem = 'HELADO' | 'PRODUCTO_SIMPLE';
export type TipoComprobante = 'TICKET' | 'FACTURA';
export type CondicionVenta = 'CONTADO' | 'CREDITO';

export interface ItemPedidoRequest {
  tipoItem: TipoItem;
  presentacionId?: number;
  saborIds?: number[];
  toppingIds?: number[];
  productoSimpleId?: number;
  cantidad: number;
  tipoIva?: TipoIva;
}

export interface CrearPedidoRequest {
  clienteNombre?: string;
  tipoEntrega: TipoEntrega;
  metodoPago: MetodoPago;
  numeroVoucher?: string;
  notas?: string;
  items: ItemPedidoRequest[];
  tipoComprobante?: TipoComprobante;
  condicionVenta?: CondicionVenta;
  clienteRuc?: string;
  clienteDireccion?: string;
  impresoraId?: number;
}

export interface DetallePedido {
  id?: number;
  tipoItem: TipoItem;
  presentacion?: Presentacion;
  sabores?: Sabor[];
  toppings?: Topping[];
  productoSimple?: ProductoSimple;
  cantidad: number;
  precioUnitario?: number;
  precio?: number;
  subtotal?: number;
  tipoIva?: TipoIva;
}

export interface Pedido {
  id: number;
  clienteNombre?: string;
  tipoEntrega: TipoEntrega;
  metodoPago: MetodoPago;
  numeroVoucher?: string;
  estado: EstadoPedido;
  notas?: string;
  total: number;
  fecha?: string;
  fechaCreacion?: string;
  items?: DetallePedido[];
  detalles?: DetallePedido[];
  createdAt?: string;
  tipoComprobante?: TipoComprobante;
  condicionVenta?: CondicionVenta;
  clienteRuc?: string;
  clienteDireccion?: string;
  numeroFactura?: string;
  sesionCajaId?: number;
  totalExentas?: number;
  totalGravada5?: number;
  totalGravada10?: number;
  totalIva5?: number;
  totalIva10?: number;
  totalIva?: number;
}

export interface ItemTicketLocal {
  idLocal: string;
  tipoItem: TipoItem;
  presentacion?: Presentacion;
  sabores: Sabor[];
  toppings: Topping[];
  productoSimple?: ProductoSimple;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  tipoIva?: TipoIva;
}

