'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { StatCard } from '@/components/cards/StatCard';
import { Card } from '@/components/ui/Card';
import { Users, BookOpen, ClipboardCheck, Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface AreaSummary {
  area: string;
  total: number;
  completadas: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usuarios: 0,
    capacitaciones: 0,
    asignaciones: 0,
    cumplimiento: 0,
  });
  const [resumenAreas, setResumenAreas] = useState<AreaSummary[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, trainings, assignments, areas] = await Promise.all([
          adminService.getUsers(),
          adminService.getTrainings(),
          adminService.getAssignments(),
          adminService.getAreas(),
        ]);

        const totalUsuarios = users.length;
        const totalCapacitaciones = trainings.length;
        const totalAsignaciones = assignments.length;

        const completadas = assignments.filter((a) =>
          a.status.name.toLowerCase().includes('complet')
        ).length;
        const cumplimiento = totalAsignaciones
          ? Math.round((completadas / totalAsignaciones) * 100)
          : 0;

        // Crear resumen por área
        const resumen = areas.map((area) => {
          const asigArea = assignments.filter((a) => a.area.id === area.id);
          const completadasArea = asigArea.filter((a) =>
            a.status.name.toLowerCase().includes('complet')
          ).length;
          return {
            area: area.name,
            total: asigArea.length,
            completadas: completadasArea,
          };
        });

        // Ordenar por cantidad de completadas (descendente)
        resumen.sort((a, b) => b.completadas - a.completadas);

        setStats({
          usuarios: totalUsuarios,
          capacitaciones: totalCapacitaciones,
          asignaciones: totalAsignaciones,
          cumplimiento,
        });

        setResumenAreas(resumen);
      } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Cargando panel de administrador...</p>
      </div>
    );
  }

  // Particionar áreas
  const topAreas = resumenAreas.slice(0, 5);
  const otherAreas = resumenAreas.slice(5);

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Panel de Administración</h1>
        <p className="text-gray-500">Resumen general del sistema</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Usuarios"
          value={stats.usuarios}
          icon={Users}
          color="blue"
          subtitle="Usuarios registrados"
        />
        <StatCard
          title="Capacitaciones"
          value={stats.capacitaciones}
          icon={BookOpen}
          color="orange"
          subtitle="Cursos disponibles"
        />
        <StatCard
          title="Asignaciones"
          value={stats.asignaciones}
          icon={ClipboardCheck}
          color="purple"
          subtitle="Asignaciones totales"
        />
        <StatCard
          title="Cumplimiento"
          value={`${stats.cumplimiento}%`}
          icon={Activity}
          color="green"
          subtitle="Tasa global de finalización"
        />
      </div>

      {/* Cumplimiento por área */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Cumplimiento por área
          </h2>

          {otherAreas.length > 0 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showAll ? (
                <>
                  Ver menos <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Ver todas <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {resumenAreas.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay datos disponibles</p>
        ) : (
          <div className="space-y-4 transition-all">
            {(showAll ? resumenAreas : topAreas).map((area) => {
              const porcentaje = area.total
                ? Math.round((area.completadas / area.total) * 100)
                : 0;

              return (
                <div
                  key={area.area}
                  className="border-b border-gray-100 pb-3 last:border-none"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{area.area}</span>
                    <span className="text-gray-600">{porcentaje}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {area.completadas} de {area.total} capacitaciones completadas
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
