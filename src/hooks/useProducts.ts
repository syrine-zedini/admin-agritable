import axiosInstance from "@/lib/axios";
import { Product } from "../types/product";
import { useQuery } from "@tanstack/react-query";
import { PricingSpreadsheetRow } from "../types/pricingSpreadsheetRow";

// ─── fetch all products ───────────────────────────────────────────────────────
const fetchProducts = async (): Promise<PricingSpreadsheetRow[]> => {
  const res = await axiosInstance.get("/products");
  return res.data.data.products;

};

// ─── fetch a single product by id ────────────────────────────────────────────
const fetchProductById = async (id: string): Promise<PricingSpreadsheetRow> => {
  const res = await axiosInstance.get(`/products/${id}`);
  return res.data.data ?? res.data;
};

// ─── useProducts (simple) ────────────────────────────────────────────────────
export const useProducts = () => {
  return useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });
};

// ─── params ──────────────────────────────────────────────────────────────────
interface UsePricingSpreadsheetRowParams {
  categoryId?: string;
  search?: string;
  lowStockFilter?: boolean;
  isActiveFilter?: boolean | null;
}

// ─── usePricingSpreadsheetRow ─────────────────────────────────────────────────
export const usePricingSpreadsheetRow = (params?: UsePricingSpreadsheetRowParams) => {
  const query = useQuery<PricingSpreadsheetRow[], Error>({
    queryKey: ["pricingSpreadsheetRow"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  const allData: PricingSpreadsheetRow[] = Array.isArray(query.data) ? query.data : [];

  // ── filtrage client-side ──────────────────────────────────────────────────
  let filtered = allData;

  if (params?.categoryId) {
    filtered = filtered.filter(p => p.categoryId === params.categoryId);
  }

  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p => p.nameFr?.toLowerCase().includes(q));
  }

  if (params?.lowStockFilter) {
    filtered = filtered.filter(p => p.stockQuantity != null && p.stockQuantity < 5);
  }

  if (params?.isActiveFilter != null) {
    filtered = filtered.filter(p => p.isActive === params.isActiveFilter);
  }

  // ── stats ─────────────────────────────────────────────────────────────────
  const lowStockCount = allData.filter(p => p.stockQuantity != null && p.stockQuantity < 5).length;
  const activeStockCount = allData.filter(p => p.isActive).length;
  const inActiveStockCount = allData.filter(p => !p.isActive).length;

  // ── fetchOnlyOneRow ───────────────────────────────────────────────────────
  const fetchOnlyOneRow = async (id: string): Promise<PricingSpreadsheetRow> => {
    return fetchProductById(id);
  };

  return {
    data: filtered,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchOnlyOneRow,
    lowStockCount,
    activeStockCount,
    inActiveStockCount,
  };
};