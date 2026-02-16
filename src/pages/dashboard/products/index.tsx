"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Download, Upload, Settings } from "lucide-react";
import ProductModal from "@/components/products/productModal";
import ProductRow from "@/components/products/productRow";
import FilterDropdown from "@/components/products/filterDropdown";
import StatCard from "@/components/products/statCard";
import { useToast } from "@/hooks/useToast";
import { useProducts } from "@/hooks/useProductsP";
import ToastContainer from "@/components/products/ToastContainer";

export default function ProductsPage() {
  const { toasts, showToast, removeToast } = useToast();
  const { filteredProducts, loading, fetchProducts } = useProducts(showToast);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isNewBadgeActive, setIsNewBadgeActive] = useState(true);
  const [newBadgeHours, setNewBadgeHours] = useState(100);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleManualUpdate = async () => {
    try {
      showToast("info", 'Mise à jour des produits "Nouveau" en cours...');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}products/update-new-badge`, {
        method: "POST",
      });
      showToast("success", "Mise à jour terminée");
      fetchProducts();
    } catch (error) {
      showToast("error", "Erreur lors de la mise à jour");
    }
  };

  const displayedProducts = filteredProducts.filter((p: any) => {
    const matchesSearch =
      p.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nameAr && p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    const matchesStatus = statusFilter ? p.status === (statusFilter === "Active") : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
          <p className="text-base text-gray-500">
            Gérer votre catalogue de produits
          </p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
            <Upload size={16} /> Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
            <Download size={16} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
            <Settings size={16} />
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-600"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* --- Configuration Nouveau en Stock --- */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Nouveau en Stock</h2>
        <p className="text-sm text-gray-500">
          Gérer le badge "Nouveau" pour les produits récemment ajoutés ou mis à jour.
        </p>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isNewBadgeActive}
              onChange={(e) => setIsNewBadgeActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Activer la fonctionnalité</span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-700">Heures avant expiration</label>
          <input
            type="number"
            value={newBadgeHours}
            onChange={(e) => setNewBadgeHours(Number(e.target.value))}
            min={1}
            className="w-24 p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualUpdate}
            className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition"
          >
            Mettre à jour maintenant
          </button>
          <span className="text-sm text-gray-500">
            Mise à jour automatique toutes les heures à xx:30
          </span>
        </div>
      </div>

      {/* STATS  */}
      <StatCard products={filteredProducts} />

      {/* FILTER */}
      {/* FILTER BAR */}
<div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
  {/* Left: Search Input */}
  <div className="relative flex-1 max-w-xs">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder="Search products..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-9 pr-3 py-2 border rounded-md text-sm w-full"
    />
  </div>

  {/* Right: Filters */}
  <div className="flex items-center gap-3">
    {/* Category Dropdown */}
    <select
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
      className="border border-gray-300 rounded-md text-sm p-2"
    >
        <option value="">All Categories</option>
        <option value="Acceuil">Acceuil</option>
        <option value="Popin">Popin</option>
        <option value="Fruit Bio /Non traité">Fruit Bio /Non traité</option>
        <option value="Epicerie by Agritable">Epicerie by Agritable</option>
        <option value="Fruits">Fruits</option>
        <option value="Légumes Bio/Non traité">Légumes Bio/Non traité</option>
        <option value="Herbes Bio/Non traité">Herbes Bio/Non traité</option>
        <option value="Fruits Raisonnés">Fruits Raisonnés</option>
        <option value="Légumes Raisonnés">Légumes Raisonnés</option>
        <option value="Légumes">Légumes</option>
        <option value="Herbe Raisonnés">Herbe Raisonnés</option>
        <option value="Herbes">Herbes</option>
        <option value="Epicerie">Epicerie</option>
    </select>

    {/* Status Dropdown */}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="border border-gray-300 rounded-md text-sm p-2"
    >
      <option value="">All Status</option>
      <option value="Active">Active</option>
      <option value="Inactive">Low Stock</option>
      <option value="Inactive">Out of Stock</option>

    </select>
  </div>
</div>


      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
      <th className="p-4 text-left text-gray-600">ID</th>
      <th className="p-4 text-left text-gray-600">Nom</th>
      <th className="p-4 text-left text-gray-600">Catégorie</th>
      <th className="p-4 text-left text-gray-600">Min Qty</th>
      <th className="p-4 text-left text-gray-600">Max Qty</th>
      <th className="p-4 text-left text-gray-600">Stock</th>
      <th className="p-4 text-left text-gray-600">Alert</th>
      <th className="p-4 text-left text-gray-600">Status</th>
      <th className="p-4 text-left text-gray-600">Actions</th>
    </tr>
  </thead>

  <tbody>
    {!loading &&
      displayedProducts.map((product: any) => (
        <ProductRow
          key={product.id}
          product={product}
          onEdit={(p) => {
            setEditingProduct(p);
            setModalOpen(true);
          }}
          onDelete={() => fetchProducts()}
        />
      ))
    }
  </tbody>
</table>

      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchProducts}
          showToast={showToast}
        />
      )}
    </div>
  );
}
