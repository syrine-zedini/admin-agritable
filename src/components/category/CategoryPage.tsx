"use client";

import { useState } from "react";
import { LayoutGrid, Package, Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import CreateCategoryModal from "./createCategoryModal";
import StatCard from "./statCard";
import CategoryCard from "./categoryCard";
import { CategoryExtended } from "@/types/category";

export default function CategoryPage() {
  const { categories, toast, addCategory, editCategory, removeCategory } = useCategories();
  
  const categoriesExtended: CategoryExtended[] = categories as CategoryExtended[];
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryExtended | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CategoryExtended | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleEdit = (c: CategoryExtended) => { setEditTarget(c); setEditName(c.name); };
  const handleSaveEdit = async () => { 
    if (editTarget) { 
      await editCategory(editTarget.id, editName); 
      setEditTarget(null); 
    } 
  };
  const handleDelete = async () => { 
    if (deleteTarget) { 
      await removeCategory(deleteTarget.id); 
      setDeleteTarget(null); 
    } 
  };

  const handleCategoryCreated = async (name?: string) => {
    if (name) {
      setToastMessage(`✅ Catégorie "${name}" créée !`);
      setTimeout(() => setToastMessage(null), 3000);
      await addCategory(name); 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-8 font-sans text-slate-900 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-600 mt-1">Organisez vos produits en catégories et sous-catégories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-3xl font-semibold text-sm shadow-xl transition-all hover:scale-105"
        >
          <Plus size={18} strokeWidth={2.5} /> Ajouter une catégorie
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          icon={<LayoutGrid className="text-green-600" size={20} />} 
          label="Total Categories" 
          value={categoriesExtended.length.toString()} 
        />
        <StatCard 
          icon={<Package className="text-blue-500" size={20} />} 
          label="Active Categories" 
          value={categoriesExtended.filter(c => c.status === 'active').length.toString()} 
        />
        <StatCard 
          icon={<Package className="text-purple-500" size={20} />} 
          label="Total Products" 
          value={categoriesExtended.reduce((acc, c) => acc + (c.totalProducts || 0), 0).toString()} 
        />
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {categoriesExtended.map(c => (
          <CategoryCard key={c.id} category={c} onEdit={handleEdit} onDelete={setDeleteTarget} onAdd={() => setShowModal(true)}/>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && <CreateCategoryModal onClose={() => setShowModal(false)} onCreated={handleCategoryCreated} />}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Modifier Catégorie</h2>
            <input 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              className="w-full border border-gray-300 rounded-xl px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500" 
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} className="px-5 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">Annuler</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-red-600">⚠ Supprimer cette catégorie ?</h2>
            <p className="text-sm text-gray-500 mb-6">La catégorie "{deleteTarget.name}" sera supprimée.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border rounded-xl hover:bg-gray-50 transition-all">Annuler</button>
              <button onClick={handleDelete} className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white px-5 py-3 rounded-3xl shadow-2xl animate-slide-in z-50">
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in { 
          0% { transform: translateX(100%); opacity: 0; } 
          100% { transform: translateX(0); opacity: 1; } 
        }
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}
