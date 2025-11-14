"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Modal from "./Modal";
import { Button } from "./Button";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "default";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

type Resolver = (value: boolean) => void;

export const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      setIsOpen(false);
      resolver?.(result);
      setResolver(null);
    },
    [resolver]
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal isOpen={isOpen} onClose={() => handleClose(false)}>
        <div className="p-6 space-y-4 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {options.title ?? "¿Estás seguro?"}
          </h2>
          <p className="text-sm text-gray-600">
            {options.description ?? "Esta acción no se puede deshacer."}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => handleClose(false)}>
              {options.cancelText ?? "Cancelar"}
            </Button>
            <Button
              variant={options.tone === "danger" ? "danger" : "primary"}
              onClick={() => handleClose(true)}
            >
              {options.confirmText ?? "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
  }
  return context.confirm;
};
