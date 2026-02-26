"use client";

import React from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Users, Gift, Plus } from "lucide-react";

const ReferralProgramsPage = () => {
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
        <h1 className="text-2xl font-bold text-gray-800">Referral Programs</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">Client ID: {id}</p>
      </div>

      <div className="space-y-6">
        
        {/* SECTION 1: Employee Referral Program */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <h3 className="font-bold text-gray-800">Employee Referral Program</h3>
          </div>
          
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 text-sm mb-6">No employee referral program configured</p>
            <button className="bg-[#10a342] hover:bg-[#0e8f3a] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md flex items-center gap-2">
              <Plus size={16} />
              Create Employee Referral Program
            </button>
          </div>
        </div>

        {/* SECTION 2: B2B Referral Program */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white flex items-center gap-2">
            <Gift size={18} className="text-gray-500" />
            <h3 className="font-bold text-gray-800">B2B Referral Program</h3>
          </div>
          
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 text-sm mb-6">No B2B referral program configured</p>
            <button className="bg-[#10a342] hover:bg-[#0e8f3a] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md flex items-center gap-2">
              <Plus size={16} />
              Create B2B Referral Program
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReferralProgramsPage;