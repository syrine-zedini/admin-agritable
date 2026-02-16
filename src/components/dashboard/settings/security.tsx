import React, { useState } from 'react';
import Head from 'next/head';

interface SecuritySettingsState {
  twoFactor: boolean;
  sessionTimeout: number;
  maxAttempts: number;
  autoBackups: boolean;
  activityLogging: boolean;
}

export default function SecuritySettings() {
  const [formData, setFormData] = useState<SecuritySettingsState>({
    twoFactor: true,
    sessionTimeout: 60,
    maxAttempts: 5,
    autoBackups: true,
    activityLogging: true,
  });

  const handleToggle = (field: keyof SecuritySettingsState) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SecuritySettingsState) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseInt(e.target.value) || 0,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Head>
        <title>Security Settings</title>
      </Head>

      <div className="max-w-5xl mx-auto bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure authentication and access control</p>
        </div>

        <div className="p-8 space-y-10">
          
          {/* Section: Authentication */}
          <section>
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-6">Authentication</h2>
            
            {/* 2FA Toggle */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-gray-800">Two-Factor Authentication</span>
                <span className="text-sm text-gray-500">Require 2FA for admin logins</span>
              </div>
              <ToggleButton 
                enabled={formData.twoFactor} 
                onClick={() => handleToggle('twoFactor')} 
              />
            </div>

            {/* Session Timeout Input */}
            <div className="mb-8">
              <label className="block text-[15px] font-semibold text-gray-800 mb-2">Session Timeout</label>
              <div className="flex shadow-sm rounded-md">
                <input
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={(e) => handleInputChange(e, 'sessionTimeout')}
                  className="flex-1 block w-full border border-gray-300 rounded-l-md px-4 py-2.5 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                />
                <span className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  minutes
                </span>
              </div>
            </div>

            {/* Max Login Attempts Input */}
            <div className="mb-2">
              <label className="block text-[15px] font-semibold text-gray-800 mb-2">Max Login Attempts</label>
              <input
                type="number"
                value={formData.maxAttempts}
                onChange={(e) => handleInputChange(e, 'maxAttempts')}
                className="block w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              />
              <p className="mt-2 text-xs text-gray-400">Lock account after this many failed attempts</p>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Section: Data Protection */}
          <section>
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-6">Data Protection</h2>
            
            {/* Automatic Backups Toggle */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-gray-800">Automatic Backups</span>
                <span className="text-sm text-gray-500">Daily automated database backups</span>
              </div>
              <ToggleButton 
                enabled={formData.autoBackups} 
                onClick={() => handleToggle('autoBackups')} 
              />
            </div>

            {/* Activity Logging Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-gray-800">Activity Logging</span>
                <span className="text-sm text-gray-500">Track all admin actions</span>
              </div>
              <ToggleButton 
                enabled={formData.activityLogging} 
                onClick={() => handleToggle('activityLogging')} 
              />
            </div>
          </section>

          {/* Save Button */}
          <div className="pt-6">
            <button 
              type="button"
              className="w-full bg-[#27ae60] hover:bg-[#219150] text-white font-bold py-3.5 rounded-md transition duration-200 ease-in-out shadow-sm active:scale-[0.99]"
              onClick={() => console.log('Saving settings...', formData)}
            >
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Composant Interrupteur (Toggle) typé
interface ToggleProps {
  enabled: boolean;
  onClick: () => void;
}

function ToggleButton({ enabled, onClick }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${
        enabled ? 'bg-[#27ae60]' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
}