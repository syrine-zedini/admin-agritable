import { createClientB2C } from "@/service/clientsB2C.service";
import { useState } from "react";
import { Toast } from "@/types/productP";

export const useClientsB2C = (
  showToast?: (type: Toast["type"], message: string) => void // <-- optionnel
) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fonction de toast par défaut si showToast n'est pas défini
  const safeShowToast = showToast || ((type: Toast["type"], message: string) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  });

  const generateTemporaryPassword = () =>
    Math.random().toString(36).slice(-8) +
    Math.random().toString(36).slice(-8).toUpperCase();

  const addCustomer = async (formData: any) => {
    try {
      setLoading(true);
      setError("");

      const res = await createClientB2C({
        ...formData,
        password: generateTemporaryPassword(),
        roleName: "ClientB2C",
      });

      if (res.data) {
        setCustomers((prev) => [res.data, ...prev]);
        // 🔥 Déclenche le toast via safeShowToast
        safeShowToast(
          "success",
          `Client "${formData.firstName} ${formData.lastName}" créé avec succès !`
        );
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Erreur création client";
      setError(message);
      safeShowToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    setCustomers,
    loading,
    error,
    addCustomer,
  };
};
