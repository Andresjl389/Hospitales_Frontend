"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { capacitacionesService } from "@/services/capacitacionesService";
import { UserTraining } from "@/types/capacitacion";
import { useAuth } from "@/hooks/useAuth";
import { Search, Calendar, Clock } from "lucide-react";

// Función para eliminar tildes/acentos
function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Formatear fecha a "día mes año"
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function MiHistorialPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<UserTraining[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<
    UserTraining[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (!user.area || !user.area.id) {
      setError(
        "Tu cuenta no tiene un área asignada. Contacta al administrador."
      );
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const data = await capacitacionesService.getUserTraining(user.id);
        setAssignments(data);
        setFilteredAssignments(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo cargar el historial";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user]);

  useEffect(() => {
    let filtered = assignments;

    // Filtro de búsqueda (ignorar tildes/acentos)
    if (searchTerm) {
      const cleanSearch = removeDiacritics(searchTerm).toLowerCase();
      filtered = filtered.filter((assignment) =>
        removeDiacritics(assignment.trainings.title)
          .toLowerCase()
          .includes(cleanSearch)
      );
    }

    // Filtro por rango de fechas completadas
    if (startDate && endDate) {
      filtered = filtered.filter((assignment) => {
        if (!assignment.end_date) return false;
        const completed = new Date(assignment.end_date);
        return (
          completed >= new Date(startDate) && completed <= new Date(endDate)
        );
      });
    }

    setFilteredAssignments(filtered);
  }, [searchTerm, startDate, endDate, assignments]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; class: string }> = {
      Completed: { text: "Completado", class: "bg-green-100 text-green-700" },
      "In Progress": {
        text: "Incompleto",
        class: "bg-yellow-100 text-yellow-700",
      },
      Pending: { text: "Pendiente", class: "bg-gray-100 text-gray-700" },
      Expired: { text: "Perdido", class: "bg-red-100 text-red-700" },
    };
    return (
      statusMap[status] || { text: status, class: "bg-gray-100 text-gray-700" }
    );
  };

  const getActionButton = (status: string, assignmentId: string) => {
    const buttonMap: Record<string, { text: string; class: string }> = {
      Completed: {
        text: "Volver a ver",
        class: "bg-blue-600 hover:bg-blue-700 text-white",
      },
      "In Progress": {
        text: "Continuar",
        class: "bg-blue-600 hover:bg-blue-700 text-white",
      },
      Pending: {
        text: "Iniciar",
        class: "bg-blue-600 hover:bg-blue-700 text-white",
      },
      Expired: {
        text: "Repetir",
        class: "bg-blue-600 hover:bg-blue-700 text-white",
      },
    };
    const button = buttonMap[status] || {
      text: "Ver",
      class: "bg-blue-600 hover:bg-blue-700 text-white",
    };
    return (
      <button
        onClick={() => router.push(`/user/capacitaciones/${assignmentId}`)}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${button.class}`}
      >
        {button.text}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        {/* Buscador */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar capacitación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        {/* Filtro de fechas */}
        <div className="flex gap-4 items-center bg-white rounded-lg p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700 flex flex-col">
            <span className="mb-1">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm transition"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 flex flex-col">
            <span className="mb-1">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm transition"
            />
          </label>
        </div>
      </div>
      {/* Lista de capacitaciones */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No se encontraron capacitaciones
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const badge = getStatusBadge(assignment.status.name);
            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Badge de estado */}
                  <div className="flex-shrink-0">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium ${badge.class}`}
                    >
                      {badge.text}
                    </span>
                  </div>
                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {assignment.trainings.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Completada:{" "}
                          {assignment.end_date
                            ? formatDate(assignment.end_date)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📊 Calificación: 95%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Duración:{" "}
                          {assignment.trainings.duration_minutes.toString()} min
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Botón */}
                  <div className="flex-shrink-0">
                    {getActionButton(
                      assignment.status.name,
                      assignment.trainings.id
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
