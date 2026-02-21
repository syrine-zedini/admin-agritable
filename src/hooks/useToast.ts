import { Toast } from "@/types/productP";
import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (type: Toast["type"], message: string) => {
    const id = crypto.randomUUID(); 

    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  return { toasts, showToast, removeToast };
}
