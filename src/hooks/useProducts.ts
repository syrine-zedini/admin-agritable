import axiosInstance from "@/lib/axios";
import { Product } from "../types/product";

import { useQuery } from "@tanstack/react-query";
import { PricingSpreadsheetRow } from "../types/pricingSpreadsheetRow";

const fetchProducts = async (): Promise<Product[]> => {
    const res = await axiosInstance.get("/products");
    return res.data.data; 
};
export const useProducts = () => {
    return useQuery<Product[], Error>({
        queryKey: ["products"],
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 5, 
    });
};
export const usePricingSpreadsheetRow = () => {
    return useQuery<PricingSpreadsheetRow[], Error>({
        queryKey: ["pricingSpreadsheetRow"],
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 5, 
    });
}