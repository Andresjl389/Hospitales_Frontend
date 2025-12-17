// src/components/cards/CapacitacionCard.tsx
"use client";

import Image from "next/image";
import { UserTraining } from "@/types/capacitacion";
import { Clock, PlayCircle, CheckCircle } from "lucide-react";
import { buildMediaUrl } from "@/lib/media";

interface CapacitacionCardProps {
  capacitacion: UserTraining;
  onClick?: () => void;
}

type EstadoType = "Pending" | "In Progress" | "Completed" | "Expired";

const estadoBadge: Record<EstadoType, { text: string; class: string }> = {
  Pending: { text: "Pendiente", class: "bg-gray-100 text-gray-700" },
  "In Progress": {
    text: "En progreso",
    class: "bg-yellow-100 text-yellow-700",
  },
  Completed: { text: "Completada", class: "bg-green-100 text-green-700" },
  Expired: { text: "Expirada", class: "bg-red-100 text-red-700" },
};

export function CapacitacionCard({
  capacitacion,
  onClick,
}: CapacitacionCardProps) {
  console.log("Desde el card: ", capacitacion);

  const key = (capacitacion.status.name || "Pending") as EstadoType;
  const badge = estadoBadge[key] || {
    text: "Desconocido",
    class: "bg-gray-200 text-gray-500",
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onClick={onClick}
    >
      {/* Imagen */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {/* Imagen de fondo */}
        <Image
          src={buildMediaUrl(capacitacion.trainings.url_image) ?? ""}
          alt={capacitacion.trainings.title}
          width={640}
          height={320}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          unoptimized
        />

        {/* Overlay con icono de play - SOLO visible en hover y NO completada */}
        {capacitacion.status?.name !== "Completed" && (
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300 flex items-center justify-center">
            <PlayCircle className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Badge de estado */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}
          >
            {badge.text}
          </span>
        </div>

        {/* Icono de completada */}
        {capacitacion.status?.name === "Completed" && (
          <div className="absolute top-3 left-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-2">
        <div className="mb-3">
          <span className="inline-block px-2 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded">
            {capacitacion.trainings.title}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {capacitacion.trainings.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              {capacitacion.trainings.duration_minutes.toString()} min
            </span>
          </div>
{/* 
          <Link
            href={`/user/capacitaciones/${capacitacion.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group/link"
          >
            {capacitacion.status?.name === "Completed"
              ? "Ver detalles"
              : "Iniciar"}
            <span className="group-hover/link:translate-x-1 transition-transform">
              →
            </span>
          </Link> */}
        </div>
      </div>
    </div>
  );
}
