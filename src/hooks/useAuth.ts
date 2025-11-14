// src/hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { User, LoginCredentials } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔥 Función para refrescar el token automáticamente
  const tryRefreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Intentando refrescar token...');
      const success = await authService.refreshToken();
      
      if (success) {
        console.log('✅ Token refrescado correctamente');
        return true;
      }
      
      console.log('❌ No se pudo refrescar el token');
      return false;
    } catch (error) {
      console.error('❌ Error en refresh:', error);
      return false;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Verificando autenticación...');
      
      // 1. Revisar si hay usuario en localStorage
      const storedUser = authService.getStoredUser();
      
      if (!storedUser) {
        console.log('❌ No hay usuario almacenado');
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('✅ Usuario encontrado en localStorage:', storedUser.email);
      setUser(storedUser);
      
      // 2. Verificar si el token está próximo a expirar o ya expiró
      if (authService.isTokenExpired()) {
        console.log('⏰ Token expirado o próximo a expirar, refrescando...');
        
        const refreshed = await tryRefreshToken();
        
        if (!refreshed) {
          console.log('❌ No se pudo refrescar, cerrando sesión');
          setUser(null);
          setLoading(false);
          return;
        }
        
        console.log('✅ Token refrescado, continuando...');
      }
      
      // 3. Verificar con el backend que la sesión sigue válida
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ Sesión válida confirmada');
        setUser(currentUser);
      } else {
        console.log('❌ Sesión inválida');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error verificando auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [tryRefreshToken]);

  // 🔥 Configurar intervalo para refrescar token automáticamente
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (user) {
      // Revisar cada 5 minutos si necesitamos refrescar
      // (El token expira en 10 minutos, así que esto nos da margen)
      intervalId = setInterval(async () => {
        console.log('⏰ Verificación periódica del token...');
        
        if (authService.isTokenExpired()) {
          console.log('🔄 Token próximo a expirar, refrescando...');
          const refreshed = await tryRefreshToken();
          
          if (!refreshed) {
            console.log('❌ Refresh falló, cerrando sesión');
            await logout();
          }
        }
      }, 5 * 60 * 1000); // 5 minutos
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, tryRefreshToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 Intentando login...');
      const response = await authService.login(credentials);
      
      console.log('✅ Login exitoso, usuario:', response.user);
      setUser(response.user);
      
      // Esperar un momento para asegurar que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirigir según el rol
      const roleName = response.user.role.name.toLowerCase();
      const redirectPath = (roleName === 'administrador_area' || roleName === 'superusuario' || roleName === 'admin') 
        ? '/admin' 
        : '/user';
      
      console.log('🚀 Rol:', roleName, '- Redirigiendo a:', redirectPath);
      router.push(redirectPath);
      router.refresh();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al iniciar sesión' 
      };
    }
  };

  const logout = async () => {
    console.log('👋 Iniciando cierre de sesión...');
    
    try {
      // 1. Limpiar estado local inmediatamente
      setUser(null);
      
      // 2. Llamar al servicio de logout (limpia localStorage y cookies)
      await authService.logout();
      
      console.log('✅ Sesión cerrada correctamente');
      
      // 3. Redirigir al login usando window.location para forzar recarga completa
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Error durante logout:', error);
      // Aunque haya error, igual redirigir
      window.location.href = '/';
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuth, // Exportamos por si necesitas refrescar manualmente
  };
}