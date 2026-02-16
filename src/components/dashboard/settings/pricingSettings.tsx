import React, { useState } from 'react';

const PricingSettings = () => {
  const [allocationType, setAllocationType] = useState('own_stock');

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 font-sans text-[#333]">
      

      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          {/* Section Title */}
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-[#1a2b2b]">Attribution de Stock (Dépôt-Vente)</h2>
          </div>
          <p className="text-gray-500 text-xs mb-6">Configurez la priorité d'attribution lors des ventes</p>

          {/* Info Banner */}
          <div className="bg-[#f0f7ff] border border-[#d0e3ff] rounded-md p-4 mb-6 flex items-start gap-3">
            <span className="text-blue-500 mt-0.5">ⓘ</span>
            <p className="text-sm text-[#2c3e50]">
              Cette configuration détermine quel stock est utilisé en premier lors d'une vente : le stock propre d'Agritable ou le stock en consignation des fournisseurs.
            </p>
          </div>

          {/* Options List */}
          <div className="space-y-4">
            {/* Option 1: Own Stock */}
            <div 
              onClick={() => setAllocationType('own_stock')}
              className={`border rounded-lg p-5 cursor-pointer transition-all ${allocationType === 'own_stock' ? 'border-green-500 bg-white' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${allocationType === 'own_stock' ? 'border-green-500' : 'border-gray-300'}`}>
                  {allocationType === 'own_stock' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Stock propre en priorité</h3>
                  <p className="text-gray-500 text-sm mb-2">
                    Les ventes sont d'abord déduites du stock propre d'Agritable. Le stock en consignation n'est utilisé que si le stock propre est épuisé.
                  </p>
                  <p className="text-xs text-gray-400">
                    <span className="font-medium text-gray-500">Avantage :</span> Maximise la rotation du stock propre, réduit les obligations envers les fournisseurs.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Consignment Stock */}
            <div 
              onClick={() => setAllocationType('consignment')}
              className={`border rounded-lg p-5 cursor-pointer transition-all ${allocationType === 'consignment' ? 'border-green-500 bg-white' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${allocationType === 'consignment' ? 'border-green-500' : 'border-gray-300'}`}>
                  {allocationType === 'consignment' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Stock consignation en priorité</h3>
                  <p className="text-gray-500 text-sm mb-2">
                    Les ventes sont d'abord déduites du stock en consignation (FIFO). Le stock propre n'est utilisé que si le stock consignation est épuisé.
                  </p>
                  <p className="text-xs text-gray-400">
                    <span className="font-medium text-gray-500">Avantage :</span> Accélère le paiement des fournisseurs, réduit le risque de péremption du stock consignation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#fcfdfd] border-t border-gray-100 p-4 flex justify-end">
          <button className="bg-[#82ca9d] hover:bg-[#6fb98c] text-white px-6 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
             Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingSettings;