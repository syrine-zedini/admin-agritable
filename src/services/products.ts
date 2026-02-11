import axiosInstance from "@/lib/axios";
import { Product } from "../types/product";
import { PricingSpreadsheetRow } from "../types/pricingSpreadsheetRow";

export const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
    try {
        const res = await axiosInstance.put(`/products/${id}`, data);
        // Assuming your API returns { success, message, data }
        return res.data.data;
    } catch (error: any) {
        console.error("Failed to update product:", error.response?.data?.message || error.message);
        throw error;
    }
};


export const findProductById = async (id: string): Promise<PricingSpreadsheetRow> => {
    try {
        const res = await axiosInstance.get(`/products/${id}`);
        // Assuming your API returns { success, message, data }
        return res.data.data;
    } catch (error: any) {
        console.error("Failed to update product:", error.response?.data?.message || error.message);
        throw error;
    }
};