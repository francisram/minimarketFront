export type CategoriaSabor = 'DULCE_DE_LECHE' | 'CHOCOLATE' | 'FRUTAL' | 'CREMA' | string;

export interface Sabor {
  id: number;
  nombre: string;
  categoria: CategoriaSabor;
  disponible: boolean;
  aptoCeliaco: boolean;
  esVegano: boolean;
  sinAzucar: boolean;
}
