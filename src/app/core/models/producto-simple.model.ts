import { TipoIva } from './tipo-iva.model';
import { Proveedor } from './proveedor.model';

export interface ProductoSimple {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string;
  descripcion?: string;
  stock: number;
  stockMinimo?: number;
  activo: boolean;
  tipoIva?: TipoIva;
  codigo?: string | null;
  codigoBarra?: string | null;
  proveedor?: Proveedor | null;
  proveedorId?: number | null;
  imagenUrl?: string | null;
}
