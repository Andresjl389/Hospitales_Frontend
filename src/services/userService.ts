// src/services/userService.ts
import { API_URL } from '@/lib/constants';
import { authService } from './authService';
import { User } from '@/types/auth';

export interface UpdateUserData {
  first_name: string;
  last_name: string;
  email: string;
  area_id?: string;
}

type EmptyResponse = Record<string, never>;

class UserService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Si es 401, el token expiró o es inválido
      if (response.status === 401) {
        console.log('🔒 Token inválido, intentando refrescar...');
        const newToken = await authService.refreshToken();
        
        if (!newToken) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        throw new Error('Token refrescado, reintenta la operación');
      }
      
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Actualiza la información del perfil del usuario
   */
  async updateUserProfile(userId: string, data: UpdateUserData): Promise<User> {
    try {
      if (!userId) {
        throw new Error('ID de usuario no proporcionado');
      }

      console.log('📡 Actualizando perfil de usuario:', userId);

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<User>(response);
      console.log('✅ Perfil actualizado:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Cambia la contraseña del usuario
   * Nota: El endpoint usa query parameters
   */
  async changeUserPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<EmptyResponse> {
    try {
      if (!userId) {
        throw new Error('ID de usuario no proporcionado');
      }

      console.log('📡 Cambiando contraseña de usuario:', userId);

      const params = new URLSearchParams({
        new_password: newPassword,
        last_password: currentPassword,
      });

      const response = await fetch(
        `${API_URL}/users/${userId}/password?${params.toString()}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          },
        }
      );

      const result = await this.handleResponse<EmptyResponse>(response);
      console.log('✅ Contraseña cambiada correctamente');
      
      return result;
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de un usuario específico
   */
  async getUserById(userId: string): Promise<User> {
    try {
      if (!userId) {
        throw new Error('ID de usuario no proporcionado');
      }

      console.log('📡 Obteniendo usuario:', userId);

      const response = await fetch(`${API_URL}/users/${userId}`, {
        credentials: 'include',
      });

      const data = await this.handleResponse<User>(response);
      console.log('✅ Usuario obtenido:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
