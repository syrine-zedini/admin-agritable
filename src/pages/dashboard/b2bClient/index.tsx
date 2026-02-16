"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import useClients from "@/hooks/useClientsB2B";
import ClientsTable from "@/components/clientB2B/clientTable";
import StatCard from "@/components/clientB2B/statCard";
import AddB2BClientForm from "@/components/clientB2B/addB2BClientForm";

export default function ClientsB2BPage() {
  const { clients, loading, error, fetchClients } = useClients();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const totalClients = clients.length;
  const pendingClients = clients.filter(c => c.status === "Pending").length;
  const activeClients = clients.filter(c => c.status === "Active").length;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients B2B</h1>
          <p className="text-gray-500 text-sm">Gérer les comptes professionnels et la validation</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-[#10a34e] hover:bg-[#0d8a42] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Ajouter un client B2B
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total B2B Clients" value={totalClients} sub="Total enregistré" />
        <StatCard title="Pending Validation" value={pendingClients} sub="Requires review" color="text-orange-500" />
        <StatCard title="Active Clients" value={activeClients} sub={`${activeClients === 0 ? '0' : Math.round((activeClients / totalClients) * 100)}% of total`} />
        <StatCard title="Total Credit Extended" value="0,00 TND" sub="Across all clients" />
      </div>

      {/* Table */}
      <ClientsTable 
        clients={clients} 
        loading={loading} 
        error={error} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        fetchClients={fetchClients} 
      />

      {/* Add Form */}
      {isFormOpen && <AddB2BClientForm onClose={() => setIsFormOpen(false)} onClientAdded={fetchClients} />}
    </div>
  );
}
