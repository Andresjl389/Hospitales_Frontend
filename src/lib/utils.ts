// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Función para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear duración en minutos a formato legible
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Formatear fecha
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Formatear fecha y hora
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Calcular días restantes
export function getDaysRemaining(dateString: string): number {
  const today = new Date();
  const targetDate = new Date(dateString);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Obtener color según días restantes
export function getUrgencyColor(days: number): string {
  if (days < 0) return 'text-red-600';
  if (days <= 3) return 'text-orange-600';
  if (days <= 7) return 'text-yellow-600';
  return 'text-green-600';
}

// Truncar texto
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isBooleanQuestionType(typeName: string): boolean {
  const normalized = removeDiacritics(typeName).toLowerCase().trim();
  return (
    normalized === "falso o verdadero" ||
    normalized === "verdadero o falso" ||
    normalized === "falso/verdadero" ||
    normalized === "verdadero/falso"
  );
}
