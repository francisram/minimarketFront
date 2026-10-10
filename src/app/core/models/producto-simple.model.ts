import { TipoIva } from './tipo-iva.model';

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
}

