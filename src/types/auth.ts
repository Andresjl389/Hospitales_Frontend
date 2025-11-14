// src/types/auth.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  cedula: string;
  email: string;
  registered_at: string;
  role: Role;
  area: Area; // Si puede ser null, cambiar a: area: Area | null;
}

// Respuesta del endpoint de login
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string; // Opcional si tu API lo envía
}

// Respuesta del endpoint de refresh token
export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Para uso interno en el frontend (combina token + user)
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserInfo {
  first_name: string;
  last_name: string;
}
