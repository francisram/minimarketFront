export type TipoConexion = 'RED' | 'CUPS' | 'WINDOWS';

export interface Impresora {
  id?: number;
  nombre: string;
  tipoConexion: TipoConexion;
  ip?: string;
  puerto?: number;
  cola?: string | null;
  usuario?: string | null;
  password?: string | null;
  tienePassword?: boolean;
}

export interface PruebaImpresionRequest {
  texto: string;
  incluirLogo?: boolean;
}
