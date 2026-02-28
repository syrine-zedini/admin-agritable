import { useEffect, useState, useCallback } from "react";
import { SpreadsheetStatistics } from "@/types/pricingSpreadsheet";
import axios from "axios";

// Valeurs par défaut pour les statistiques
const defaultStatistics: SpreadsheetStatistics = {
  total_products: 0,
  active_products: 0,
  products_with_suppliers: 0,
  products_with_b2b_pricing: 0,
  low_stock_products: 0,
  out_of_stock_products: 0,
  total_b2b_clients: 0,
  avg_b2c_margin: 0,
  avg_b2b_margin: 0,
};

export const usePricingStatistics = () => {
  const [statistics, setStatistics] = useState<SpreadsheetStatistics>(defaultStatistics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<SpreadsheetStatistics>(
        "http://localhost:3030/api/pricing/statistics" // à remplacer aprés n'oublie pas ...........
      );

      setStatistics(response.data || defaultStatistics);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erreur inconnue");
      setStatistics(defaultStatistics); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
};