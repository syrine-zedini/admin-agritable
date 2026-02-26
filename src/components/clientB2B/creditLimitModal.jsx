import React from 'react';

const CreditLimitModal = ({ isOpen, onClose, client }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[650px] rounded-2xl shadow-2xl relative p-10">
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-10">
          <h2 className="text-[26px] font-bold text-[#2d2d2d] mb-1">
            Manage Credit Limit
          </h2>
          <p className="text-gray-500 text-[18px]">
            Set the credit limit for{" "}
            <span className="font-semibold text-gray-600">
              {client?.firstName} {client?.lastName}
            </span>
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-10">
          <label className="block text-[18px] font-bold text-[#333] mb-3">
            Credit Limit (TND)
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="Enter credit limit"
              className="w-full px-5 py-4 border-2 border-[#22c55e] rounded-2xl focus:outline-none text-gray-700 placeholder-gray-400 text-[17px] shadow-sm"
            />
          </div>
          <p className="text-[15px] text-gray-400 mt-3">
            Current balance: {client?.balance ?? "0.00"} TND
          </p>
        </div>

        {/* Actions / Footer */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-10 py-3.5 text-[17px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all min-w-[140px]"
          >
            Cancel
          </button>
          <button
            className="px-8 py-3.5 text-[17px] font-bold text-white bg-[#22c55e] rounded-xl hover:bg-[#1eb054] transition-all shadow-md active:scale-95"
          >
            Update Credit Limit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditLimitModal;