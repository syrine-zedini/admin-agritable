import React, { useState } from 'react'; 
import { ChevronDown } from 'lucide-react';

function Settings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-[#333]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Paramètres de la plateforme</h1>
          <p className="text-gray-500 text-sm">Configurer les paramètres et préférences de la plateforme</p>
        </header>

        {/* Tabs */}
        <div className="flex bg-[#e9ecef] p-1 rounded-lg w-fit mb-8">
          <button className="px-10 py-1.5 bg-white shadow-sm rounded-md text-sm font-medium">General</button>
          <button className="px-10 py-1.5 text-gray-500 text-sm font-medium hover:text-gray-700">Pricing</button>
          <button className="px-10 py-1.5 text-gray-500 text-sm font-medium hover:text-gray-700">Security</button>
        </div>

        {/* Form Card */}
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
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
              <input 
                type="email" 
                defaultValue="support@agritable.tn" 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            {/* Support Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Support Phone</label>
              <input 
                type="text" 
                defaultValue="+216 71 123 456" 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            {/* Default Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default Language</label>
              <div className="relative">
                <select className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all cursor-pointer">
                  <option>Arabic</option>
                  <option>French</option>
                  <option>English</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
              <div className="relative">
                <select className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all cursor-pointer">
                  <option>Africa/Tunis (GMT+1)</option>
                  <option>Europe/Paris (GMT+1)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${maintenanceMode ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full bg-[#1aa34a] hover:bg-[#168a3e] text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Settings;
