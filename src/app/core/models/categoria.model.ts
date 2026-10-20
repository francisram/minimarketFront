import { TipoArticulo } from './producto.model';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipoArticulo?: TipoArticulo | null;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string | null;
  tipoArticulo?: TipoArticulo | null;
  activo?: boolean;
}
