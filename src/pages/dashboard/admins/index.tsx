"use client";
import React from "react";
import Head from "next/head";
import { Search, Download, UserPlus, ShieldCheck } from "lucide-react";
import StatCard from "@/components/admins/statCard";
import { useAdminPage } from "@/hooks/useAdminPage";
import AdminTable from "@/components/admins/adminTable";
import AddAdminModal from "@/components/admins/AddAdminModal";

const AdminTablePage = () => {
  const {
    admins,
    loading,
    error,
    isModalOpen,
    openModal,
    closeModal,
    handleCreateAdmin,
    handleToggleStatus,
    handleDeleteAdmin,
  } = useAdminPage();

  const activeCount = admins.filter((a) => a.status === "Active").length;
  const superAdminCount = admins.filter((a) => a.role === "SuperAdmin").length;

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-10 font-sans text-slate-700">
      <Head>
        <title>Administrateurs | Dashboard</title>
      </Head>

      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Administrateurs
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Gérer les comptes administrateurs et les permissions (SuperAdmin uniquement)
          </p>
        </div>

        <button
          onClick={openModal}
          className="bg-[#10a345] hover:bg-[#0d8a3a] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all shadow-sm"
        >
          <UserPlus size={18} />
          Ajouter un admin
        </button>
      </div>

      {/* Stats - dynamiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Admins"
          value={loading ? "…" : String(admins.length)}
          label="Comptes enregistrés"
        />
        <StatCard
          title="Actifs"
          value={loading ? "…" : String(activeCount)}
          label="Actuellement actifs"
          valueColor="text-[#10a345]"
        />
        <StatCard
          title="SuperAdmins"
          value={loading ? "…" : String(superAdminCount)}
          label="Accès total"
        />
        <StatCard
          title="Connexions échouées (24h)"
          value="0"
          label="Alertes sécurité"
          valueColor="text-red-500"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-wrap justify-between gap-4 items-center">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par email ou nom..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm"
            />
          </div>
          <div className="flex gap-3">
            <select className="border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50/50 text-sm font-medium outline-none text-slate-600 appearance-none min-w-[140px]">
              <option value="">Tous les rôles</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="AdminCommercial">Admin Commercial</option>
              <option value="AdminLogistique">Admin Logistique</option>
            </select>
            <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-gray-50 transition-all">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-20 text-center text-slate-300 italic text-sm">
            Chargement des administrateurs...
          </div>
        ) : (
          <AdminTable
            admins={admins}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteAdmin}
          />
        )}
      </div>

      {/* Security notice */}
      <div className="mt-8 bg-[#fffcf0] border border-[#fef3c7] rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <ShieldCheck className="text-[#b45309] shrink-0" size={20} />
          <div>
            <h4 className="text-[#92400e] font-bold text-[13px]">Avis de sécurité</h4>
            <p className="text-[#b45309] text-xs mt-1 leading-relaxed opacity-90">
              Toutes les actions admin sont enregistrées pour audit de sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddAdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCreateAdmin}
      />
    </div>
  );
};

export default AdminTablePage;