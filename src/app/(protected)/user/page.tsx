// src/app/(protected)/user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { capacitacionesService } from "@/services/capacitacionesService";
import {
  EstadisticasUsuario,
  Capacitacion,
  Assignments,
  UserTraining,
} from "@/types/capacitacion";
import { StatCard } from "@/components/cards/StatCard";
import { CapacitacionCard } from "@/components/cards/CapacitacionCard";
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function UserHomePage() {
  const { user, loading: authLoading } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuario | null>(
    null
  );
  const [assignments, setAssignments] = useState<UserTraining[]>([]);
  const [capacitacionesRecientes, setCapacitacionesRecientes] = useState<
    Capacitacion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "completed" | "in_progress" | "expired">("all");

  useEffect(() => {
    // ✅ Esperar a que el auth termine de cargar
    if (authLoading) {
      console.log("⏳ Esperando autenticación...");
      return;
    }

    // ✅ Verificar que el usuario existe y tiene área
    if (!user) {
      console.warn("⚠️ No hay usuario autenticado");
      setLoading(false);
      return;
    }

    if (!user.area || !user.area.id) {
      console.warn("⚠️ Usuario no tiene área asignada:", user);
      setError(
        "Tu cuenta no tiene un área asignada. Contacta al administrador."
      );
      setLoading(false);
      return;
    }

    // ✅ Cargar datos cuando todo está listo
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("📚 Cargando asignaciones para área:", user.area.id);

        const assignmentsData =
          await capacitacionesService.getUserTraining(user.id);

        console.log("✅ Asignaciones cargadas:", assignmentsData);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        setError(
          "Error al cargar las capacitaciones. Por favor, intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading]);

  // Mostrar loading mientras auth o datos cargan
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay usuario o área
  if (!user || !user.area) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error de configuración
            </h3>
            <p className="text-red-700">
              {error ||
                "Tu cuenta no está configurada correctamente. Por favor, contacta al administrador."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const completedAssignments = assignments.filter(
    (item) => item.status?.name?.toLowerCase() === "completed"
  );
  const expiredAssignments = assignments.filter(
    (item) => item.status?.name?.toLowerCase() === "expired"
  );
  const inProgressAssignments = assignments.filter(
    (item) =>
      item.status?.name?.toLowerCase() === "in progress" ||
      item.status?.name?.toLowerCase() === "pending"
  );

  const percentage = (completedAssignments.length / assignments.length) * 100


  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {user.first_name}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Aquí encontrarás un resumen de tu progreso en capacitaciones
            </p>
          </div>
          <div className="hidden md:block">
            <Calendar className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Información del usuario */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-blue-100">Rol:</span>
            <span className="font-medium">{user.role.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-blue-100">Área:</span>
            <span className="font-medium">{user.area.name}</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Capacitaciones Realizadas"
          value={completedAssignments.length}
          icon={CheckCircle}
          color="green"
          subtitle="Completadas exitosamente"
        />
        <StatCard
          title="Capacitaciones Asignadas"
          value={inProgressAssignments.length}
          icon={BookOpen}
          color="blue"
          subtitle="Por realizar"
        />
        <StatCard
          title="Capacitaciones expiradas"
          value={expiredAssignments.length}
          icon={Clock}
          color="orange"
          subtitle="Requieren atención"
        />
        <StatCard
          title="Tasa de Cumplimiento"
          value={`${percentage.toFixed() || '0'}%`}
          icon={TrendingUp}
          color="purple"
          subtitle="De todas las asignadas"
        />
      </div>

      {/* Sección de consejos rápidos */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 rounded-lg p-3 flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Consejos para tu formación
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Completa las capacitaciones próximas a vencer primero
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Dedica al menos 30 minutos diarios a tu formación</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Revisa tu historial para reforzar conocimientos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
