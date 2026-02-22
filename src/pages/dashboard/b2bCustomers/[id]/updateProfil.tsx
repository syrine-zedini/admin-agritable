"use client";

import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  FileText,
  ArrowLeft, 
} from "lucide-react";

import { getClientB2BById } from "@/service/clientsB2B.service";
import { Client } from "@/types/clientB2B.types";
import SendEmail from "@/components/communCommunication/email";
import Orders from "@/components/clientB2B/orders";
import Ledger from "@/components/clientB2B/ledger";
import CustomPricing from "@/components/clientB2B/customPricing";
import ReferralPrograms from "@/components/clientB2B/referralPrograms";

export default function BusinessProfile() {
  const router = useRouter();
  const { id } = router.query;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  
  const tabs = [
    "Overview",
    "Orders & Quotes",
    "Financial Ledger",
    "Custom Pricing",
    "Referral Programs",
  ];

  useEffect(() => {
    if (!id) return;

    const fetchClient = async () => {
      try {
        const data = await getClientB2BById(id as string);
        setClient(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const handleGoBack = () => {
    router.back();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Orders & Quotes":
        return <Orders />; 
      case "Financial Ledger":
        return <Ledger />;
      case "Custom Pricing":
        return <CustomPricing />;
      case "Referral Programs":
        return <ReferralPrograms />;
      default:
        // Contenu Overview
        if (!client) return null;
        
        return (
          <>
            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* BUSINESS INFO */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Business Information</h3>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Business Name</p>
                    <p className="font-medium">{client.businessName}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Manager</p>
                    <p className="font-medium">
                      {client.firstName} {client.lastName}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="flex items-center gap-2 text-black-600">
                      <Phone size={14} />
                      {client.phoneNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="flex items-center gap-2 text-black-600">
                      <Mail size={14} />
                      {client.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Institution Type</p>
                    <p className="font-medium">{client.institutionType}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Adresse</p>
                    <p className="font-medium">{client.address}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Registration Date</p>
                    <p className="font-medium">{client.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 min-h-[400px] shadow-sm">
                <h3 className="font-bold text-lg mb-4">Account Status</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                      Validation Status
                    </p>

                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-emerald-200">
                      {client.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                      Ledger Balance
                    </p>

                    <div className="flex items-baseline gap-2">
                      <span className="text-emerald-500 font-bold text-2xl">
                        {client.balance}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400 uppercase">
                      Credit Available
                    </p>

                    <button className="mt-2 bg-emerald-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-emerald-700 transition">
                      Adjust Ledger
                    </button>
                  </div>

                  <div className="pt-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">
                      Credit Limit
                    </p>
                    <p className="font-bold">0.00 TND</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 min-h-[400px] shadow-sm">
                <h3 className="font-bold text-lg mb-4">Quick Stats</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Total Orders</span>
                    <span className="font-bold text-lg">{client.orders}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="font-bold text-lg">0.00 TND</span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Avg. Order Value</span>
                    <span className="font-bold">0.00 TND</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Pending Quotes</span>
                    <span className="font-bold text-lg text-gray-400">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Documents */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 min-h-[400px] shadow-sm mt-6">
              <h3 className="font-bold text-lg mb-8 flex items-center gap-2">
                <FileText size={18} className="text-gray-500" />
                Business Documents
              </h3>

              <div className="flex flex-col items-center justify-center py-10">
                <FileText size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium text-sm">
                  Aucun document uploadé
                </p>
                <p className="text-gray-400 text-[10px] mt-1">
                  Documents will appear here once the client uploads them during registration
                </p>
              </div>
            </div>
          </>
        );
    }
  };

  if (loading) {
    return <div className="p-10">Chargement...</div>;
  }

  if (!client && activeTab === "Overview") {
    return <div className="p-10 text-red-500">Client introuvable</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-700">
      {/* BOUTON RETOUR */}
      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        aria-label="Retour"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Retour</span>
      </button>

      {client && (
        <div className="flex justify-between items-center mb-6">
          {/* Section gauche : titre, statut et ID */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">
                {client.businessName}
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full border border-emerald-200">
                {client.status}
              </span>
            </div>

            <p className="text-xs text-gray-400 font-mono mt-1">
              Business ID: {client.id}
            </p>
          </div>

          {/* Section droite : boutons */}
          <div className="flex items-center gap-3">
            {/* Bouton Call Manager */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors bg-white">
              <Phone size={18} className="text-gray-600" />
              Call Manager
            </button>

            {/* Bouton Email */}
            <SendEmail email={client.email} />

            {/* Bouton Manage Custom Pricing */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors bg-white">
              Manage Custom Pricing
            </button>

            {/* Bouton Deactivate */}
            <button 
              className="px-6 py-2 bg-[#ef4444] hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              onClick={() => {
                
              }}
            >
              Deactivate
            </button>
          </div>
        </div>
      )}

      {/* --- SYSTEME D'ONGLETS CLIQUABLES --- */}
      <div className="flex items-center bg-gray-100/80 p-1.5 rounded-xl mb-8 w-fit border border-gray-200 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg ${
              activeTab === tab
                ? "bg-white text-emerald-600 shadow-md transform scale-105 border border-gray-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RENDU CONDITIONNEL DU CONTENU */}
      {renderContent()}
    </div>
  );
}