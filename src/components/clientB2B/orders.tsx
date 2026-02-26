"use client";

import React from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Phone, Mail, FileText } from "lucide-react";
import SendEmail from "@/components/communCommunication/email";



export default function ClientOrdersPage() {
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

      {/* HEADER SIMPLIFIÉ */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders & Quotes History</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">Client ID: {id}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: Quote Requests */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h3 className="font-bold text-gray-800">Quote Requests</h3>
          </div>
          <div className="p-10">
            <p className="text-gray-400 text-sm">No quote requests</p>
          </div>
        </div>

        {/* SECTION 2: Order History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h3 className="font-bold text-gray-800">Order History</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Delivery Address</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}