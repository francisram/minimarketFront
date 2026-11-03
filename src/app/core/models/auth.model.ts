export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  username: string;
  rol: string;
}

export interface CambiarPasswordRequest {
  username: string;
  passwordActual: string;
  passwordNueva: string;
}

export interface UserSession {
  username: string;
  rol: string;
  token: string;
  refreshToken?: string;
}
