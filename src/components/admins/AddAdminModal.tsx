"use client";
import React, { useState } from "react";
import { AdminRole, CreateAdminInput } from "@/types/admin.types";

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAdminInput) => Promise<void>;
}

const ROLES: { value: AdminRole; label: string; description: string }[] = [
  {
    value: "SuperAdmin",
    label: "Super Admin",
    description: "Accès à tous les modules du dashboard",
  },
  {
    value: "AdminCommercial",
    label: "Admin Commercial",
    description: "Commandes, Clients, Fournisseurs, Catalogue, Finances",
  },
  {
    value: "AdminLogistique",
    label: "Admin Logistique",
    description: "Logistique, Catalogue, Tableau de bord",
  },
];

const roleBadgeColor: Record<AdminRole, string> = {
  SuperAdmin: "bg-purple-50 text-purple-600",
  AdminCommercial: "bg-amber-50 text-amber-600",
  AdminLogistique: "bg-blue-50 text-blue-600",
};

const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateAdminInput>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "AdminCommercial",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedRole = ROLES.find((r) => r.value === form.role)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      // reset form
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "AdminCommercial" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ firstName: "", lastName: "", email: "", password: "", role: "AdminCommercial" });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 relative">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Ajouter un Admin</h2>
          <p className="text-gray-500 mt-1">Créer un compte admin avec un rôle spécifique</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-8 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-8 py-4 space-y-6">

          {/* Prénom / Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-semibold text-gray-700">Prénom</label>
              <input
                type="text"
                placeholder="Mohamed"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600 placeholder-gray-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-semibold text-gray-700">Nom</label>
              <input
                type="text"
                placeholder="Salah"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Email</label>
            <input
              type="email"
              placeholder="admin@agritable.tn"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600 placeholder-gray-300"
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Mot de passe temporaire</label>
            <input
              type="password"
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600 placeholder-gray-300"
            />
            <p className="text-sm text-gray-400">
              L'utilisateur pourra changer ce mot de passe après la première connexion
            </p>
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Rôle</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Description dynamique du rôle */}
            <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium ${roleBadgeColor[form.role]}`}>
              {selectedRole.description}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 pb-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-8 py-3 border border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-[#10a34b] hover:bg-[#0d8a3e] text-white rounded-lg font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Création...
                </>
              ) : (
                "Créer l'admin"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;