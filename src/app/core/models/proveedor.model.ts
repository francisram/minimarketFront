export interface Proveedor {
  id: number;
  ruc: string;
  razonSocial: string;
  contacto?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
}

export interface ProveedorRequest {
  ruc: string;
  razonSocial: string;
  contacto?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo?: boolean;
}
