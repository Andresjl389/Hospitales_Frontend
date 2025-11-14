"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, description, duration = 4000 }: ToastOptions) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-3 w-72 max-w-full">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
};

const iconByType: Record<ToastType, JSX.Element> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const colorByType: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-700",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
};

const iconColorByType: Record<ToastType, string> = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div
      className={`flex items-start gap-3 border rounded-xl px-4 py-3 shadow-sm ${colorByType[toast.type ?? "info"]}`}
    >
      <div className={iconColorByType[toast.type ?? "info"]}>{iconByType[toast.type ?? "info"]}</div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{toast.title}</p>
        {toast.description && <p className="text-xs mt-1">{toast.description}</p>}
      </div>
      <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600">
        ✕
      </button>
    </div>
  );
}
