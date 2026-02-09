"use client";

import React, { useState } from "react";
import { Leaf, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    user: {
      id: string;
      phoneNumber: string;
      username: string;
    };
    redirect: string;
  };
}

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone || !password) return setError("Veuillez remplir tous les champs");

    setLoading(true);

    try {
      // 🔹 Appel API backend correct
      const response = await axios.post<LoginResponse>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}auth/login`,
        { phoneNumber: phone, password }
      );

      const data = response.data.data;
      console.log("Login réussi :", data);

      // 🔹 Redirection automatique vers la page fournie par le backend
      if (data?.redirect) {
        router.push(data.redirect);
        return;
      }
    } catch (err: any) {
      console.error("Erreur login :", err.response?.data || err.message);
      setError(err.response?.data?.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFB] font-sans p-6">
      <div className="w-full max-w-[550px] bg-white rounded-2xl shadow-md border border-gray-100 p-10 md:p-16">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#22C55E] rounded-xl flex items-center justify-center mb-6 shadow-sm">
            <Leaf className="text-white w-9 h-9" fill="currentColor" />
          </div>
          <h1 className="text-[32px] font-extrabold text-[#111827] mb-2 tracking-tight">
            Agritable Admin
          </h1>
          <p className="text-gray-500 text-lg">Sign in to your dashboard</p>
        </div>

        <form className="space-y-7" onSubmit={handleSubmit}>
          {/* Phone */}
          <div className="space-y-2">
            <label className="text-md font-bold text-[#111827]">Numéro de téléphone</label>
            <input
              type="text"
              placeholder="+216 XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-[#22C55E] transition-all text-lg text-gray-600 placeholder:text-gray-300"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-md font-bold text-[#111827]">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-[#22C55E] transition-all text-lg text-gray-600 placeholder:text-gray-300"
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Eye size={22} />
              </button>
            </div>
          </div>

          {/* Erreur */}
          {error && <p className="text-red-500 text-sm font-medium mt-1">{error}</p>}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22C55E] hover:bg-[#1ea34d] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-green-500/20 text-lg mt-4"
          >
            {loading ? "Chargement..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">
            Secure admin access only
          </p>
        </div>
      </div>
    </div>
  );
}
