export interface ProductoSimple {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  activo: boolean;
}
