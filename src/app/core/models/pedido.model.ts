import { Presentacion } from './presentacion.model';
import { Sabor } from './sabor.model';
import { Topping } from './topping.model';
import { ProductoSimple } from './producto-simple.model';

export type TipoEntrega = 'MOSTRADOR' | 'TAKE_AWAY' | 'DELIVERY';
export type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA_QR';
export type EstadoPedido = 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
export type TipoItem = 'HELADO' | 'PRODUCTO_SIMPLE';

export interface ItemPedidoRequest {
  tipoItem: TipoItem;
  presentacionId?: number;
  saborIds?: number[];
  toppingIds?: number[];
  productoSimpleId?: number;
  cantidad: number;
}

export interface CrearPedidoRequest {
  clienteNombre?: string;
  tipoEntrega: TipoEntrega;
  metodoPago: MetodoPago;
  notas?: string;
  items: ItemPedidoRequest[];
}

export interface DetallePedido {
  id?: number;
  tipoItem: TipoItem;
  presentacion?: Presentacion;
  sabores?: Sabor[];
  toppings?: Topping[];
  productoSimple?: ProductoSimple;
  cantidad: number;
  subtotal?: number;
}

export interface Pedido {
  id: number;
  clienteNombre?: string;
  tipoEntrega: TipoEntrega;
  metodoPago: MetodoPago;
  estado: EstadoPedido;
  notas?: string;
  total: number;
  fecha?: string;
  items?: DetallePedido[];
  detalles?: DetallePedido[];
  createdAt?: string;
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
}
