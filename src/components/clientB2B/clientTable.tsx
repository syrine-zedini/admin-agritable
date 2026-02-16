"use client";

import React from "react";
import { Search, Download } from "lucide-react";
import StatusBadge from "@/components/clientB2B/statusBadge";
import { Client } from "@/types/clientB2B.types";

interface Props {
  clients: Client[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  fetchClients: () => void;
}

export default function ClientsTable({
  clients,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  fetchClients,
}: Props) {

  const [statusFilter, setStatusFilter] = React.useState("All Status");
  const [typeFilter, setTypeFilter] = React.useState("All Types");

  //  Filter Logic
  const filteredClients = clients
    .filter((client) => {
      const searchString = searchTerm.toLowerCase();
      return (
        client.businessName?.toLowerCase().includes(searchString) ||
        `${client.firstName} ${client.lastName}`
          .toLowerCase()
          .includes(searchString) ||
        client.phoneNumber.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchString)
      );
    })
    .filter((client) => {
      if (statusFilter === "All Status") return true;
      return client.status === statusFilter;
    })
    .filter((client) => {
      if (typeFilter === "All Types") return true;
      return client.institutionType === typeFilter;
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">

        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by business name, manager, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Right */}
        <div className="flex gap-3">
          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
          </select>

          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>All Types</option>
            <option>Restaurant</option>
            <option>Hôtel</option>
            <option>Café</option>
            <option>Supermarché</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Chargement des clients...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchClients}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Credit Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">
                        Aucun client B2B trouvé
                      </p>
                      <p className="text-xs text-gray-400">
                        {searchTerm
                          ? "Aucun résultat pour votre recherche"
                          : "Les clients apparaîtront ici une fois ajoutés"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {client.id.substring(0, 8)}...
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      🏢 {client.businessName}
                    </td>

                    <td className="px-6 py-4">
                      {client.firstName} {client.lastName}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {client.phoneNumber}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-[10px] uppercase font-bold text-gray-600">
                        {client.institutionType}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {client.email}
                    </td>

                    <td className="px-6 py-4">
                      {client.createdAt}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={client.status || "Active"} />
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {client.address || "—"}
                    </td>

                    <td className="px-6 py-4 text-center font-medium">
                      {client.orders}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {client.balance}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="font-semibold text-slate-700 hover:text-green-600 hover:underline">
                        Détails
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}