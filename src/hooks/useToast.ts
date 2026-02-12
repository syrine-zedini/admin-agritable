import { Toast } from "@/types/productP";
import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 2000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}
