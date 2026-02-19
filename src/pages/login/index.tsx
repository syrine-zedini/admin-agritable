"use client";

import React, { useState } from "react";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) return setError("Veuillez remplir tous les champs");

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth/login-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Email ou mot de passe incorrect");
      }

      // Stocker le token dans sessionStorage
      sessionStorage.setItem("adminToken", data.data.token);

      // Redirection vers le dashboard
      router.push(data.data.redirect || "/dashboard/dashboard");
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
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
          <div className="space-y-2">
            <label className="text-md font-bold text-[#111827]">Email</label>
            <input
              type="email"
              placeholder="admin@agritable.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-[#22C55E] transition-all text-lg text-gray-600 placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-md font-bold text-[#111827]">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-[#22C55E] transition-all text-lg text-gray-600 placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium mt-1">{error}</p>}

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
      <div className="mt-10 text-center">
          <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">
            © 2025 Agritable. All rights reserved.
          </p>
        </div>
    </div>
  );
}
