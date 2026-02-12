"use client";

import { Toast } from "@/types/productP";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export default function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 min-w-[300px] p-4 rounded-lg shadow-lg border animate-slideIn ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {toast.type === "success" && (
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          )}
          {toast.type === "info" && (
            <Info size={20} className="text-blue-600 flex-shrink-0" />
          )}

          <span className="flex-1 text-sm font-medium">{toast.message}</span>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
