"use client";
import React from "react";
import Head from "next/head";
import { Search, Download, UserPlus, ShieldCheck } from "lucide-react";
import StatCard from "@/components/admins/statCard";
import { useAdminPage } from "@/hooks/useAdminPage";
import AdminTable from "@/components/admins/adminTable";
import AddAdminModal from "@/components/admins/AddAdminModal";
const AdminTablePage = () => {
  const { admins, isModalOpen, openModal, closeModal } = useAdminPage();

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-10 font-sans text-slate-700">
      <Head>
        <title>Administrateurs | Dashboard</title>
      </Head>

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
          Add Admin User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Admin Users" value="4" label="Registered admins" />
        <StatCard title="Active Users" value="3" label="Currently active" valueColor="text-[#10a345]" />
        <StatCard title="SuperAdmins" value="2" label="Full access" />
        <StatCard title="Failed Logins (24h)" value="0" label="Security alerts" valueColor="text-red-500" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-wrap justify-between gap-4 items-center">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by email or name..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm"
            />
          </div>
          <div className="flex gap-3">
            <select className="border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50/50 text-sm font-medium outline-none text-slate-600 appearance-none min-w-[120px]">
              <option>All Roles</option>
              <option>Support </option>
              <option>SuperAdmin </option>
              <option>Financial</option>
              <option>Logistics</option>
              <option>Support</option>
            </select>
            <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-gray-50 transition-all">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <AdminTable admins={admins} />
      </div>

      <div className="mt-8 bg-[#fffcf0] border border-[#fef3c7] rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <ShieldCheck className="text-[#b45309] shrink-0" size={20} />
          <div>
            <h4 className="text-[#92400e] font-bold text-[13px]">Security Notice</h4>
            <p className="text-[#b45309] text-xs mt-1 leading-relaxed opacity-90">
              All admin actions are logged for security auditing...
            </p>
          </div>
        </div>
      </div>

      <AddAdminModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default AdminTablePage;
