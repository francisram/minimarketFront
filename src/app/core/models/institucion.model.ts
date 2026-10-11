export interface Institucion {
  nombre: string;
  logoBase64?: string;
  ruc?: string;
  timbrado?: string;
  timbradoInicio?: string;
  timbradoVencimiento?: string;
  establecimiento?: string;
  puntoEmision?: string;
  numeroInicioFactura?: number;
  numeroFinFactura?: number;
  ultimoNumeroFactura?: number;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
}
