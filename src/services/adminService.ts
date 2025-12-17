// src/services/adminService.ts
import { API_URL } from "@/lib/constants";
import { authService } from "./authService";
import { Role, User } from "@/types/auth";
import { Trainings } from "@/types/capacitacion";

interface Area {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  assignment_date: string;
  completed_date: string | null;
  area: Area;
  trainings: Trainings;
  status: {
    id: string;
    name: string;
  };
}

interface CreateUserPayload {
  first_name: string;
  last_name: string;
  cedula: string;
  email: string;
  password: string;
  role_id?: string | null;
  area_id?: string | null;
}

interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  cedula?: string;
  email?: string;
  role_id?: string | null;
  area_id?: string | null;
}

class AdminService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        console.log("🔒 Token inválido, intentando refrescar...");
        const newToken = await authService.refreshToken();
        if (!newToken) {
          throw new Error(
            "Sesión expirada. Por favor, inicia sesión nuevamente."
          );
        }
        throw new Error("Token refrescado, reintenta la operación");
      }
      const errorText = await response.text();
      throw new Error(
        errorText || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  private sanitizePayload<T extends object>(payload: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(payload as Record<string, unknown>).filter(
        ([, value]) => value !== undefined
      )
    ) as Partial<T>;
  }

  async getUsers(): Promise<User[]> {
    try {
      console.log("📡 Obteniendo lista de usuarios...");
      const response = await fetch(`${API_URL}/users`, {
        credentials: "include",
      });
      return await this.handleResponse<User[]>(response);
    } catch (error) {
      console.error("❌ Error al obtener usuarios:", error);
      throw error;
    }
  }

  async getTrainings(): Promise<Trainings[]> {
    try {
      console.log("📡 Obteniendo capacitaciones...");
      const response = await fetch(`${API_URL}/trainings`, {
        credentials: "include",
      });
      return await this.handleResponse<Trainings[]>(response);
    } catch (error) {
      console.error("❌ Error al obtener capacitaciones:", error);
      throw error;
    }
  }

  async getAreas(): Promise<Area[]> {
    try {
      console.log("📡 Obteniendo áreas...");
      const response = await fetch(`${API_URL}/areas`, {
        credentials: "include",
      });
      return await this.handleResponse<Area[]>(response);
    } catch (error) {
      console.error("❌ Error al obtener áreas:", error);
      throw error;
    }
  }

  async getRoles(): Promise<Role[]> {
    try {
      console.log("📡 Obteniendo roles...");
      const response = await fetch(`${API_URL}/roles`, {
        credentials: "include",
      });
      return await this.handleResponse<Role[]>(response);
    } catch (error) {
      console.error("❌ Error al obtener roles:", error);
      throw error;
    }
  }

  async getAssignments(): Promise<Assignment[]> {
    try {
      console.log("📡 Obteniendo asignaciones...");
      const response = await fetch(`${API_URL}/assignments`, {
        credentials: "include",
      });
      return await this.handleResponse<Assignment[]>(response);
    } catch (error) {
      console.error("❌ Error al obtener asignaciones:", error);
      throw error;
    }
  }

  async createUser(data: CreateUserPayload): Promise<User> {
    try {
      console.log("🆕 Creando usuario...", data.email);
      const payload = this.sanitizePayload(data);
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      return await this.handleResponse<User>(response);
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);
      throw error;
    }
  }

  async updateUser(idUser: string, data: UpdateUserPayload): Promise<User> {
    try {
      if (!idUser) {
        throw new Error("ID de usuario no proporcionado");
      }

      const payload = this.sanitizePayload(data);
      console.log("✏️  Actualizando usuario:", idUser, payload);
      const response = await fetch(`${API_URL}/users/${idUser}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      return await this.handleResponse<User>(response);
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      throw error;
    }
  }

  async deleteUser(idUser: string): Promise<void> {
    try {
      if (!idUser) {
        throw new Error("ID de usuario no proporcionado");
      }

      console.log("🗑️ Eliminando capacitación:", idUser);
      const response = await fetch(`${API_URL}/users/${idUser}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo eliminar el usuario");
      }
      console.log("✅ Usuario eliminado");
    } catch (error) {
      console.error("❌ Error al eliminar el usuario:", error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
