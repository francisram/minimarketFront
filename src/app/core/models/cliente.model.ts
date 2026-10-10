export interface Cliente {
  id: number;
  ruc: string;
  razonSocial: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
}

export interface ClienteRequest {
  ruc: string;
  razonSocial: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo?: boolean;
}
