// src/services/capacitacionesService.ts
import {
  Assignments,
  Capacitacion,
  EstadisticasUsuario,
  Trainings,
  UserTraining,
} from "@/types/capacitacion";
import { authService } from "./authService";
import { API_URL } from "@/lib/constants";

class CapacitacionesService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Si es 401, el token expiró o es inválido
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

  async getAssignmentsByAreaId(id_area: string): Promise<Assignments[]> {
    try {
      if (!id_area) {
        throw new Error("ID de área no proporcionado");
      }

      console.log("📡 Obteniendo asignaciones para área:", id_area);

      const response = await fetch(`${API_URL}/assignments/${id_area}`, {
        credentials: "include",
      });

      const data = await this.handleResponse<Assignments[]>(response);
      console.log("✅ Asignaciones obtenidas:", data);

      return data;
    } catch (error) {
      console.error("❌ Error al obtener asignaciones por área:", error);
      throw error;
    }
  }
  async getTrainingById(id_training: string): Promise<Trainings> {
    try {
      if (!id_training) {
        throw new Error("ID de área no proporcionado");
      }

      console.log("📡 Obteniendo asignaciones para área:", id_training);

      const response = await fetch(`${API_URL}/trainings/${id_training}`, {
        credentials: "include",
      });

      const data = await this.handleResponse<Trainings>(response);
      console.log("✅ Asignaciones obtenidas:", data);

      return data;
    } catch (error) {
      console.error("❌ Error al obtener asignaciones por área:", error);
      throw error;
    }
  }

  async getUserTraining(id_user: string): Promise<UserTraining[]> {
    try {
      if (!id_user) {
        throw new Error("ID de usuario no proporcionado");
      }

      console.log("📡 Obteniendo asignaciones por usuario:", id_user);

      // Construcción correcta de la URL con query param
      const url = `${API_URL}/user_trainings?id_user=${encodeURIComponent(
        id_user
      )}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (response.status === 404) {
        console.warn("⚠️ No hay capacitaciones asignadas para este usuario");
        return [];
      }

      const data = await this.handleResponse<UserTraining[]>(response);
      console.log("✅ Asignaciones obtenidas:", data);

      return data;
    } catch (error) {
      console.error("❌ Error al obtener asignaciones por usuario:", error);
      throw error;
    }
  }
  async updateUserTraining(id_user_training: string, status: string) {
    try {
      const url = `${API_URL}/user_trainings/${id_user_training}`;

      const response = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json", // necesario para FastAPI
          Accept: "application/json",
        },
        body: JSON.stringify({ status: status }), // convierte correctamente el objeto a formato JSON
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("UserTraining actualizado:", data);
      return data;
    } catch (error) {
      console.error("Error al actualizar entrenamiento:", error);
      throw error;
    }
  }
  async getAllTrainings(): Promise<Trainings[]> {
    try {
      console.log("📡 Obteniendo todas las capacitaciones...");
      const response = await fetch(`${API_URL}/trainings`, {
        credentials: "include",
      });
      const data = await this.handleResponse<Trainings[]>(response);
      console.log("✅ Capacitaciones obtenidas:", data);
      return data;
    } catch (error) {
      console.error("❌ Error al obtener capacitaciones:", error);
      throw error;
    }
  }

  async createTraining(formData: FormData): Promise<Trainings> {
    try {
      console.log("📡 Creando capacitación...");
      const response = await fetch(`${API_URL}/trainings`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await this.handleResponse<Trainings>(response);
      console.log("✅ Capacitación creada:", data);
      return data;
    } catch (error) {
      console.error("❌ Error al crear capacitación:", error);
      throw error;
    }
  }

  async updateTraining(
    trainingId: string,
    payload: {
      title?: string;
      description?: string;
      video?: File | null;
      image?: File | null;
    }
  ): Promise<Trainings> {
    try {
      if (!trainingId) {
        throw new Error("ID de capacitación no proporcionado");
      }

      const formData = new FormData();
      let hasChanges = false;

      if (payload.title !== undefined && payload.title !== null) {
        formData.append("title", payload.title);
        hasChanges = true;
      }

      if (
        payload.description !== undefined &&
        payload.description !== null
      ) {
        formData.append("description", payload.description);
        hasChanges = true;
      }

      if (payload.video) {
        formData.append("video", payload.video);
        hasChanges = true;
      }

      if (payload.image) {
        formData.append("image", payload.image);
        hasChanges = true;
      }

      if (!hasChanges) {
        throw new Error("No se proporcionaron cambios para actualizar");
      }

      console.log("✏️ Actualizando capacitación:", trainingId);

      const response = await fetch(`${API_URL}/trainings/${trainingId}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await this.handleResponse<Trainings>(response);
      console.log("✅ Capacitación actualizada:", data);
      return data;
    } catch (error) {
      console.error("❌ Error al actualizar capacitación:", error);
      throw error;
    }
  }

  async assignTrainingToArea(
    trainingId: string,
    areaId: string
  ): Promise<Assignments> {
    try {
      if (!trainingId || !areaId) {
        throw new Error("Training y área son obligatorios");
      }

      console.log("📡 Asignando capacitación a área:", { trainingId, areaId });
      const response = await fetch(`${API_URL}/assignments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          training_id: trainingId,
          id_area: areaId,
        }),
      });

      return await this.handleResponse<Assignments>(response);
    } catch (error) {
      console.error("❌ Error al asignar capacitación:", error);
      throw error;
    }
  }

  async deleteTraining(trainingId: string): Promise<void> {
    try {
      if (!trainingId) {
        throw new Error("ID de capacitación no proporcionado");
      }

      console.log("🗑️ Eliminando capacitación:", trainingId);
      const response = await fetch(`${API_URL}/trainings/${trainingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo eliminar la capacitación");
      }
      console.log("✅ Capacitación eliminada");
    } catch (error) {
      console.error("❌ Error al eliminar capacitación:", error);
      throw error;
    }
  }
}

export const capacitacionesService = new CapacitacionesService();
