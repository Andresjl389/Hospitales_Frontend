import { Area, User, UserInfo } from "./auth";

// src/types/capacitacion.ts
export interface Capacitacion {
  id: string;
  titulo: string;
  descripcion: string;
  duracion: number; // en minutos
  categoria: string;
  imagen_url?: string;
  video_url: string;
  responsable: string;
  fecha_creacion: string;
  estado: 'asignada' | 'en_progreso' | 'completada' | 'pendiente';
  progreso?: number;
  fecha_vencimiento?: string;
}

export interface EstadisticasUsuario {
  capacitaciones_realizadas: number;
  capacitaciones_asignadas: number;
  capacitaciones_proximas_vencer: number;
  tasa_cumplimiento: number;
}

export interface CapacitacionDetalle extends Capacitacion {
  cuestionario_id?: string;
  numero_preguntas?: number;
  calificacion_minima?: number;
}

export interface Trainings {
  id: string
  title: string
  description: string
  url_video: string
  url_image: string
  duration_minutes: number
  created_at: Date
  user: UserInfo
}

export interface Status {
  id: string
  name: string
}

export interface Assignments{
  id: string
  assignment_date: Date
  completed_date: Date | null
  area: Area
  trainings: Trainings
  status: Status
}


export interface UserTraining{
  id: string
  start_date: string | null
  end_date: string | null
  progress: number
  user: User
  area: Area
  assignments: Assignments
  trainings: Trainings
  status: Status
}
