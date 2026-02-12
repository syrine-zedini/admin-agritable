import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { productService } from "@/service/productP.service";

type ToastType = "success" | "error" | "info";

export function useProducts(
  showToast?: (type: ToastType, message: string) => void
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      showToast?.("info", "Chargement des produits...");

      const data = await productService.getAll();

      const list = data.data || [];

      setProducts(list);
      setFiltered(list);

      showToast?.("success", "Produits chargés");
    } catch (error) {
      console.error(error);
      showToast?.("error", "Erreur chargement produits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    filteredProducts,
    setFiltered,
    loading,
    fetchProducts,
  };
}
