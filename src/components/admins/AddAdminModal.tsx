interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Add New Admin User</h2>
          <p className="text-gray-500 mt-1">Create a new admin account with specific roles and permissions</p>
        </div>

        {/* Form Content */}
        <form className="px-8 py-4 space-y-6">
          
          {/* Row: First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-semibold text-gray-700">First Name</label>
              <input 
                type="text" 
                placeholder="Mohamed" 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-semibold text-gray-700">Last Name</label>
              <input 
                type="text" 
                placeholder="Salah" 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Email</label>
            <input 
              type="email" 
              placeholder="admin@agritable.tn" 
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-300"
            />
          </div>

          {/* Temporary Password */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Temporary Password</label>
            <input 
              type="password" 
              placeholder="Minimum 8 characters" 
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-300"
            />
            <p className="text-sm text-gray-400">User will be able to change this password after first login</p>
          </div>

          {/* Assign Role */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Assign Role</label>
            <div className="relative">
              <select className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600">
                <option>Support (Customer Service)</option>
                <option>SuperAdmin (Full Access)</option>
                <option>Financial(Payments,Reports)</option>
                <option>Logistics (Routes , Delivery)</option>
                <option>Support (Customer Service)</option>


              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 pb-8">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-3 border border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-3 bg-[#10a34b] hover:bg-[#0d8a3e] text-white rounded-lg font-semibold transition-colors"
            >
              Create Admin User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;