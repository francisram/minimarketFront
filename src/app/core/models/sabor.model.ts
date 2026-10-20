export type CategoriaSabor = 'DULCE_DE_LECHE' | 'CHOCOLATE' | 'FRUTAL' | 'CREMA' | string;

export interface Sabor {
  id: number;
  nombre: string;
  categoria: CategoriaSabor;
  descripcion?: string;
  disponible: boolean;
  aptoCeliaco: boolean;
  esVegano: boolean;
  sinAzucar: boolean;
  stockKilos?: number;
  stockMinimoKilos?: number;
  imagenUrl?: string | null;
}
