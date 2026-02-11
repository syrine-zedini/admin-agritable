"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

interface CreateCategoryModalProps {
  onClose: () => void;
  onCreated?: (name?: string) => void;
}

export default function CreateCategoryModal({ onClose, onCreated }: CreateCategoryModalProps) {
  const [activeTab, setActiveTab] = useState<'French' | 'Arabic' | 'Tunisian'>('French');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}categories`)
      .then(res => res.json())
      .then(data => setParents(data.data || []))
      .catch(err => console.error(err));
  }, []);

  const handleCreate = async () => {
  if (!name) { alert("Nom requis"); return; }
  setLoading(true);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // ⚡ Notifier le parent via le callback
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

        {/* Header */}
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

        {/* Body */}
        <div className="px-5 pb-6 space-y-5">

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie Parente</label>
            <div className="relative">
              <select
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full appearance-none bg-white border border-green-500 rounded-lg px-4 py-2.5"
              >
                <option value="">Aucune (Catégorie Racine)</option>
                {parents.map((cat:any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Language Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['French','Arabic','Tunisian'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Name Input */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              placeholder={`Nom de la catégorie (${activeTab})`}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-50">
            <button 
              onClick={onClose} 
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Annuler
            </button>
            <button 
              onClick={handleCreate} 
              disabled={loading} 
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-all"
            >
              {loading ? "Création..." : "Créer"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
