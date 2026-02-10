"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Package, 
  Plus, 
  Edit2, 
  Trash2,
  X,
  ChevronDown,
  FolderTree,
  CheckCircle,
  AlertCircle,
  Search
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.children?.some(child => 
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.children?.some(grandchild => 
          grandchild.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    
    const matchesStatus = selectedStatus === 'all' || category.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-10 font-sans text-gray-900 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
              <FolderTree className="text-green-600" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Gestion des Catégories
            </h1>
          </div>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Organisez votre catalogue de produits avec des catégories et sous-catégories hiérarchisées
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white px-6 py-3.5 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold">Nouvelle Catégorie</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une catégorie ou sous-catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard 
          icon={<LayoutGrid className="text-emerald-500" size={22} />} 
          label="Total Catégories" 
          value={categories.length.toString()} 
          trend="up"
          color="emerald"
        />
        <StatCard 
          icon={<Package className="text-green-500" size={22} />} 
          label="Catégories Actives" 
          value={categories.filter(c => c.status === 'active').length.toString()} 
          trend="stable"
          color="green"
        />
        <StatCard 
          icon={<Package className="text-blue-500" size={22} />} 
          label="Total Produits" 
          value={categories.reduce((acc, c) => acc + (c.totalProducts || 0), 0).toString()} 
          trend="up"
          color="blue"
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredCategories.map((cat) => (
            <CategoryCard 
              key={cat.id} 
              category={cat} 
              onEdit={handleEdit} 
              onDelete={(cat) => setDeleteTarget(cat)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-50 rounded-2xl inline-flex mb-6">
              <LayoutGrid className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune catégorie trouvée</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedStatus !== 'all' 
                ? "Aucune catégorie ne correspond à vos critères de recherche"
                : "Commencez par créer votre première catégorie"}
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Plus size={16} />
              Créer une catégorie
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CreateCategoryModal 
          onClose={() => setShowModal(false)} 
          onCreated={handleCategoryCreated} 
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Modifier Catégorie</h2>
                <p className="text-sm text-gray-500 mt-1">Mettre à jour le nom de la catégorie</p>
              </div>
              <button 
                onClick={() => setEditTarget(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la catégorie
                </label>
                <input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setEditTarget(null)} 
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-sm"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100 animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmer la suppression</h2>
              <p className="text-gray-500">
                Êtes-vous sûr de vouloir supprimer la catégorie 
                <span className="font-semibold text-gray-900"> "{deleteTarget.name}"</span> ?
              </p>
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ Cette action est irréversible
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteTarget(null)} 
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-slideIn z-50">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// --- StatCard ---
function StatCard({ icon, label, value, trend, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    green: 'bg-green-50 border-green-100 text-green-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
  };

  return (
    <div className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-50'}`}>
          {icon}
        </div>
        {trend && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-100 text-green-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
    </div>
  );
}

// --- CategoryCard ---
function CategoryCard({ category, onDelete, onEdit }: { 
  category: Category; 
  onDelete: (cat: Category) => void; 
  onEdit: (cat: Category) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-gray-300">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
            <FolderTree size={18} className="text-gray-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{category.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                category.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {category.status === 'active' ? 'Actif' : 'Inactif'}
              </span>
              <span className="text-xs text-gray-500">
                • {category.children?.length || 0} sous-catégorie{category.children?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            onClick={() => onEdit(category)}
            title="Modifier"
          >
            <Edit2 size={16} />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            onClick={() => onDelete(category)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Réduire" : "Développer"}
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100">
            <div className="text-sm text-gray-500 font-medium mb-1">Total Produits</div>
            <div className="text-2xl font-bold text-gray-900">{category.totalProducts}</div>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100">
            <div className="text-sm text-gray-500 font-medium mb-1">Sous-catégories</div>
            <div className="text-2xl font-bold text-gray-900">{category.children?.length || 0}</div>
          </div>
        </div>

        {expanded && category.children && category.children.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ChevronDown size={14} />
              Sous-catégories
            </h4>
            <div className="space-y-3">
              {category.children.map((sub) => (
                <div key={sub.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{sub.name}</span>
                    <span className="text-sm font-bold text-gray-900">{sub.totalProducts || 0} produits</span>
                  </div>
                  {sub.children && sub.children.length > 0 && (
                    <div className="ml-4 space-y-2 mt-2">
                      {sub.children.map((sub2) => (
                        <div key={sub2.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{sub2.name}</span>
                          <span className="font-medium text-gray-700">{sub2.totalProducts || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {expanded && (!category.children || category.children.length === 0) && (
          <div className="text-center py-6 text-gray-400">
            <FolderTree size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune sous-catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- CreateCategoryModal ---
function CreateCategoryModal({ onClose, onCreated }: { 
  onClose: () => void; 
  onCreated?: (name?: string) => void;
}) {
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
    if (!name) { 
      alert("Nom requis"); 
      return; 
    }
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-slideUp">
        <div className="p-6 flex justify-between items-start border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Créer une nouvelle catégorie</h2>
            <p className="text-gray-500 mt-1">
              Ajouter une catégorie principale ou une sous-catégorie
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Parent Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie Parente
            </label>
            <div className="relative">
              <select
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              >
                <option value="">📁 Catégorie Racine (Principale)</option>
                {parents.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.totalProducts ? `(${cat.totalProducts} produits)` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronDown size={18} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Sélectionnez une catégorie parente pour créer une sous-catégorie
            </p>
          </div>

          {/* Language Tabs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue du nom
            </label>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['French', 'Arabic', 'Tunisian'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la catégorie
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Entrez le nom en ${activeTab}...`}
              className="w-full border border-gray-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all placeholder-gray-400"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button 
              onClick={handleCreate} 
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Créer la catégorie
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;