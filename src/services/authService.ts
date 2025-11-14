// src/services/authService.ts
import { API_URL } from "@/lib/constants";
import {
  LoginCredentials,
  LoginResponse,
  AuthResponse,
  User,
} from "@/types/auth";

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // 1. Hacer login - el backend establece las cookies automáticamente
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include", // CRÍTICO: Permite que el navegador guarde las cookies
      });

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        throw new Error(error.detail || "Error al iniciar sesión");
      }

      const loginData: LoginResponse = await loginResponse.json();
      console.log("📦 Login exitoso - Cookies establecidas por el servidor");
      console.log("⏰ Token expira en:", loginData.expires_in, "segundos");

      // 2. Guardar tiempo de expiración (para saber cuándo refrescar)
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "token_expires_at",
          String(Date.now() + loginData.expires_in * 1000)
        );
      }

      // 3. Obtener información del usuario (las cookies se envían automáticamente)
      const userResponse = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (!userResponse.ok) {
        throw new Error("Error al obtener información del usuario");
      }

      const user: User = await userResponse.json();
      console.log("✅ Usuario obtenido:", user);

      // 4. Guardar solo el usuario en localStorage (para UI)
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return {
        access_token: loginData.access_token,
        token_type: loginData.token_type,
        user: user,
      };
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw error;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      console.log("🔄 Intentando refresh token (usando cookie)...");
      
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include", // Envía la refresh_token cookie automáticamente
      });

      console.log("📡 Respuesta del refresh:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("⚠️ Refresh falló - Status:", response.status, "Error:", errorData);
        return false;
      }

      const data = await response.json();
      console.log("✅ Token refrescado exitosamente");
      console.log("⏰ Nuevo token expira en:", data.expires_in, "segundos");

      // Actualizar tiempo de expiración
      if (typeof window !== "undefined" && data.expires_in) {
        localStorage.setItem(
          "token_expires_at",
          String(Date.now() + data.expires_in * 1000)
        );
        console.log("💾 Nuevo tiempo de expiración guardado");
      }

      return true;
    } catch (error) {
      console.error("❌ Error refrescando token:", error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      // Llamar al endpoint de logout para invalidar las cookies en el servidor
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {
        console.log("⚠️ Error llamando a logout del backend, continuando...");
      });

      console.log("✅ Logout en backend completado");
    } finally {
      // Limpiar datos locales
      if (typeof window !== "undefined") {
        // Limpiar cookies manualmente (aunque el backend ya debería haberlo hecho)
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
        
        localStorage.removeItem("user");
        localStorage.removeItem("token_expires_at");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        
      }
      console.log("✅ Datos locales limpiados");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null;

    try {
      // Las cookies HTTP-only se envían automáticamente
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        console.log("❌ No se pudo obtener usuario actual - Status:", response.status);
        return null;
      }

      const user = await response.json();
      console.log("✅ Usuario actual obtenido:", user.email);

      // Actualizar usuario en localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return user;
    } catch (error) {
      console.error("❌ Error obteniendo usuario:", error);
      return null;
    }
  }

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    // Con cookies HTTP-only no podemos verificar directamente
    // Revisamos si hay usuario en localStorage (significa que hizo login)
    return !!this.getStoredUser();
  }

  isTokenExpired(): boolean {
    if (typeof window === "undefined") return true;

    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return true;

    // Consideramos expirado si faltan menos de 1 minuto
    // Esto nos da tiempo suficiente para hacer el refresh
    const bufferTime = 60 * 1000; // 60 segundos
    return Date.now() >= (parseInt(expiresAt) - bufferTime);
  }
}

export const authService = new AuthService();