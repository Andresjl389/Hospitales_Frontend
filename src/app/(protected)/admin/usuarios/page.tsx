"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { adminService } from "@/services/adminService";
import { User } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import Modal from "@/components/ui/Modal";

type AreaOption = {
  id: string;
  name: string;
};

type RoleOption = {
  id: string;
  name: string;
};

type UserFormState = {
  firstName: string;
  lastName: string;
  cedula: string;
  email: string;
  password: string;
  areaId: string;
  roleId: string;
};

type ModalMode = "create" | "edit";

const INITIAL_FORM_STATE: UserFormState = {
  firstName: "",
  lastName: "",
  cedula: "",
  email: "",
  password: "",
  areaId: "",
  roleId: "",
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-pink-500",
];

const getInitials = (user: User) => {
  const names = `${user.first_name} ${user.last_name}`.trim().split(" ");
  const [first = "", second = ""] = names;
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
};

const getAvatarColor = (index: number) =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { user: currentAdmin } = useAuth();
  const [entries, setEntries] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<ModalMode>("create");
  const [formData, setFormData] = useState<UserFormState>(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const getInputClasses = (hasError?: boolean) =>
    `w-full border ${
      hasError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
    } rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2`;

  const handleOpenModal = (user?: User) => {
    if (user) {
      setFormMode("edit");
      setSelectedUser(user);
      setFormData({
        firstName: user.first_name ?? "",
        lastName: user.last_name ?? "",
        cedula: user.cedula ?? "",
        email: user.email ?? "",
        password: "",
        areaId: user.area?.id ?? "",
        roleId: user.role?.id ?? "",
      });
    } else {
      setFormMode("create");
      setSelectedUser(null);
      setFormData({ ...INITIAL_FORM_STATE });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormErrors({});
    setFormData({ ...INITIAL_FORM_STATE });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersResponse, areasResponse, rolesResponse] = await Promise.all([
          adminService.getUsers(),
          adminService.getAreas(),
          adminService.getRoles(),
        ]);
        setUsers(usersResponse);
        setAreas(areasResponse);
        setRoles(rolesResponse);
      } catch (err) {
        console.error("❌ Error obteniendo usuarios:", err);
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cargar la información.";
        setError(message);
        showToast({
          type: "error",
          title: "Error al cargar usuarios",
          description: message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedArea]);

  const handleDelete = async (user: User) => {
    const confirmed = await confirm({
      title: "Eliminar usuario",
      description: `¿Deseas eliminar a ${user.first_name} ${user.last_name}? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    });
    if (!confirmed) return;

    setDeletingId(user.id);

    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      showToast({
        type: "success",
        title: "Usuario eliminado",
        description: `${user.first_name} ${user.last_name} fue eliminado correctamente.`,
      });
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error);
      showToast({
        type: "error",
        title: "Error al eliminar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el usuario.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleInputChange =
    (field: keyof UserFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const validateForm = () => {
    const errors: Partial<Record<keyof UserFormState, string>> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "El nombre es obligatorio";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "El apellido es obligatorio";
    }
    if (!formData.cedula.trim()) {
      errors.cedula = "La cédula es obligatoria";
    }
    if (!formData.email.trim()) {
      errors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Correo inválido";
    }
    if (formMode === "create") {
      if (!formData.password.trim()) {
        errors.password = "La contraseña es obligatoria";
      } else if (formData.password.trim().length < 6) {
        errors.password = "Mínimo 6 caracteres";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      if (formMode === "create") {
        const newUser = await adminService.createUser({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          cedula: formData.cedula.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          area_id: formData.areaId ? formData.areaId : null,
          role_id: formData.roleId ? formData.roleId : null,
        });
        setUsers((prev) => [newUser, ...prev]);
        showToast({
          type: "success",
          title: "Usuario creado",
          description: `${newUser.first_name} ${newUser.last_name} fue registrado correctamente`,
        });
        handleCloseModal();
      } else if (selectedUser) {
        const updatedUser = await adminService.updateUser(selectedUser.id, {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          cedula: formData.cedula.trim(),
          email: formData.email.trim(),
          area_id: formData.areaId ? formData.areaId : null,
          role_id: formData.roleId ? formData.roleId : null,
        });
        setUsers((prev) =>
          prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );
        showToast({
          type: "success",
          title: "Usuario actualizado",
          description: `${updatedUser.first_name} ${updatedUser.last_name} fue actualizado correctamente`,
        });
        handleCloseModal();
      }
    } catch (error) {
      console.error("❌ Error guardando usuario:", error);
      showToast({
        type: "error",
        title: "Error al guardar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la información del usuario",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        user.first_name.toLowerCase().includes(lowerSearch) ||
        user.last_name.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch);
      const matchesArea =
        selectedArea === "all" ||
        user.area?.id === selectedArea ||
        (!user.area && selectedArea === "none");
      return matchesSearch && matchesArea;
    });
  }, [users, search, selectedArea]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / entries));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * entries;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + entries);

  const rangeStart = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + entries, filteredUsers.length);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-md flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-semibold">
            {currentAdmin ? getInitials(currentAdmin) : "AD"}
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-white/80">
              Administrador
            </p>
            <h1 className="text-2xl font-semibold">
              {currentAdmin
                ? `${currentAdmin.first_name} ${currentAdmin.last_name}`
                : "Panel de Usuarios"}
            </h1>
          </div>
        </div>
        <div className="text-sm text-white/90">
          Gestiona los usuarios, áreas y accesos desde este módulo.
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm text-gray-700 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedArea}
              onChange={(e) =>
                setSelectedArea(e.target.value as "all" | string)
              }
              className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todas las áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Cargando usuarios...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No se encontraron usuarios.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-600 uppercase tracking-wide text-xs">
                  <tr>
                    <th className="py-2 px-4">Usuario</th>
                    <th className="py-2 px-4">Email</th>
                    <th className="py-2 px-4">Área</th>
                    <th className="py-2 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-semibold ${getAvatarColor(
                              idx
                            )}`}
                          >
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.role?.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.area?.name ?? "Sin área"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-3 text-gray-400">
                          <button
                            className="hover:text-blue-600"
                            title="Editar"
                            onClick={() => handleOpenModal(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="hover:text-red-600 disabled:opacity-40"
                            title="Eliminar"
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.id}
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

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600 mt-4">
              <p>
                Mostrando {rangeStart} - {rangeEnd} de {filteredUsers.length}{" "}
                usuarios
              </p>
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
              <div className="flex items-center gap-2">
                <button
                  disabled={safePage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={`px-4 py-1.5 rounded-full border ${
                    safePage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  ← Anterior
                </button>
                <button
                  disabled={
                    safePage === totalPages || filteredUsers.length === 0
                  }
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={`px-4 py-1.5 rounded-full border ${
                    safePage === totalPages || filteredUsers.length === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {showModal ? (
        <Modal isOpen={showModal} onClose={handleCloseModal}>
          <div className="bg-white">
            <div className="relative h-32 bg-gradient-to-r from-blue-700 to-blue-500">
              <div className="absolute inset-0 px-6 py-6 text-white flex flex-col justify-end">
                <p className="text-sm uppercase tracking-wide text-white/80">
                  {formMode === "create" ? "Registrar usuario" : "Editar usuario"}
                </p>
                <h2 className="text-2xl font-semibold">
                  {formMode === "create"
                    ? "Nuevo usuario"
                    : `${formData.firstName || selectedUser?.first_name || ""} ${
                        formData.lastName || selectedUser?.last_name || ""
                      }`}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-lg text-gray-700"
              >
                <span className="text-xl font-bold">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    className={getInputClasses(!!formErrors.firstName)}
                    placeholder="Juan"
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    className={getInputClasses(!!formErrors.lastName)}
                    placeholder="Pérez"
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={handleInputChange("cedula")}
                    className={getInputClasses(!!formErrors.cedula)}
                    placeholder="1234567890"
                  />
                  {formErrors.cedula && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.cedula}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    className={getInputClasses(!!formErrors.email)}
                    placeholder="correo@hospital.com"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={handleInputChange("roleId")}
                    className={getInputClasses(false)}
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área asignada (opcional)
                  </label>
                  <select
                    value={formData.areaId}
                    onChange={handleInputChange("areaId")}
                    className={getInputClasses(false)}
                  >
                    <option value="">Sin área asignada</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formMode === "create" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña temporal
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    className={getInputClasses(!!formErrors.password)}
                    placeholder="••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se enviará al usuario para su primer ingreso.
                  </p>
                  {formErrors.password && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>
                  )}
                </div>
              ) : (null
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  isLoading={submitting}
                >
                  {formMode === "create" ? "Crear usuario" : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
