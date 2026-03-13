"use client";
import React, { useState } from "react";
import { Users, MoreHorizontal, Pencil, Trash2, Ban, RefreshCw } from "lucide-react";
import { AdminUser } from "@/types/admin.types";

interface Props {
  admins: AdminUser[];
  onToggleStatus: (id: string, currentStatus: "Active" | "Suspended") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const roleBadge: Record<string, string> = {
  SuperAdmin: "bg-purple-100 text-purple-600",
  AdminCommercial: "bg-amber-100 text-amber-600",
  AdminLogistique: "bg-blue-100 text-blue-600",
};

const AdminTable: React.FC<Props> = ({ admins, onToggleStatus, onDelete }) => {
  const [openActionIdx, setOpenActionIdx] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleAction = (idx: number) => {
    setOpenActionIdx((prev) => (prev === idx ? null : idx));
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    setLoadingId(admin.id);
    setOpenActionIdx(null);
    try {
      await onToggleStatus(admin.id, admin.status);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    if (!confirm(`Supprimer l'admin ${admin.username} ?`)) return;
    setLoadingId(admin.id);
    setOpenActionIdx(null);
    try {
      await onDelete(admin.id);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto text-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-slate-400 font-medium border-b border-gray-100">
            <th className="px-8 py-5 font-semibold">Email</th>
            <th className="px-8 py-5 font-semibold">Nom complet</th>
            <th className="px-8 py-5 font-semibold">Rôle</th>
            <th className="px-8 py-5 font-semibold">Dernière connexion</th>
            <th className="px-8 py-5 font-semibold">Statut</th>
            <th className="px-8 py-5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {admins.map((admin, idx) => (
            <tr
              key={admin.id}
              className={`group transition-colors ${
                loadingId === admin.id ? "opacity-50 pointer-events-none" : "hover:bg-slate-50/50"
              }`}
            >
              {/* Email */}
              <td className="px-8 py-5 text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Users size={14} className="text-slate-400" />
                  </div>
                  <span className="font-medium tracking-tight">{admin.email}</span>
                </div>
              </td>

              {/* Nom */}
              <td className="px-8 py-5 text-slate-500">
                {admin.username || <span className="text-slate-300 italic">—</span>}
              </td>

              {/* Rôle */}
              <td className="px-8 py-5">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                    roleBadge[admin.role] ?? "bg-gray-100 text-gray-500"
                  }`}
                >
                  {admin.role}
                </span>
              </td>

              {/* Dernière connexion */}
              <td className="px-8 py-5 text-slate-400">
                {admin.lastLogin ? (
                  new Date(admin.lastLogin).toLocaleDateString("fr-TN")
                ) : (
                  <span className="italic text-slate-300">Jamais connecté</span>
                )}
              </td>

              {/* Statut */}
              <td className="px-8 py-5">
                <span
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black text-white ${
                    admin.status === "Active" ? "bg-[#10a345]" : "bg-[#e54d4d]"
                  }`}
                >
                  {admin.status === "Active" ? "ACTIF" : "SUSPENDU"}
                </span>
              </td>

              {/* Actions dropdown */}
              <td className="px-8 py-5 text-right relative">
                <button
                  onClick={() => toggleAction(idx)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-slate-400 hover:text-slate-700"
                >
                  <MoreHorizontal size={18} />
                </button>

                {openActionIdx === idx && (
                  <>
                    {/* Overlay pour fermer */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenActionIdx(null)}
                    />
                    <div className="absolute right-8 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-48 overflow-hidden">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        {admin.status === "Active" ? (
                          <>
                            <Ban size={14} />
                            Suspendre
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} />
                            Réactiver
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </td>
            </tr>
          ))}

          {admins.length === 0 && (
            <tr>
              <td colSpan={6} className="px-8 py-16 text-center text-slate-300 italic">
                Aucun administrateur trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;