"use client";

import React from "react";
import { useRouter } from "next/router";
import { ArrowLeft, RefreshCw, DollarSign } from "lucide-react";

const FinancialLedgerPage = () => {
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

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Financial Ledger</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">Client ID: {id}</p>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: Ledger Balance */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-gray-800">Ledger Balance</h3>
            <div className="flex gap-2">
              <button 
        className="bg-[#10a342] hover:bg-[#0e8f3a] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        onClick={() => {
            /* Logique pour enregistrer un paiement */
        }}
      >
        Record Payment
      </button>
              <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                Adjust Ledger
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-50 p-2 rounded-full text-emerald-500">
                <DollarSign size={28} />
              </div>
              <div>
                <span className="text-3xl font-black text-emerald-500">0.00 TND</span>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Credit Available
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Credit Limit</span>
              <span className="text-sm font-bold text-gray-800">0.00 TND</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Ledger Transaction History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-gray-800">Ledger Transaction History</h3>
            <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw size={14} />
              <span className="text-xs font-bold">Refresh</span>
            </button>
          </div>
          
          <div className="p-16 flex flex-col items-center justify-center">
            <p className="text-gray-400 text-sm font-medium">No transactions yet</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// L'EXPORT PAR DÉFAUT EST OBLIGATOIRE
export default FinancialLedgerPage;