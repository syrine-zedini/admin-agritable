"use client";
import { useState } from "react";
import ZoneSelector from "./ZoneSelector";
import { governorate, zone } from "@/constants/zones";

export default function AddCustomerModal({
  api,
  setCustomers,
  generateTemporaryPassword,
  loading,
  setLoading,
  error,
  setError,
  onClose,
  showToast, 
}: any) {

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    addressType: '',
    address: '',
    buildingNo: '',
    floor: '',
    apartment: '',
    cityAddress: '',
    zipCode: '',
    governorate: '',
    landmark: '',
    deliveryInstructions: '',
    selectedZone: null as number | null

  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      addressType: '',
      address: '',
      buildingNo: '',
      floor: '',
      apartment: '',
      cityAddress: '',
      zipCode: '',
      governorate: '',
      landmark: '',
      deliveryInstructions: '',
      selectedZone: null
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
        showToast?.('success', `Client "${formData.firstName} ${formData.lastName}" créé avec succès !`);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur création client';
      setError(message);
     showToast?.('error', message); 
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

          <h1 className="text-xl font-bold text-gray-800">Ajouter un nouveau client (B2C)</h1>
          <p className="text-sm text-gray-500">
            Créez un compte client B2C. Ce client pourra s'authentifier via son numéro de téléphone.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Prénom et Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Prénom *</label>
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
              <label className="text-sm font-semibold text-gray-700">Nom *</label>
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

          {/* Téléphone et Email */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Numéro de téléphone *</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="+216 98 123 456"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Email (Optionnel)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="ahmed@example.com"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Type d'adresse */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Type d'adresse</label>
            <select
              name="addressType"
              value={formData.addressType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Sélectionnez le type</option>
              <option value="Siége social">Siége social</option>
              <option value="Entrepôt">Entrepôt</option>
              <option value="Maison">Maison</option>
              <option value="Autre">Autre</option>

            </select>
          </div>

          {/* Zone */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Adresse (Optionnel)</label>
            <ZoneSelector
             zones={zone} 
             onSelect={(id: number) => setFormData(prev => ({ ...prev, selectedZone: id }))}
            />

          </div>

          {/* Adresse */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Adresse</label>
            <input
              type="string"
              name="address" 
              value={formData.address}
              onChange={handleInputChange}
              placeholder="01 rue .."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Bâtiment, Étage, Appartement */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">N° Bâtiment</label>
              <input
                name="buildingNo"
                value={formData.buildingNo}
                onChange={handleInputChange}
                placeholder="123"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Étage</label>
              <input
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                placeholder="2"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Appartement</label>
              <input
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                placeholder="5B"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Code postal</label>
            <input
              type="string"
              name="zipCode" 
              value={formData.zipCode}
              onChange={handleInputChange}
              placeholder="20240"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Gouvernorat */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Gouvernorat</label>
            <select
              name="governorate"
              value={formData.governorate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Sélectionner...</option>
              {governorate.map((gov) => ( 
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          {/* Point de repère */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Point de repère</label>
            <input
              name="landmark"
              value={formData.landmark}
              onChange={handleInputChange}
              placeholder="En face de la mosquée, à côté du café..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Instructions de livraison */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Instructions de livraison</label>
            <textarea
              name="deliveryInstructions"
              value={formData.deliveryInstructions}
              onChange={handleInputChange}
              placeholder="Sonner à l'interphone, appeler avant arrivée..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#10a352] text-white rounded-md hover:bg-green-700 font-bold"
            >
              {loading ? 'Création...' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}