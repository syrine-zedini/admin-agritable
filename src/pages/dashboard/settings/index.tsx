"use client";

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PricingSettings from '@/components/dashboard/settings/pricingSettings';
import SecuritySettings from '@/components/dashboard/settings/security';

function Settings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'security'>('general');

  return (
<div className="min-h-screen bg-gray-50 px-4 py-8 font-sans text-[#333]">
      <div className="max-w-10xl mx-auto">
        
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Paramètres de la plateforme</h1>
          <p className="text-gray-500 text-sm">Configurer les paramètres et préférences de la plateforme</p>
        </header>

        {/* Tabs */}
        <div className="flex bg-[#e9ecef] p-1 rounded-lg w-fit mb-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-10 py-1.5 text-sm font-medium rounded-md ${
              activeTab === 'general' ? 'bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            General
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-10 py-1.5 text-sm font-medium rounded-md ${
              activeTab === 'pricing' ? 'bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pricing
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-10 py-1.5 text-sm font-medium rounded-md ${
              activeTab === 'security' ? 'bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Security
          </button>
        </div>

        {/* ================= GENERAL ================= */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Platform Information</h2>
              <p className="text-gray-400 text-sm mt-1">Basic platform configuration</p>
            </div>

            <form className="p-6 space-y-6">
              
              {/* Platform Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                <input 
                  type="text" 
                  defaultValue="Agritable"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Support Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                <input 
                  type="email" 
                  defaultValue="support@agritable.tn"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Support Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Phone</label>
                <input 
                  type="text" 
                  defaultValue="+216 71 123 456"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Default Language</label>
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-2.5 border border-gray-200 rounded-lg">
                    <option>Arabic</option>
                    <option>French</option>
                    <option>English</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Maintenance Mode</h3>
                  <p className="text-xs text-gray-400">Temporarily disable platform access</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    maintenanceMode ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                    maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <button className="w-full bg-[#1aa34a] text-white py-3 rounded-lg">
                Save Changes
              </button>

            </form>
          </div>
        )}

        {/*  PRICING */}
        {activeTab === 'pricing' && <PricingSettings />}

        {/* SECURITY */}
        {activeTab === 'security' && <SecuritySettings />}

      </div>
    </div>
  );
}

export default Settings;
