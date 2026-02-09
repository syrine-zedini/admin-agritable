"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Package, 
  Plus, 
  Edit2, 
  Trash2,
  X,
  ChevronDown
} from 'lucide-react';

// --- Types ---
interface Subcategory {
  id: string;
  name: string;
  totalProducts?: number;
  children?: Subcategory[];
}

interface Category {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  totalProducts: number;
  children?: Category[];
}

const EMPTY_CATEGORIES: Category[] = [];

function CategoryPage() {

  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>(EMPTY_CATEGORIES);
  const [toast, setToast] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}categories`);
      const json = await res.json();
      const allCategories: Category[] = json.data || [];
      setCategories(allCategories);
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- EDIT ---
  const handleEdit = (category: Category) => {
    setEditTarget(category);
    setEditName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}categories/${editTarget.id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur modification');

      showToast(`✅ Catégorie "${editName}" modifiée !`);
      setEditTarget(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCategoryCreated = (name?: string) => {
    fetchCategories();
    if (name) showToast(`✅ Catégorie "${name}" créée !`);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 lg:p-10 font-sans text-slate-900 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organisez vos produits en catégories et sous-catégories
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl font-medium text-sm shadow-md transition-all hover:scale-105"
        >
          <Plus size={18} strokeWidth={2.5} />
          Ajouter une catégorie
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard 
          icon={<LayoutGrid className="text-green-500" size={20} />} 
          label="Total Categories" 
          value={categories.length.toString()} 
        />
        <StatCard 
          icon={<Package className="text-green-500" size={20} />} 
          label="Active Categories" 
          value={categories.filter(c => c.status==='active').length.toString()} 
        />
        <StatCard 
          icon={<Package className="text-blue-500" size={20} />} 
          label="Total Products" 
          value={categories.reduce((acc, c)=> acc + (c.totalProducts || 0),0).toString()} 
        />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <CategoryCard 
            key={cat.id} 
            category={cat} 
            onEdit={handleEdit} 
            onDelete={(cat) => setDeleteTarget(cat)}
          />
        ))}
      </div>

      {/* Modals */}
      {showModal && (
        <CreateCategoryModal 
          onClose={() => setShowModal(false)} 
          onCreated={handleCategoryCreated} 
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Modifier Catégorie</h2>
            <input 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">⚠ Supprimer cette catégorie ?</h2>
            <p className="text-sm text-gray-500 mb-6">
              La catégorie "{deleteTarget.name}" sera supprimée.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteTarget(null)} 
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}categories/${deleteTarget.id}?deleteAllProduct=true`, {
                      method: 'DELETE',
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Erreur suppression');

                    showToast(`✅ Catégorie "${deleteTarget.name}" supprimée !`);
                    setDeleteTarget(null);
                    fetchCategories();
                  } catch (err: any) {
                    alert(err.message);
                  }
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg animate-slide-in">
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

// --- StatCard ---
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md flex items-center gap-5 hover:shadow-lg transition-all">
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">{icon}</div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-[12px] text-gray-400 font-medium mt-1">{label}</div>
      </div>
    </div>
  );
}

// --- CategoryCard ---
function CategoryCard({ category, onDelete, onEdit }: { category: Category, onDelete: (cat: Category) => void, onEdit: (cat: Category) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col transition-all hover:shadow-xl hover:scale-[1.02] duration-300">
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-800 text-[15px]">{category.name}</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
            category.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-500'
          }`}>
            {category.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
            onClick={() => onEdit(category)}
          >
            <Edit2 size={14} />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
            onClick={() => onDelete(category)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="bg-[#f8fafc] flex justify-between items-center px-4 py-2.5 rounded-lg border border-gray-100">
          <span className="text-[13px] font-medium text-gray-600">Total Products</span>
          <span className="text-sm font-bold text-gray-800">{category.totalProducts}</span>
        </div>

        <div>
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Subcategories
          </h4>
          <ul className="text-[13px] text-gray-700 pl-3 list-disc">
            {category.children && category.children.length > 0 ? (
              category.children.map((sub) => (
                <li key={sub.id}>
                  {sub.name} ({sub.totalProducts || 0})
                  {sub.children && sub.children.length > 0 && (
                    <ul className="pl-5 list-disc text-gray-600">
                      {sub.children.map((sub2) => (
                        <li key={sub2.id}>{sub2.name} ({sub2.totalProducts || 0})</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))
            ) : (
              <li className="text-gray-400 italic">Aucune sous-catégorie</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Modal (inchangé) ---
function CreateCategoryModal({ onClose, onCreated }: { onClose: () => void; onCreated?: (name?: string) => void }) {
  const [activeTab, setActiveTab] = useState('French');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}categories`)
      .then(res => res.json())
      .then(data => setParents(data.data || []))
      .catch(err => console.error(err));
  }, []);

  const handleCreate = async () => {
    if (!name) { alert("Nom requis"); return; }
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parentId || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (onCreated) onCreated(name);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg overflow-hidden border border-gray-200">

        <div className="p-5 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Créer une Catégorie</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ajouter une nouvelle catégorie de produit
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catégorie Parente
            </label>
            <div className="relative">
              <select
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full appearance-none bg-white border border-green-500 rounded-lg px-4 py-2.5"
              >
                <option value="">Aucune (Catégorie Racine)</option>
                {parents.map((cat:any)=>(<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['French', 'Arabic', 'Tunisian'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div>
            <input
              type="text"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              placeholder={`Nom de la catégorie (${activeTab})`}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-50">
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
            <button onClick={handleCreate} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-all">
              {loading ? "Création..." : "Créer"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
