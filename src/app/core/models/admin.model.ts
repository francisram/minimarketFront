export interface Usuario {
  id?: number;
  username: string;
  password?: string;
  rolId?: number;
  rolNombre?: string;
  estado?: boolean;
  passwordNuncaExpira?: boolean;
  debeCambiarPassword?: boolean;
  passwordExpiraEl?: string | null;
}

export interface Rol {
  id: number;
  nombre: string;
  paginas: string[];
}

export interface Licencia {
  id: number;
  planId: number;
  planNombre: string;
  paginas: string[];
  fechaVencimiento: string;
}

export interface PlanLicencia {
  id: number;
  nombre: string;
  paginas: string[];
}
