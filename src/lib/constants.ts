// src/lib/constants.ts

export const APP_CONFIG = {
  name: 'Sistema de Capacitaciones',
  version: '1.0.0',
  hospital: 'Hospital',
};

export const ROLES = {
  USUARIO_NUEVO: 'usuario_nuevo',
  USUARIO_ACTIVO: 'usuario_activo',
  ADMINISTRADOR_AREA: 'administrador_area',
  SUPERUSUARIO: 'superusuario',
} as const;

export const ESTADOS_CAPACITACION = {
  ASIGNADA: 'asignada',
  EN_PROGRESO: 'en_progreso',
  COMPLETADA: 'completada',
  PENDIENTE: 'pendiente',
} as const;

export const CATEGORIAS = [
  'Seguridad',
  'Biomédica',
  'Talento Humano',
  'Administración',
  'Enfermería',
  'Tecnología',
  'General',
] as const;

export const DURACIONES = {
  CORTA: { min: 0, max: 15, label: 'Corta (< 15 min)' },
  MEDIA: { min: 15, max: 30, label: 'Media (15-30 min)' },
  LARGA: { min: 30, max: 60, label: 'Larga (30-60 min)' },
  MUY_LARGA: { min: 60, max: Infinity, label: 'Muy larga (> 60 min)' },
} as const;

export const MENSAJES = {
  ERROR_GENERICO: 'Ocurrió un error. Por favor, intenta nuevamente.',
  ERROR_RED: 'Error de conexión. Verifica tu internet.',
  SESION_EXPIRADA: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  EXITO_LOGIN: '¡Bienvenido!',
  EXITO_LOGOUT: 'Sesión cerrada correctamente.',
  CAPACITACION_COMPLETADA: '¡Felicitaciones! Has completado la capacitación.',
} as const;

export const RUTAS = {
  // Públicas
  LOGIN: '/',
  
  // Usuario
  USER_HOME: '/user',
  USER_CAPACITACIONES: '/user/capacitaciones',
  USER_HISTORIAL: '/user/historial',
  USER_CONFIGURACION: '/user/configuracion',
  
  // Admin
  ADMIN_HOME: '/admin',
  ADMIN_CAPACITACIONES: '/admin/capacitaciones',
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_CONFIGURACION: '/admin/configuracion',
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';