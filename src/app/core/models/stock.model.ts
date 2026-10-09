export type TipoItemStock = 'PRODUCTO' | 'SABOR' | 'ENVASE';
export type EstadoAlertaStock = 'BAJO' | 'AGOTADO' | 'BAJO_STOCK';

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
