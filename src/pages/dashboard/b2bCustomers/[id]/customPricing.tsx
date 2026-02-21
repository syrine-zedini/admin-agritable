"use client";

import React from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Package, Plus, Layers } from "lucide-react";

const CustomPricingPage = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-700">
      {/* BOUTON RETOUR */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Profile</span>
      </button>

      {/* HEADER DE LA PAGE */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Custom Pricing</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">Client ID: {id}</p>
      </div>

      {/* SECTION PRINCIPALE : Product-Specific Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* En-tête de la carte avec boutons à droite */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-gray-800 text-lg">Product-Specific Pricing</h3>
          
          <div className="flex items-center gap-3">
            <button className="bg-[#10a342] hover:bg-[#0e8f3a] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-2">
              <Plus size={14} />
              Set Custom Price
            </button>
            <button className="bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
              <Layers size={14} />
              Apply Bulk Pricing
            </button>
          </div>
        </div>

        {/* État vide (Empty State) - Exactement comme l'image */}
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Package size={48} className="text-gray-300" />
          </div>
          
          <h4 className="text-gray-800 font-bold text-lg mb-1">No Custom Pricing Set</h4>
          <p className="text-gray-400 text-sm mb-8 max-w-sm">
            This client is using standard B2B pricing for all products
          </p>

          {/* Boutons centraux */}
          <div className="flex items-center gap-4">
            <button className="bg-[#10a342] hover:bg-[#0e8f3a] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md">
              Set Custom Price
            </button>
            <button className="bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">
              Apply Bulk Pricing
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomPricingPage;