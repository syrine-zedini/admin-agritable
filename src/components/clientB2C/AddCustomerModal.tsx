"use client";
import { useState } from "react";
import ZoneSelector from "./ZoneSelector";
import { governorate, zone } from "@/constants/zones";
import { useToast } from "@/hooks/useToast";
import { createClientB2C } from "@/service/clientsB2C.service";
import ToastContainer from "../products/ToastContainer";

export default function AddCustomerModal({
  setCustomers,
  generateTemporaryPassword,
  onClose,
}: any) {

  const { toasts, showToast, removeToast } = useToast();
  
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
    ville:'',
    zipCode: '',
    governorate: '',
    landmark: '',
    deliveryInstructions: '',
    selectedZone: null as number | null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      ville:'',
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
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError('');

      console.log("Envoi des données...", formData);

      const response = await createClientB2C({
        ...formData,
        password: generateTemporaryPassword(),
        roleName: 'ClientB2C'
      });

      console.log("Réponse reçue:", response.data);

      if (response.data) {
        setCustomers((prev: any) => [response.data, ...prev]);
        
        showToast('success', `Client "${formData.firstName} ${formData.lastName}" créé avec succès !`);
        setTimeout(() => {onClose(); resetForm();}, 3000); 
      }
    } catch (err: any) {
      console.error("Erreur:", err);
      const message = err.response?.data?.message || 'Erreur création client';
      setError(message);
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden relative">

          {/* Header */}
          <div className="p-6 border-b border-gray-100 relative">
            <button
              onClick={() => { onClose(); resetForm(); }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
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
                  disabled={isSubmitting}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Numéro de téléphone *</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+216 98 123 456"
                required
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Email (Optionnel)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="ahmed@example.com"
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Type d'adresse */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Type d'adresse</label>
              <select
                name="addressType"
                value={formData.addressType}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
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
              <label className="text-sm font-semibold text-gray-700">Zone</label>
              <ZoneSelector
                zones={zone} 
                onSelect={(id: number) => setFormData(prev => ({ ...prev, selectedZone: id }))}
                disabled={isSubmitting}
              />
            </div>

            {/* Adresse */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Adresse</label>
              <input
                type="text"
                name="address" 
                value={formData.address}
                onChange={handleInputChange}
                placeholder="01 rue .."
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
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
                  disabled={isSubmitting}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Étage</label>
                <input
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  placeholder="2"
                  disabled={isSubmitting}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Appartement</label>
                <input
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleInputChange}
                  placeholder="5B"
                  disabled={isSubmitting}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                />
              </div>
            </div>
                                  

            {/* Ville & Code postal */}
           <div className="grid grid-cols-2 gap-4">
            {/* Ville */}
          <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Ville</label>
          <input
             type="text"
             name="ville"
             value={formData.ville}
             onChange={handleInputChange}
             placeholder="Tunis"
             disabled={isSubmitting}
             className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
           />
          </div>

          {/* Code postal */}
          <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Code postal</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            placeholder="20240"
            disabled={isSubmitting}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
          />
          </div>
           </div>
            {/* Gouvernorat */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Gouvernorat</label>
              <select
                name="governorate"
                value={formData.governorate}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
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
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
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
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Afficher l'erreur si elle existe */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { onClose(); resetForm(); }}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#10a352] text-white rounded-md hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Création en cours...
                  </>
                ) : (
                  'Créer le client'
                )}
              </button>
            </div>
          </form>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />

      </div>
    </>
  );
}