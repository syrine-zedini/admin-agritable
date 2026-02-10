import { useEffect, useState, useCallback } from "react";
import { SpreadsheetStatistics } from "../types/pricing-spreadsheet";
import { supabase } from "@/lib/supabase";

export const usePricingStatistics = () => {
    const [statistics, setStatistics] = useState<SpreadsheetStatistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.rpc("get_pricing_statistics");

        if (error) {
            setError(error.message);
        } else {
            setStatistics(data);
        }

        setLoading(false);
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
