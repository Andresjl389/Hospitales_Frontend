"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Edit3, Trash2, Search } from "lucide-react";
import { Trainings } from "@/types/capacitacion";
import { capacitacionesService } from "@/services/capacitacionesService";
import { Button } from "@/components/ui/Button";
import { TrainingCreationWizard } from "@/components/admin/capacitaciones/TrainingCreationWizard";
import { TrainingEditCard } from "@/components/admin/capacitaciones/TrainingEditCard";
import { useAuth } from "@/hooks/useAuth";
import { questionnaireService } from "@/services/questionnaireService";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { buildMediaUrl } from "@/lib/media";

export default function AdminCapacitacionesPage() {
  const [capacitaciones, setCapacitaciones] = useState<Trainings[]>([]);
  const [filtered, setFiltered] = useState<Trainings[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(
    null
  );
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>(
    {}
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await capacitacionesService.getAllTrainings();
        setCapacitaciones(data);
        setFiltered(data);
      } catch (error) {
        console.error("❌ Error al cargar capacitaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFiltered(
      capacitaciones.filter(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          item.user?.first_name.toLowerCase().includes(lower)
      )
    );
    setCurrentPage(1);
  }, [search, capacitaciones]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * entries;
  const paginatedData = filtered.slice(startIndex, startIndex + entries);

  const handleTrainingCreated = (training: Trainings) => {
    setCapacitaciones((prev) => [training, ...prev]);
  };

  const handleTrainingUpdated = (training: Trainings) => {
    setCapacitaciones((prev) =>
      prev.map((item) => (item.id === training.id ? training : item))
    );
    setEditingTrainingId(null);
  };

  const handleCloseCreationWizard = () => setShowCreationWizard(false);
  const handleEditClick = (trainingId: string) =>
    setEditingTrainingId(trainingId);
  const handleDeleteClick = async (trainingId: string, title: string) => {
    const confirmed = await confirm({
      title: "Eliminar capacitación",
      description: `¿Deseas eliminar "${title}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    });
    if (!confirmed) return;

    setDeletingId(trainingId);

    try {
      await capacitacionesService.deleteTraining(trainingId);
      setCapacitaciones((prev) =>
        prev.filter((item) => item.id !== trainingId)
      );
      showToast({
        type: "success",
        title: "Capacitación eliminada",
        description: `"${title}" se eliminó correctamente.`,
      });
    } catch (error) {
      console.error("❌ Error al eliminar capacitación:", error);
      showToast({
        type: "error",
        title: "Error al eliminar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la capacitación.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!capacitaciones.length) {
      setQuestionCounts({});
      return;
    }

    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const entries = await Promise.all(
          capacitaciones.map(async (training) => {
            try {
              const questions =
                await questionnaireService.getQuestionsByTrainingId(
                  training.id
                );
              return [training.id, questions.length] as const;
            } catch (error) {
              console.error(
                `❌ Error obteniendo preguntas para ${training.id}:`,
                error
              );
              return [training.id, 0] as const;
            }
          })
        );

        if (isMounted) {
          setQuestionCounts(Object.fromEntries(entries));
        }
      } catch (error) {
        console.error("❌ Error cargando cuestionarios:", error);
        showToast({
          type: "error",
          title: "Error al cargar cuestionarios",
          description: "No se pudo obtener la información del cuestionario.",
        });
      }
    };

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, [capacitaciones, showToast]);

  const getQuestionnaireLabel = (trainingId: string) => {
    const count = questionCounts[trainingId];
    if (typeof count === "number") {
      if (count === 0) return "Sin preguntas";
      return `${count} ${count === 1 ? "Pregunta" : "Preguntas"}`;
    }
    return "Sin cuestionario";
  };

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }, [totalPages]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-md flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-semibold">
            {currentAdmin
              ? `${currentAdmin.first_name.charAt(
                  0
                )}${currentAdmin.last_name.charAt(0)}`.toUpperCase()
              : "AD"}
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-white/80">
              Administrador
            </p>
            <h1 className="text-2xl font-semibold">
              {currentAdmin
                ? `${currentAdmin.first_name} ${currentAdmin.last_name}`
                : "Panel de Capacitaciones"}
            </h1>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreationWizard(true)}
          className="bg-blue-600 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva capacitación
        </Button>
      </div>
      {showCreationWizard && (
        <TrainingCreationWizard
          isOpen={showCreationWizard}
          onClose={handleCloseCreationWizard}
          onTrainingCreated={handleTrainingCreated}
        />
      )}

      {editingTrainingId && (
        <TrainingEditCard
          trainingId={editingTrainingId}
          onClose={() => setEditingTrainingId(null)}
          onTrainingUpdated={handleTrainingUpdated}
        />
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-4 md:p-6 space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Mostrar</label>
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              className="border rounded-lg px-2 py-1 text-sm text-gray-700"
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">registros</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-2 w-full border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando capacitaciones...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No se encontraron capacitaciones.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-600 uppercase tracking-wide text-xs">
                <tr>
                  <th className="py-2 px-4">ID</th>
                  <th className="py-2 px-4">Imagen</th>
                  <th className="py-2 px-4">Título</th>
                  <th className="py-2 px-4">Descripción</th>
                  <th className="py-2 px-4">Área</th>
                  <th className="py-2 px-4">Cuestionario</th>
                  <th className="py-2 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((capa) => (
                  <tr
                    key={capa.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <td className="py-4 px-4 text-gray-500 text-xs font-semibold">
                      #{capa.id.split("-")[0]}
                    </td>
                    <td className="py-4 px-4">
                      {capa.url_image ? (
                        <Image
                          src={buildMediaUrl(capa.url_image) ?? ""}
                          alt={capa.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{capa.title}</span>
                        <span className="text-xs text-gray-500">
                          Autor: {capa.user?.first_name} {capa.user?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 max-w-[260px] truncate">
                      {capa.description || "Sin descripción"}
                    </td>
                    <td className="py-4 px-4 text-gray-600">Sin área</td>
                    <td className="py-4 px-4 text-gray-600">
                      {getQuestionnaireLabel(capa.id)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-3 text-gray-400">
                        <button
                          className="hover:text-blue-600"
                          onClick={() => handleEditClick(capa.id)}
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="hover:text-red-600 disabled:opacity-40"
                          onClick={() => handleDeleteClick(capa.id, capa.title)}
                          disabled={deletingId === capa.id}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600">
            <p>
              Mostrando {filtered.length === 0 ? 0 : startIndex + 1}–
              {Math.min(startIndex + entries, filtered.length)} de{" "}
              {filtered.length} capacitaciones
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-4 py-1.5 rounded-full border ${
                  safePage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                ← Anterior
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-full border ${
                    safePage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className={`px-4 py-1.5 rounded-full border ${
                  safePage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
