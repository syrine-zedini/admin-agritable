import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PricingSpreadsheetRow {
    product_id: string;
    sku: string;
    product_name: string;
    is_active: boolean;
    category_id: string | null;
    category_name: string | null;
    purchase_unit: string;
    b2c_selling_quantity: number | null;
    b2c_selling_unit: string | null;
    b2c_ratio: number;
    b2b_selling_quantity: number | null;
    b2b_selling_unit: string | null;
    b2b_ratio: number;
    purchase_price: number;
    b2c_multiplier: number;
    b2c_prix_de_vente_calculated: number;
    prix_sur_site: number | null;
    has_price_override: boolean;
    b2b_multiplier: number;
    b2b_base_price: number;
    b2b_price_calculated: number;
    stock: number;
    low_stock_threshold: number | null;
    moq: number | null;
    besoin: number | null;
    commande: number | null;
    ordering_info: string | null;
    stock_warehouse: number | null;
    primary_supplier_id: string | null;
    supplier_name: string | null;
    supplier_is_active: boolean | null;
    last_supply_date: string | null;
    assigned_deliverer_id: string | null;
    deliverer_name: string | null;
    pickup_date: string | null;
    created_at: string;
    updated_at: string;
    po_status: string | null;
    po_number: number | null;
    discount: number
}

interface UsePricingSpreadsheetOptions {
    pageSize?: number;
    categoryId?: string;
    search?: string;
    lowStockFilter?: boolean
    isActiveFilter?: boolean | null
}


export const usePricingSpreadsheet = ({
    categoryId,
    search,
    lowStockFilter = false,
    isActiveFilter
}: UsePricingSpreadsheetOptions) => {
    const [data, setData] = useState<PricingSpreadsheetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [activeStockCount, setActiveStockCount] = useState(0);
    const [inActiveStockCount, setInActiveStockCount] = useState(0);

    // 🔹 Fetch LOW STOCK COUNT (temporary client-side)
    useEffect(() => {
        const fetchLowStockCount = async () => {
            const { data, error } = await supabase
                .from('pricing_spreadsheet_data')
                .select('stock, low_stock_threshold');

            if (error) return;

            const count =
                data?.filter(
                    r =>
                        r.low_stock_threshold !== null &&
                        r.stock < r.low_stock_threshold
                ).length ?? 0;

            setLowStockCount(count);
        };
        const fetchActiveAndInactiveStockCount = async () => {
            // Active products
            const { count: activeCount, error: activeError } = await supabase
                .from('pricing_spreadsheet_data')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (activeError) return;

            // Inactive products
            const { count: inactiveCount, error: inactiveError } = await supabase
                .from('pricing_spreadsheet_data')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', false);

            if (inactiveError) return;
            setInActiveStockCount(inactiveCount)
            setActiveStockCount(activeCount);
        };


        fetchLowStockCount();
        fetchActiveAndInactiveStockCount()
    }, []);

    // 🔹 Fetch ALL DATA (no pagination)
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('pricing_spreadsheet_data')
                .select(`
                    product_id,
                    sku,
                    product_name,
                    is_active,
                    category_id,
                    category_name,
                    purchase_unit,
                    b2c_selling_quantity,
                    b2c_selling_unit,
                    b2c_ratio,
                    b2b_selling_quantity,
                    b2b_selling_unit,
                    b2b_ratio,
                    purchase_price,
                    b2c_multiplier,
                    b2c_prix_de_vente_calculated,
                    prix_sur_site,
                    has_price_override,
                    b2b_multiplier,
                    b2b_base_price,
                    b2b_price_calculated,
                    stock,
                    low_stock_threshold,
                    moq,
                    besoin,
                    commande,
                    ordering_info,
                    stock_warehouse,
                    primary_supplier_id,
                    supplier_name,
                    supplier_is_active,
                    last_supply_date,
                    assigned_deliverer_id,
                    deliverer_name,
                    pickup_date,
                    created_at,
                    updated_at,
                    po_status,
                    po_number,
                    discount
                `)
                .order('product_name', { ascending: true });

            if (categoryId) query = query.eq('category_id', categoryId);
            if (search?.trim()) query = query.ilike('product_name', `%${search}%`);
            const { data: rows, error } = await query;
            if (error) throw error;

            let result = rows ?? [];

            if (lowStockFilter) {
                result = result.filter(
                    r =>
                        r.low_stock_threshold !== null &&
                        r.stock < r.low_stock_threshold
                );
            }
            if (isActiveFilter != null) {
                result = result.filter((r) => r.is_active === isActiveFilter)
            }

            setData(result);
            setTotalCount(result.length);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [categoryId, search, lowStockFilter, isActiveFilter]);

    // 🔹 Refetch when filters change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 🔹 Fetch ONE ROW (for trigger sync)
    const fetchRowByProductId = async (productId: string) => {
        const { data, error } = await supabase
            .from('pricing_spreadsheet_data')
            .select('*')
            .eq('product_id', productId)
            .single();

        if (error) throw error;
        return data;
    };

    // 🔹 Sync ONE ROW locally
    const syncRowByProductId = async (productId: string) => {
        const updatedRow = await fetchRowByProductId(productId);

        setData(prev =>
            prev.map(row =>
                row.product_id === productId ? updatedRow : row
            )
        );
    };

    return {
        data,
        loading,
        error,
        totalCount,
        lowStockCount,
        activeStockCount,
        inActiveStockCount,
        refetch: fetchData,
        fetchOnlyOneRow: fetchRowByProductId,
        syncRowByProductId
    };
};
