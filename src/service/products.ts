import axiosInstance from "@/lib/axios";
import { Product } from "../types/product";
import { PricingSpreadsheetRow } from "../types/pricingSpreadsheetRow";

export const updateProduct = async (
  id: string,
  api_data: Partial<Product>): Promise<Product> => {

  const url = `/products/${id}`;
  try {
    const res = await axiosInstance.put(url, api_data);
    // Retourner l'objet produit mis à jour
    return res.data.data;
  } catch (error: any) {
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else {
      console.error("No response from server:", error.message);
    }

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