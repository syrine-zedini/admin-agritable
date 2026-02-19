import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, Download, MoreVertical, RefreshCw, EyeOff, LayoutGrid, Users } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const { id } = router.query; // id = userId
  const userId = typeof id === 'string' ? id : '';
  const [activeTab, setActiveTab] = useState('toutes');

  

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History </h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-red-400 hover:bg-red-50 rounded-lg border border-gray-200"><EyeOff size={18} /></button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200"><RefreshCw size={18} /></button>
        </div>
      </div>

      {/* Alert / Filter Info */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-emerald-800 text-sm">
          <Users size={16} />
          <span>Affichage des commandes pour <strong>{userId}</strong></span>
        </div>
        <button className="text-xs text-gray-500 hover:underline">✕ Effacer le filtre</button>
      </div>

    </div>
  );
}
