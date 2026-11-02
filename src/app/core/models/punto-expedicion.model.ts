export interface PuntoExpedicion {
  id: number;
  nombre: string;
  establecimiento: string;
  puntoEmision: string;
  prefijoLegal: string;
  timbrado?: string | null;
  timbradoInicio?: string | null;
  timbradoVencimiento?: string | null;
  numeroInicioFactura: number;
  numeroFinFactura: number;
  ultimoNumeroFactura: number;
  proximaFactura: string;
  proximaFacturaFormateada?: string;
  activo: boolean;
  enUso: boolean;
  usuarioActual?: string | null;
  cajeroActual?: string | null;
  sesionCajaIdActual?: number | null;
}

export interface PuntoExpedicionRequest {
  nombre: string;
  establecimiento: string;
  puntoEmision: string;
  timbrado?: string | null;
  timbradoInicio?: string | null;
  timbradoVencimiento?: string | null;
  numeroInicioFactura: number;
  numeroFinFactura: number;
  ultimoNumeroFactura?: number;
  activo?: boolean;
}
