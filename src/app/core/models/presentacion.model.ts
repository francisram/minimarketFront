import { TipoIva } from './tipo-iva.model';

export interface Presentacion {
  id: number;
  nombre: string;
  precio: number;
  maxSabores: number;
  pesoGramosAprox?: number;
  activo: boolean;
  stock?: number;
  stockMinimo?: number;
  tipoIva?: TipoIva;
}

