import { TipoIva } from './tipo-iva.model';
export type { TipoIva };

export type TipoArticulo = 'VENTA_DIRECTA' | 'ENVASE' | 'SABOR' | 'TOPPING' | 'INSUMO' | 'ELABORADO' | 'COMBO' | 'SERVICIO' | 'ACTIVO_FIJO';

export type UnidadMedida = 'UNIDAD' | 'KG' | 'LITRO' | 'GRAMO';

export type CategoriaSabor = 'CREMA' | 'FRUTAL' | 'CHOCOLATE' | 'DULCE_DE_LECHE' | 'ESPECIAL';

export interface ProveedorVinculado {
  proveedorId: number;
  ruc: string;
  razonSocial: string;
  contacto?: string | null;
  telefono?: string | null;
  codigoReferencia?: string | null;
  costoCompra?: number | null;
  esPrincipal: boolean;
}

export interface AsignarProveedorRequest {
  proveedorId: number;
  codigoReferencia?: string | null;
  costoCompra?: number | null;
  esPrincipal?: boolean;
}

export interface ComboComponente {
  id?: number;
  comboId?: number;
  componenteId: number;
  componenteNombre?: string;
  componenteSku?: string;
  componenteTipo?: TipoArticulo;
  componentePrecioCosto?: number;
  componentePrecioVenta?: number;
  costoUnitario?: number;
  precioUnitario?: number;
  cantidad: number;
  notas?: string | null;
}

export interface Producto {
  id: number;
  codigoBarra?: string | null;
  sku?: string | null;
  nombre: string;
  descripcion?: string | null;
  tipoArticulo: TipoArticulo;
  precioVenta: number;
  precioCosto?: number | null;
  tipoIva: TipoIva;
  stock: number;
  stockMinimo: number;
  unidadMedida: UnidadMedida;
  activo: boolean;

  // Específico ENVASE
  maxSabores?: number | null;
  pesoGramosAprox?: number | null;

  // Específico SABOR
  categoriaSabor?: CategoriaSabor | null;
  categoria?: string | null;
  aptoCeliaco?: boolean;
  esVegano?: boolean;
  sinAzucar?: boolean;

  fechaCreacion: string;
  fechaActualizacion?: string | null;

  proveedores: ProveedorVinculado[];
  proveedorPrincipal?: ProveedorVinculado | null;
  componentes?: ComboComponente[];
}

export interface ProductoRequest {
  codigoBarra?: string | null;
  sku?: string | null;
  nombre: string;
  descripcion?: string | null;
  tipoArticulo: TipoArticulo;
  precioVenta: number;
  precioCosto?: number | null;
  tipoIva?: TipoIva;
  stock?: number;
  stockMinimo?: number;
  unidadMedida?: UnidadMedida;
  activo?: boolean;
  categoria?: string | null;

  // Atributos ENVASE
  maxSabores?: number | null;
  pesoGramosAprox?: number | null;

  // Atributos SABOR
  categoriaSabor?: CategoriaSabor | null;
  aptoCeliaco?: boolean;
  esVegano?: boolean;
  sinAzucar?: boolean;

  proveedores?: AsignarProveedorRequest[];
  componentes?: ComboComponente[];
}
