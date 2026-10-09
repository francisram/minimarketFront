export type TipoConexion = 'RED' | 'CUPS';

export interface Impresora {
  id?: number;
  nombre: string;
  tipoConexion: TipoConexion;
  ip?: string;
  puerto?: number;
  cola?: string | null;
}

export interface PruebaImpresionRequest {
  texto: string;
  incluirLogo?: boolean;
}
