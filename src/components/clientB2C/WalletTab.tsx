import React, { useState } from 'react';

const WalletPageMinimal = ({ userId }: { userId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="relative min-h-screen bg-[#f8f9fa] pt-4 pb-8 pl-2 pr-6 font-sans text-[#333]">
      
      <div className="w-full space-y-5">
        {/* Wallet Balance Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-start">
            <h2 className="text-[15px] font-bold text-gray-800 mb-4">Wallet Balance</h2>
            <button 
              onClick={() => setIsOpen(true)}
              className="bg-[#28a745] hover:bg-[#218838] text-white px-3 py-1 rounded text-[11px] font-medium transition-all shadow-sm"
            >
              Adjust Wallet
            </button>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <div className="text-[#28a745]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#28a745]">0.00 TND</div>
              <p className="text-[10px] text-gray-400 leading-none">Current balance</p>
            </div>
          </div>
        </div>

        {/* Transaction History Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 min-h-[160px]">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Transaction History</h2>
          <div className="flex items-center justify-start h-24">
            <p className="text-gray-400 text-[13px] italic">No transactions found</p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000066] backdrop-blur-[1px] transition-all">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border border-gray-100 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Adjust Wallet Balance</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Add or deduct amount from customer's wallet. Use negative values to deduct.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Amount (TND)</label>
                <input 
                  type="number"
                  placeholder="0.00 (use negative to deduct)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none text-sm transition-all shadow-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Current balance: 0.00 TND</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason *</label>
                <textarea 
                  rows={3}
                  placeholder="Explain the adjustment..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-100 outline-none text-sm transition-all shadow-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 px-6 py-4 bg-gray-50/80 rounded-b-xl">
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

export default WalletPageMinimal;