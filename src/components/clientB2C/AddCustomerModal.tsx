"use client";
import { useState } from "react";
import ZoneSelector from "./ZoneSelector";

export default function AddCustomerModal({
  api,
  setCustomers,
  generateTemporaryPassword,
  loading,
  setLoading,
  error,
  setError,
  onClose
}: any) {

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    governorate: '',
    city: '',
    address: '',
    postalCode: '',
    zone: ''
  });

  const zones = [
    { id: 1, name: 'zone 1', areas: 'Gammarth, La Marsa, Sidi Bou Said, Carthage, Le Kram...' },
    { id: 2, name: 'zone 2', areas: "El Manar, Ennasr, Jardins d'El Menzah, Menzah" },
    { id: 3, name: 'zone 3', areas: 'Lac 1, Lac 2' },
  ];

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      governorate: '',
      city: '',
      address: '',
      postalCode: '',
      zone: ''
    });
    setError('');
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const res = await api.post('/auth/signupb2c', {
        ...formData,
        password: generateTemporaryPassword(),
        roleName: 'ClientB2C'
      });

      if (res.data) {
        setCustomers((prev: any) => [res.data, ...prev]);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur création client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden relative">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 relative">
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h1 className="text-xl font-bold text-gray-800">Add New Customer (B2C)</h1>
          <p className="text-sm text-gray-500">
            Create a new B2C customer account. This customer will be able to authenticate using their phone number.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ahmed"
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Ben Ali"
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="+216 98 123 456"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
            <p className="text-xs text-gray-400 italic">
              Include country code (e.g., +216). Customer will use this to authenticate.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Email (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="ahmed@example.com"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="address" value={formData.address} onChange={handleInputChange}
              placeholder="123 Rue de l'exemple"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none" />

            <input name="city" value={formData.city} onChange={handleInputChange}
              placeholder="Tunis"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none" />

            <input name="postalCode" value={formData.postalCode} onChange={handleInputChange}
              placeholder="1002"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none" />

            <input name="governorate" value={formData.governorate} onChange={handleInputChange}
              placeholder="Tunis" required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Zone (Optional)</label>
            <ZoneSelector
              zones={zones}
              onSelect={(id: number) => setFormData({ ...formData, zone: id.toString() })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-[#10a352] text-white rounded-md hover:bg-green-700 font-bold"
            >
              {loading ? 'Création...' : 'Create Customer'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
