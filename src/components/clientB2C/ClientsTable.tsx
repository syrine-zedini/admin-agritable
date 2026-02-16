"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, Phone } from "lucide-react";
import { getClientsB2C } from "@/service/clientsB2C.service";
import { useRouter } from "next/navigation";

export default function ClientsTable({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus
}: any) {

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
  const fetchClients = async () => {
    setLoading(true);
    try {
      const clients = await getClientsB2C();
      const validClients = clients.filter((c: any) => c && c.id); 
      setCustomers(validClients);
    } catch (err) {
      console.error("Erreur fetching clients:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };
  fetchClients();
}, []);


  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

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
            <option value="pending">Pending</option>
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
              <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500">Chargement des clients...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500">Aucun client trouvé</td></tr>
            ) : (
              customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{c.id?.slice(0, 8)}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{c.username || `${c.firstName} ${c.lastName}`}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      {c.phoneNumber && <Phone size={14} />}
                      {c.phoneNumber || 'No contact info'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-center">{c.totalOrders || 0}</td>
                  <td className="px-6 py-4 text-center font-medium">{c.walletBalance || '0.00 TND'}</td>
                  <td className="px-6 py-4 text-center">{c.loyaltyPoints || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.IsValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.IsValid ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">
                    {c.address || `${c.city || ''} ${c.governorate || ''}`}
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)}
                      className="text-gray-400 hover:text-gray-600 font-medium text-xs"
                    >
                      View Details
                    </button>

                    {activeMenu === c.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <button
                          onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/customers/${c.id}/orders`)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Orders
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/customers/${c.id}/wallet`)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Wallet
                        </button>
                        <button
                          onClick={() => alert(`Notification envoyée à ${c.id}`)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Send Notification
                        </button>
                        <div className="border-t border-gray-200"></div>
                        <button
                          onClick={() => {
                            if(confirm("Voulez-vous vraiment désactiver ce client ?")) {
                              console.log("Désactiver:", c.id);
                            }
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Deactivate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
