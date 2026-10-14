export type TipoItemStock = 'PRODUCTO' | 'SABOR' | 'ENVASE';
export type EstadoAlertaStock = 'BAJO' | 'AGOTADO' | 'BAJO_STOCK';

export type TipoMovimientoStock =
  | 'ENTRADA_COMPRA'
  | 'ENTRADA_PRODUCCION'
  | 'SALIDA_VENTA'
  | 'SALIDA_MERMA'
  | 'AJUSTE_INVENTARIO'
  | 'REINTEGRO_CANCELACION';

export interface ItemAlertaStock {
  id: number;
  nombre: string;
  tipo: TipoItemStock;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
  estadoAlerta: EstadoAlertaStock;
  disponible: boolean;
}

export interface ReporteAlertasStock {
  productosBajoStock: ItemAlertaStock[];
  saboresBajoStock: ItemAlertaStock[];
  presentacionesBajoStock: ItemAlertaStock[];
  totalAlertas: number;
  totalAgotados: number;
  totalBajoStock: number;
}

export interface AjusteStockPresentacion {
  stock: number;
  stockMinimo?: number;
}

export interface AjusteStockSabor {
  stockKilos: number;
  stockMinimoKilos?: number;
}

export interface AjusteStockProducto {
  stock: number;
  stockMinimo?: number;
}

export interface MovimientoStock {
  id: number;
  fecha: string;
  tipoItem: TipoItemStock;
  itemId: number;
  itemNombre: string;
  tipoMovimiento: TipoMovimientoStock;
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  motivo?: string;
  usuario?: string;
  costoUnitario?: number;
  unidad: string;
}

export interface RegistrarMovimientoRequest {
  tipoItem: TipoItemStock;
  itemId: number;
  tipoMovimiento: TipoMovimientoStock;
  cantidad: number;
  motivo?: string;
  costoUnitario?: number;
}

export interface ValorizacionItem {
  id: number;
  nombre: string;
  tipoItem: TipoItemStock;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
  precioUnitario: number;
  totalValorizado: number;
  estadoStock: 'OPTIMO' | 'BAJO' | 'AGOTADO';
}

export interface ReporteValorizacion {
  totalValorizadoGeneral: number;
  totalArticulos: number;
  totalAgotados: number;
  totalBajoMinimo: number;
  items: ValorizacionItem[];
}

export interface KpisInventario {
  totalEntradas: number;
  totalSalidasVenta: number;
  totalMermas: number;
  totalAjustes: number;
  totalMovimientos: number;
  valorTotalStock: number;
}

export interface ArticuloInventario {
  id: number;
  nombre: string;
  tipoItem: TipoItemStock;
  stockActual: number;
  unidad: string;
  precio: number;
}
