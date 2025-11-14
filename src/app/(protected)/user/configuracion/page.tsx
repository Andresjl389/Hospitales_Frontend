// src/app/(protected)/user/configuracion/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { Eye, EyeOff, Save } from "lucide-react";

export default function ConfiguracionPage() {
  const { user } = useAuth();

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    areaId: "",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Inicializar los valores cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      console.log("👤 Usuario cargado:", user);
      setUserData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        areaId: user.area?.id || "",
      });
    }
  }, [user]);

  const handlePersonalInfoSubmit = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (!user?.id) {
        throw new Error("No autorizado");
      }

      await userService.updateUserProfile(user.id, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        area_id: userData.areaId,
      });

      setMessage({
        type: "success",
        text: "Información actualizada correctamente",
      });
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al actualizar la información",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setIsLoading(true);
    setMessage(null);

    // Validaciones
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      setIsLoading(false);
      return;
    }

    try {
      if (!user?.id) {
        throw new Error("No autorizado");
      }

      await userService.changeUserPassword(
        user.id,
        passwords.current,
        passwords.new
      );

      setMessage({
        type: "success",
        text: "Contraseña cambiada correctamente",
      });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al cambiar la contraseña",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Administra tu información personal y seguridad
        </p>
      </div>

      {/* Mensajes de estado */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Foto de Perfil */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-4xl font-bold">
                  {user.first_name.charAt(0).toLocaleUpperCase()}
                  {user.last_name.charAt(0).toLocaleUpperCase()}
                </span>
              </div>

              {/* Nombre */}
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {user.first_name} {user.last_name}
              </h2>

              {/* Información adicional */}
              <div className="text-center space-y-2 mt-4 w-full">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Cédula</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.cedula || "No registrada"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Área</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.area.name}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Cargo</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {user.role.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Formularios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulario de Información Personal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar información personal
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={userData.firstName}
                    onChange={(e) =>
                      setUserData({ ...userData, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={userData.lastName}
                    onChange={(e) =>
                      setUserData({ ...userData, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={userData.email}
                    onChange={(e) =>
                      setUserData({ ...userData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handlePersonalInfoSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>

          {/* Formulario de Seguridad */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Seguridad
            </h3>

            <div className="space-y-4">
              {/* Contraseña actual */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres
                </p>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón Cambiar Contraseña */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handlePasswordSubmit}
                  disabled={
                    isLoading ||
                    !passwords.current ||
                    !passwords.new ||
                    !passwords.confirm
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Cambiando..." : "Cambiar Contraseña"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
