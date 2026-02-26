"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, Phone } from "lucide-react";
import { User, ShoppingCart, CreditCard, Bell, Trash2, CheckCircle,XCircle, AlertCircle  } from "lucide-react";
import { getClientsB2C } from "@/service/clientsB2C.service";
import { useRouter } from "next/navigation";
import SendNotificationModal from "@/components/clientB2C/notification";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "../products/ToastContainer";
import { api } from "@/service/api";
interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  negativeBalance?: number;
}

export default function ClientsTable({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  refreshTrigger,
}: any) {
  const [error, setError] = useState<string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [userToActivate, setUserToActivate] = useState<User | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const router = useRouter();

  const processClients = (clients: any[]) => {
    const validClients = clients.filter((c: any) => c && c.id);

    return validClients
      .map((c: any) => {
        const isActive = c.b2c_data?.isActive || false;
        const isSuspended = c.b2c_data?.isSuspended || false;
        const walletBalance = c.b2c_data?.negativeBalance || "0";
        const negativeBalance = walletBalance < 0;

        return {
          ...c,
          isActive,
          isSuspended,
          walletBalance,
          negativeBalance,
          status: negativeBalance
            ? "Negative Balance"
            : isActive
            ? "Active"
            : isSuspended
            ? "Inactive"
            : "Inactive",
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  };

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeToday, setActiveToday] = useState(0);
  const [negativeBalancesCount, setNegativeBalancesCount] = useState(0);

 const refreshData = async (page: number = 1) => {
  setLoading(true);
  try {
    const LIMIT = 50;
    const offset = page * LIMIT; // page 0 → offset 0, page 1 → offset 50...
    const { clients, total } = await getClientsB2C(offset, LIMIT);

    const processedClients = processClients(clients);

    if (page === 0) {
      setCustomers(processedClients);
    } else {
      setCustomers(prev => [...prev, ...processedClients]);
    }

 setHasMore(clients.length === LIMIT); 
;
  } catch (err) {
    console.error(err);
    setCustomers([]);
  } finally {
    setLoading(false);
  }
};


 useEffect(() => {
  refreshData(0);
  setCurrentPage(0);
}, [refreshTrigger]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      refreshData(nextPage);
    }
  };

  const updateClientStatus = (clientId: string, updates: Partial<any>) => {
    setCustomers((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;

        const updated = { ...client, ...updates };
        
        // Mettre à jour également dans b2c_data
        if (!updated.b2c_data) updated.b2c_data = {};
        updated.b2c_data.isActive = updated.isActive;
        updated.b2c_data.isSuspended = updated.isSuspended;
        
        const walletBalance = updated.b2c_data?.negativeBalance || "0";
        const negativeBalance = Number(walletBalance) < 0;

        return {
          ...updated,
          negativeBalance,
          status: negativeBalance
            ? "Negative Balance"
            : updated.isActive === true
            ? "Active"
            : updated.isSuspended === true
            ? "Inactive"
            : "Inactive",
        };
      })
    );
  };

  const filtredClients = customers.filter((c: any) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      c.firstName?.toLowerCase().includes(search) ||
      c.lastName?.toLowerCase().includes(search) ||
      c.phoneNumber?.toLowerCase().includes(search) ||
      c.address?.toLowerCase().includes(search);

    const walletBalance = c.b2c_data?.negativeBalance || "0";
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" &&
        c.isActive === true &&
        Number(walletBalance) >= 0) ||
      (filterStatus === "negative balance" && Number(walletBalance) < 0) ||
      (filterStatus === "inactive" && c.isSuspended === true);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <SendNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => {
          setIsNotificationModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Modal de confirmation pour désactivation */}
      {isConfirmModalOpen && userToDeactivate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Deactivate Customer</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to deactivate {userToDeactivate.username || userToDeactivate.firstName}? 
              They will no longer be able to place orders.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setUserToDeactivate(null);
                }}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {

                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth/${userToDeactivate.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        b2c_data: {
                          negativeBalance: userToDeactivate.negativeBalance || 0,
                          isActive: false,
                          isSuspended: true,
                        },
                      }),
                    });
                    if (!res.ok) throw new Error("Erreur lors de la mise à jour");

                    updateClientStatus(userToDeactivate.id, { isActive: false, isSuspended: true });
                    showToast("success", "User désactivé");
                  } catch (err) {
                    console.error(err);
                    showToast("error", "Impossible de mettre à jour le client");
                    refreshData(0);
                  } finally {
                    setIsConfirmModalOpen(false);
                    setUserToDeactivate(null);
                  }
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour activation */}
      {isActivateModalOpen && userToActivate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Activate Customer</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to activate {userToActivate.username || userToActivate.firstName}? 
              They will be able to place orders again.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsActivateModalOpen(false);
                  setUserToActivate(null);
                }}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {

                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth/${userToActivate.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        b2c_data: {
                          negativeBalance: userToActivate.negativeBalance || 0,
                          isActive: true,
                          isSuspended: false,
                        },
                      }),
                    });
                    if (!res.ok) throw new Error("Erreur lors de la mise à jour");

                    updateClientStatus(userToActivate.id, { isActive: true, isSuspended: false });
                    showToast("success", "User activé");
                  } catch (err) {
                    console.error(err);
                    showToast("error", "Impossible de mettre à jour le client");
                    refreshData(0);
                  } finally {
                    setIsActivateModalOpen(false);
                    setUserToActivate(null);
                  }
                }}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 justify-between items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div className="flex gap-2">
          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="negative balance">Negative Balance</option>
            <option value="inactive">Inactive</option>
          </select>

          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <Filter size={16} /> More Filters
          </button>

          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Customer ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Registration Date</th>
              <th className="px-6 py-4 text-center">Total Orders</th>
              <th className="px-6 py-4 text-center">Wallet Balance</th>
              <th className="px-6 py-4 text-center">Loyalty Points</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Address</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading && customers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  Chargement des clients...
                </td>
              </tr>
            ) : filtredClients.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  Aucun client trouvé
                </td>
              </tr>
            ) : (
              filtredClients.map((c: any) => {
                const walletBalance = c.b2c_data?.negativeBalance || "0";
                
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{c.id?.slice(0, 8)}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                <button
                  onClick={() => router.push(`/dashboard/customers/${c.id}/profil`)}
                  className="flex items-center gap-2 text-left text-slate-700 hover:text-green-600 underline hover:no-underline transition duration-150"
                >
                <User className="w-4 h-4 text-gray-600" /> {/* icône User */}
                {c.username || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "No name"}
               </button>
               </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        {c.phoneNumber && <Phone size={14} />}
                        {c.phoneNumber || "No contact info"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">{c.totalOrders || 0}</td>
                    <td className="px-6 py-4 text-center font-medium">{walletBalance} TND</td>
                    <td className="px-6 py-4 text-center">{c.loyaltyPoints || 0}</td>
                    <td className="px-6 py-4">
                      <span
                     className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                     Number(walletBalance) < 0
                     ? "bg-red-100 text-red-700"
                     : c.isActive
                     ? "bg-green-100 text-green-700"
                     : "bg-gray-100 text-gray-700"
                    }`}
                    >
                    {Number(walletBalance) < 0 ? (
                    <>
                     <AlertCircle size={12} /> Negative Balance </>
                    ) : c.isActive ? (
                     <>
                    <CheckCircle size={12} /> Active </>
                    ) : (
                     <>
                    <XCircle size={12} /> Inactive </>
                    )}
                    </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">
                    {c.address || "-"}
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)}
                        className="text-gray-600 hover:text-green-600 font-medium text-xs px-3 py-1 rounded hover:bg-gray-100 transition duration-200"
                      >
                        View Details  <span className="text-xs">▼</span>
                      </button>

                      {activeMenu === c.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-md z-10 border border-gray-200 divide-y divide-gray-100">
                          <button
                            onClick={() => {
                              router.push(`/dashboard/customers/${c.id}/profil`);
                              setActiveMenu(null);
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-150"
                          >
                            <User className="w-4 h-4 mr-2 text-gray-800" />
                            View Profile
                          </button>

                          <button
                            onClick={() => {
                              router.push(`/dashboard/customers/${c.id}/orders`);
                              setActiveMenu(null);
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-150"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2 text-gray-800" />
                            View Orders
                          </button>

                          <button
                            onClick={() => {
                              router.push(`/dashboard/customers/${c.id}/wallet`);
                              setActiveMenu(null);
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-150"
                          >
                            <CreditCard className="w-4 h-4 mr-2 text-gray-800" />
                            View Wallet
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(c);
                              setIsNotificationModalOpen(true);
                              setActiveMenu(null);
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-150"
                          >
                            <Bell className="w-4 h-4 mr-2 text-gray-800" />
                            Send Notification
                          </button>

                          {Number(walletBalance) < 0 ? (
                            <span className="block px-4 py-2 text-sm text-red-500 font-medium">
                              Negative Balance
                            </span>
                          ) : c.isActive ? (
                            <button
                              onClick={() => {
                                setUserToDeactivate(c);
                                setIsConfirmModalOpen(true);
                                setActiveMenu(null);
                              }}
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition duration-150"
                            >
                              <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setUserToActivate(c);
                                setIsActivateModalOpen(true);
                                setActiveMenu(null);
                              }}
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50 transition duration-150"
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Activate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* Bouton Load More */}
        {/* Bouton Load More */}
{hasMore && (
  <div className="flex justify-center py-4 border-t border-gray-100">
    <button
      onClick={loadMore}
      disabled={loading}
      className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Chargement..." : "Charger plus"}
    </button>
  </div>
)}
      </div>
    </div>
  );
}