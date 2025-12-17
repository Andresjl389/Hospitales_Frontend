//app/(protected)/user/capacitaciones/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { capacitacionesService } from "@/services/capacitacionesService";
import { Assignments, UserTraining } from "@/types/capacitacion";
import { CapacitacionCard } from "@/components/cards/CapacitacionCard";
import { useAuth } from "@/hooks/useAuth";
import Modal from "@/components/ui/Modal";
import { Clock } from "lucide-react";
import { buildMediaUrl } from "@/lib/media";

export default function CapacitacionesPage() {
  const router = useRouter();
  const [userTraining, setUserTraining] = useState<UserTraining[]>([]);
  const [selectedCap, setSelectedCap] = useState<UserTraining | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

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
        setUserTraining(data);
        console.log(data);
      } catch (err) {
        console.error("❌ Error obteniendo capacitaciones:", err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las capacitaciones"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user]);

  const handleOpenModal = (training: UserTraining) => {
    setSelectedCap(training);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedCap(null);
    setShowModal(false);
  };

  const handleIniciarCapacitacion = async () => {
    if (!selectedCap) return;

    // Verificamos el estado actual antes de permitir el cambio
    const currentStatus = selectedCap.status.name.toLowerCase();

    if (currentStatus === "completed") {
      alert("Esta capacitación ya fue completada.");
      return;
    }

    // Si no está completada, actualizamos el estado a "In Progress"
    try {
      await capacitacionesService.updateUserTraining(
        selectedCap.id,
        "In Progress"
      );
      // Redirigimos al video
      router.push(`/user/capacitaciones/${selectedCap.trainings.id}`);
    } catch (error) {
      console.error("Error actualizando capacitación:", error);
      alert("Ocurrió un error al iniciar la capacitación.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <p className="text-gray-600">Cargando capacitaciones...</p>
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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Capacitaciones disponibles
      </h1>

      {userTraining.length === 0 ? (
        <p className="text-gray-500">No hay capacitaciones disponibles.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userTraining.map((cap) => (
            <CapacitacionCard
              key={cap.id}
              capacitacion={cap}
              onClick={() => handleOpenModal(cap)}
            />
          ))}

          {selectedCap && (
            <Modal isOpen={showModal} onClose={handleCloseModal}>
              {/* Imagen de fondo */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={buildMediaUrl(selectedCap.trainings.url_image) ?? ""}
                  alt={selectedCap.trainings.title}
                  width={960}
                  height={360}
                  className="w-full h-full object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Botón de cierre */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <span className="text-gray-700 text-xl font-bold">×</span>
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedCap.trainings.title}
                </h2>

                <p className="text-gray-600 leading-relaxed mb-6">
                  {selectedCap.trainings.description}
                </p>

                {/* Información adicional */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Duración:{" "}
                      {selectedCap.trainings.duration_minutes.toString()}{" "}
                      minutos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅 Estado: {selectedCap.status.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      👤 Subido por: {selectedCap.trainings.user.first_name}{" "}
                      {selectedCap.trainings.user.last_name}
                    </span>
                  </div>
                </div>

                {/* Botón de acción */}
                <button
                  disabled={
                    selectedCap.status.name.toLowerCase() === "completed"
                  }
                  onClick={handleIniciarCapacitacion}
                  className={`w-full font-medium py-3 rounded-lg transition-colors
                            ${
                              selectedCap.status.name.toLowerCase() === "completed"
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                >
                  {selectedCap.status.name.toLowerCase() === "completed"
                    ? "Capacitación completada"
                    : "Iniciar capacitación"}
                </button>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}
