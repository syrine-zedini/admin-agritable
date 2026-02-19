import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, Download, MoreVertical, RefreshCw, EyeOff, LayoutGrid, Users } from 'lucide-react';

// Définition du type pour une commande
type Order = {
  id: string;
  client: string;
  type: string;
  date: string;
  address: string;
  status: string;
  amount: string;
  payment: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const { id } = router.query;
  const userId = typeof id === 'string' ? id : '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('toutes');

  // Récupération dynamique des commandes via API
  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?userId=${userId}`);
        if (!res.ok) throw new Error('Erreur lors de la récupération des commandes');
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement des commandes...
      </div>
    );
  }

  // Calcul des KPIs dynamiques
  const totalOrders = orders.length;
  const pending = orders.filter(o => o.status === 'Placed').length;
  const preparing = orders.filter(o => o.status === 'Preparing').length;
  const deliveredToday = orders.filter(o => o.status === 'DeliveredToday').length; // exemple, adapter selon ton backend

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des commandes & demandes</h1>
          <p className="text-sm text-gray-500">
            Consulter, filtrer et gérer toutes les commandes de la plateforme pour l'utilisateur {userId}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-red-400 hover:bg-red-50 rounded-lg border border-gray-200"><EyeOff size={18} /></button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200"><RefreshCw size={18} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button 
          onClick={() => setActiveTab('toutes')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'toutes' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Toutes les commandes
        </button>
        <button 
          onClick={() => setActiveTab('groupement')}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'groupement' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <LayoutGrid size={16} /> Groupement de demandes
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total des commandes', value: totalOrders, color: 'text-gray-900' },
          { label: 'En attente', value: pending, color: 'text-amber-500' },
          { label: 'En route', value: preparing, color: 'text-blue-500' },
          { label: 'Livrées aujourd\'hui', value: deliveredToday, color: 'text-emerald-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par N° commande, client, téléphone..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
          <option>Tous les statuts</option>
        </select>
        <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
          <option>Tous les types</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          <Filter size={16} /> Plus de filtres
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          <Download size={16} /> Exporter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Commande</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Type</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jour et heure de livraison</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse de livraison</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paiement</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{order.client}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold border border-blue-100 uppercase">{order.type}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{order.date}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-xs">{order.address}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                      order.status === 'Placed' 
                        ? 'bg-slate-100 text-slate-600 border-slate-200' 
                        : 'bg-orange-100 text-orange-600 border-orange-200'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">{order.amount}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{order.payment}</td>
                  <td className="px-4 py-4 text-center">
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
