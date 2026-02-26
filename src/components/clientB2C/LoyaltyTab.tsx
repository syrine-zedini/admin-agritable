import React, { useState } from 'react';

const LoyaltyPointsOnly = ({ userId }: { userId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="relative min-h-screen bg-[#f8f9fa] pt-4 pb-8 pl-2 pr-6 font-sans text-[#333]">
      
      <div className="w-full space-y-5">
        {/* Current Loyalty Points Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-start">
            <h2 className="text-[15px] font-bold text-gray-800 mb-4">Current Loyalty Points</h2>
            <button 
              onClick={() => setIsOpen(true)}
              className="text-gray-600 border border-gray-300 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-50 transition-all shadow-sm"
            >
              Adjust Points
            </button>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <div className="text-[#f1c40f]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">0</div>
              <p className="text-[10px] text-gray-400 font-medium">100 points jusqu'à la prochaine conversion</p>
            </div>
          </div>
        </div>

        {/* Points History Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 min-h-[160px]">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Points History</h2>
          <div className="flex items-center justify-start h-24">
            <p className="text-gray-400 text-[13px] italic font-medium">No loyalty transactions found</p>
          </div>
        </div>

        {/* Conversion Settings Section */}
        <div className="bg-[#f0f6ff] border border-[#e0ebff] rounded-lg p-4 flex items-center space-x-3">
          <div className="text-blue-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 leading-none mb-1">Conversion Settings</h4>
            <p className="text-[11px] text-blue-600 font-bold uppercase tracking-tight">
              Taux de conversion: 500 points = 5 TND crédit portefeuille
            </p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000066] backdrop-blur-[1px] transition-all duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border border-gray-100 animate-in fade-in zoom-in duration-200">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Adjust Loyalty Points</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulaire */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Add or deduct loyalty points from customer's account. Use negative values to deduct.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Points</label>
                <input 
                  type="number"
                  placeholder="0 (use negative to deduct)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-[#f1c40f] focus:ring-1 focus:ring-yellow-100 outline-none text-sm transition-all shadow-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1.5 font-bold">Current balance: 0 points</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason *</label>
                <textarea 
                  rows={3}
                  placeholder="Explain the adjustment..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-[#f1c40f] focus:ring-1 focus:ring-yellow-100 outline-none text-sm transition-all shadow-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end space-x-2 px-6 py-4 bg-gray-50/80 rounded-b-xl border-t border-gray-100">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 bg-white shadow-sm"
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 text-xs font-bold text-white bg-[#81c784] hover:bg-[#66bb6a] rounded-md shadow-sm transition-all active:scale-95"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyPointsOnly;