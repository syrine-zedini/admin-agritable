"use client";
import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Product } from "@/types/product";
import { categories } from "@/data/categories";
import { useToast } from "@/hooks/useToast";
import { productService } from "@/services/productP.service";
import ConfirmModal from "./confirmSupModal";

export default function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

const categoryName = (() => {
  const cat = categories.find(c => c.id === product.categoryId || String(c.id) === String(product.categoryId));
  return cat?.name || "Unknown";
})();



  const stockStatus =
    product.stockQuantity === 0
      ? { label: "Out of Stock", color: "bg-red-500" }
      : product.stockQuantity <= product.lowStockAlert
      ? { label: "Low Stock", color: "bg-orange-500" }
      : { label: "In Stock", color: "bg-green-500" };

  const handleDelete = async () => {
    try {
      await productService.delete(product.id);
      onDelete(product.id);
      showToast("success", `Produit "${product.nameFr}" supprimé avec succès !`);
    } catch (error) {
      console.error(error);
      showToast("error", "Échec de la suppression du produit.");
    } finally {
      setConfirmOpen(false); 
    }
  };

  return (
    <>
      {/* Ligne du produit */}
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="p-4 text-gray-500">{product.id.substring(0, 8)}...</td>

        <td className="p-4 font-medium flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.nameFr}
                className="w-full h-full object-cover"
              />
            ) : (
              "IMG"
            )}
          </div>
          {product.nameFr}
        </td>

        <td className="p-4">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
            {categoryName}
          </span>
        </td>

        <td className="p-4">-</td>
        <td className="p-4">-</td>

        <td className="p-4 font-medium">{product.stockQuantity}</td>
        <td className="p-4 text-gray-400">N/A</td>

        <td className="p-4">
          <span
            className={`px-2 py-1 ${stockStatus.color} text-white text-[10px] rounded-md font-bold uppercase`}
          >
            {stockStatus.label}
          </span>
        </td>

        <td className="p-4">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(product)}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              <Edit2 size={16} />
            </button>

            <button
              onClick={() => setConfirmOpen(true)} 
              className="text-red-600 hover:text-red-800 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer "${product.nameFr}" ?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
