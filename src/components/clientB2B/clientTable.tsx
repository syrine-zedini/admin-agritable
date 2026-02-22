"use client";
import React from "react";
import { Search, Download, Phone, Mail, User, ShoppingCart, CreditCard, Bell, Trash2, CheckCircle, Eye, Edit, XCircle, FileText, DollarSign, Shield, MoreVertical,Building } from "lucide-react";
import StatusBadge from "@/components/clientB2B/statusBadge";
import { Client } from "@/types/clientB2B.types";
import EditB2BClientForm from "./EditB2BClientForm";
import { useRouter } from "next/router";
import CreditLimitModal from "@/components/clientB2B/creditLimitModal";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "../products/ToastContainer";
import { getClientB2BById, updateB2BClient } from "@/service/clientsB2B.service";

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
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [selectedClientForReject, setSelectedClientForReject] = React.useState<Client | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [selectedClientForStatus, setSelectedClientForStatus] = React.useState<Client | null>(null);
  const [pendingStatus, setPendingStatus] = React.useState<string>("");
  const { toasts, showToast, removeToast } = useToast();
  const [showCreditModal, setShowCreditModal] = React.useState(false);
  const [selectedClientForCredit, setSelectedClientForCredit] = React.useState<Client | null>(null);
  const [statusFilter, setStatusFilter] = React.useState("All Status");
  const [typeFilter, setTypeFilter] = React.useState("All Types");
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredClients = clients
    .filter((client) => {
      const searchString = searchTerm.toLowerCase();
      return (
        (client.b2b_data?.institutionType?.toLowerCase() || "").includes(searchString) ||
        (`${client.firstName || ""} ${client.lastName || ""}`.toLowerCase().includes(searchString)) ||
        (client.phoneNumber || "").includes(searchTerm) ||
        (client.email?.toLowerCase() || "").includes(searchString)
      );
    })
    .filter((client) => {
      if (statusFilter === "All Status") return true;
      return (client.status || "").toLowerCase() === statusFilter.toLowerCase();
    })
    .filter((client) => {
      if (typeFilter === "All Types") return true;
      return client.institutionType === typeFilter;
    });

  console.log("Clients reçus:", clients);
  console.log("Filtered:", filteredClients);

  const handleEditClick = async (client: Client, e: React.MouseEvent) => {
  e.stopPropagation();
  try {
    const fullClient = await getClientB2BById(client.id); // fetch complet avec b2b_data + addresses
    setSelectedClient(fullClient);
    setShowEditForm(true);
    setOpenMenuId(null);
  } catch (err) {
    showToast("error", "Impossible de récupérer les infos complètes du client ❌");
  }
};

  const handleFormClose = () => {
    setShowEditForm(false);
    setSelectedClient(null);
  };

  const handleClientUpdated = () => {
    fetchClients();
    showToast("success", "Client B2B modifé avec succès ✅");
  };

  const handleAccountStatusChange = async (
    clientId: string,
    newStatus: string
  ) => {
    try {
      await updateB2BClient(clientId, {
        accountStatus: newStatus,
      });

      showToast("success", `Account status changé vers ${newStatus} ✅`);
      fetchClients();
    } catch (error: any) {
      showToast("error", error.message || "Erreur lors du changement ❌");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
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

        <div className="flex gap-3">
          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Validated</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>

          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>All Types</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Hôtel">Hôtel</option>
            <option value="Café">Café</option>
            <option value="Supermarché">Supermarché</option>
            <option value="Épicerie">Épicerie</option>
            <option value="Entreprise">Entreprise</option>
            <option value="Autre">Autre</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

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

                    <td
                    className="px-6 py-4 font-semibold text-slate-800 cursor-pointer hover:text-green-600 flex items-center gap-2"
                    onClick={() => router.push(`/dashboard/b2bCustomers/${client.id}/updateProfil`)}
                    >
                    <Building className="w-4 h-4 text-gray-600" />
                    {client.businessName}
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
                      <StatusBadge status={client.status || "Validated"} />
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

                    <td className="px-6 py-4 text-right relative">
                      <button
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === client.id ? null : client.id);
                        }}
                      >
                        Actions <span className="text-xs">▼</span>
                      </button>

                      {openMenuId === client.id && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                          <div className="py-1">
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/b2bCustomers/${client.id}/updateProfil`);
                                setOpenMenuId(null);
                              }}
                            >
                              <User size={16} className="text-gray-400" />
                              <span>View Profile</span>
                            </button>

                            <button
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              onClick={(e) => handleEditClick(client, e)}
                            >
                              <Edit size={16} className="text-gray-400" />
                              <span>Edit Details</span>
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            {client.status !== "Validated" && (
                              <button
                                className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-3 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientForStatus(client);
                                  setPendingStatus("Validated");
                                  setConfirmModalOpen(true);
                                  setOpenMenuId(null);
                                }}
                              >
                                <CheckCircle size={16} className="text-green-500" />
                                <span>Validate Account</span>
                              </button>
                            )}

                            {client.status !== "Rejected" && (
                              <button
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientForReject(client);
                                  setRejectionReason("");
                                  setRejectModalOpen(true);
                                  setOpenMenuId(null);
                                }}
                              >
                                <XCircle size={16} className="text-red-500" />
                                <span>Reject Account</span>
                              </button>
                            )}

                            <div className="border-t border-gray-100 my-1"></div>

                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                              <ShoppingCart size={16} className="text-gray-400" />
                              <span>View Orders</span>
                            </button>

                            <button
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClientForCredit(client);
                                setShowCreditModal(true);
                                setOpenMenuId(null);
                              }}
                            >
                              <DollarSign size={16} className="text-gray-400" />
                              <span>Manage Credit Limit</span>
                            </button>

                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                              <FileText size={16} className="text-gray-400" />
                              <span>View Ledger</span>
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            {client.status !== "Suspended" && client.status !== "Rejected" && (
                              <button
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientForStatus(client);
                                  setPendingStatus("Suspended");
                                  setConfirmModalOpen(true);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Shield size={16} className="text-red-500" />
                                <span>Suspend Account</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showEditForm && selectedClient && (
        <EditB2BClientForm
          client={selectedClient}
          onClose={handleFormClose}
          onClientUpdated={handleClientUpdated}
        />
      )}

      {showCreditModal && selectedClientForCredit && (
        <CreditLimitModal
          isOpen={showCreditModal}
          client={selectedClientForCredit}
          onClose={() => {
            setShowCreditModal(false);
            setSelectedClientForCredit(null);
          }}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {confirmModalOpen && selectedClientForStatus && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-4">
              {pendingStatus === "Validated"
                ? "Validate B2B Client"
                : "Suspend B2B Client"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {pendingStatus === "Validated"
                ? `Are you sure you want to validate ${selectedClientForStatus.businessName}? This will allow them to place orders and access B2B features.`
                : `Are you sure you want to suspend ${selectedClientForStatus.businessName}? They will not be able to place orders.`}
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-lg text-sm"
                onClick={() => setConfirmModalOpen(false)}
              >
                Cancel
              </button>

              <button
                className={`px-4 py-2 rounded-lg text-sm ${
                  pendingStatus === "Validated"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
                onClick={async () => {
                  await handleAccountStatusChange(
                    selectedClientForStatus.id,
                    pendingStatus
                  );
                  setConfirmModalOpen(false);
                }}
              >
                {pendingStatus === "Validated" ? "Validate" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModalOpen && selectedClientForReject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-4">
              Reject B2B Client
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedClientForReject.businessName}.
            </p>

            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-lg text-sm"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm"
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    showToast("error", "Please provide a rejection reason ❌");
                    return;
                  }
                  try {
                    await updateB2BClient(selectedClientForReject.id, {
                      accountStatus: "Rejected",
                      rejectionReason: rejectionReason,
                    });
                    showToast("success", "Client rejected successfully ✅");
                    fetchClients();
                    setRejectModalOpen(false);
                  } catch (error: any) {
                    showToast("error", error.message || "Erreur lors du rejet ❌");
                  }
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}