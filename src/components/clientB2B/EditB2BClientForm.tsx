"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateB2BClient } from "@/service/clientsB2B.service";
import { governorate, zone } from "@/constants/zones";
import { Client } from "@/types/clientB2B.types";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "../products/ToastContainer";

interface Props {
  onClose: () => void;
  onClientUpdated: () => void;
  client: Client;
}

interface FormData {
  businessName: string;
  institutionType: string;
  managerFirstName: string;
  managerLastName: string;
  phone: string;
  email: string;
  taxId: string;
  selectedZone: number | null;
  addressType: string;
  address: string;
  buildingNo: string;
  floor: string;
  apartment: string;
  ville: string;
  zipCode: string;
  governorate: string;
  landmark: string;
  deliveryInstructions: string;
}

export default function EditB2BClientForm({ onClose, onClientUpdated, client }: Props) {
  const { toasts, showToast, removeToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    institutionType: '',
    managerFirstName: '',
    managerLastName: '',
    phone: '',
    email: '',
    taxId: '',
    selectedZone: null,
    addressType: '',
    address: '',
    buildingNo: '',
    floor: '',
    apartment: '',
    ville: '',
    zipCode: '',
    governorate: '',
    landmark: '',
    deliveryInstructions: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplir le formulaire avec les données du client
  useEffect(() => {
    if (client) {
      setFormData({
        businessName: client.businessName || '',
        institutionType: client.institutionType || '',
        managerFirstName: client.firstName || '',
        managerLastName: client.lastName || '',
        phone: client.phoneNumber || '',
        email: client.email || '',
        taxId: (client as any).taxId || '', 
        selectedZone: (client as any).selectedZone || null,
        addressType: (client as any).addressType || '',
        address: client.address || '',
        buildingNo: (client as any).buildingNo || '',
        floor: (client as any).floor || '',
        apartment: (client as any).apartment || '',
        ville: (client as any).ville || '',
        zipCode: (client as any).zipCode || '',
        governorate: (client as any).governorate || '',
        landmark: (client as any).landmark || '',
        deliveryInstructions: (client as any).deliveryInstructions || ''
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        userId: client.id, 
        firstName: formData.managerFirstName,
        lastName: formData.managerLastName,
        phoneNumber: formData.phone,
        email: formData.email,
        governorate: formData.governorate,
        businessName: formData.businessName,
        institutionType: formData.institutionType,
        managerFirstName: formData.managerFirstName,
        managerLastName: formData.managerLastName,
        phone: formData.phone,
        taxId: formData.taxId,
        selectedZone: formData.selectedZone,
        addressType: formData.addressType,
        address: formData.address,
        buildingNo: formData.buildingNo,
        floor: formData.floor || null,
        apartment: formData.apartment || null,
        ville: formData.ville,
        zipCode: formData.zipCode || null,
        landmark: formData.landmark || null,
        deliveryInstructions: formData.deliveryInstructions || null
      };

      await updateB2BClient(client.id, payload);


     onClientUpdated();

    setTimeout(() => {
    onClose();
    }, 3000);
    } catch (err: any) {
      console.error(err);
     showToast("error", err.message || "Erreur lors de la modification du client");    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="max-w-2xl w-full max-h-[90vh] bg-white shadow-xl rounded-lg border border-gray-200 overflow-y-auto font-sans text-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Modifier le Client B2B</h2>
            <p className="text-sm text-gray-500 mt-1">
              Modifier les informations du client. ID: {client.id.substring(0, 8)}...
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Business & Institution */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Business Name *</label>
              <input
                type="text"
                placeholder="Restaurant Le Gourmet"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="p-2.5 border border-green-500 rounded-md outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Institution Type *</label>
              <select
                className="p-2.5 border border-gray-300 rounded-md bg-white text-gray-500"
                value={formData.institutionType}
                onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                required
              >
                <option value="">Sélectionner le type</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Hôtel">Hôtel</option>
                <option value="Café">Café</option>
                <option value="Supermarché">Supermarché</option>
                <option value="Épicerie">Épicerie</option>
                <option value="Entreprise">Entreprise</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Manager Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Manager First Name *</label>
              <input
                type="text"
                placeholder="Youssef"
                value={formData.managerFirstName}
                onChange={(e) => setFormData({ ...formData, managerFirstName: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-md outline-none focus:border-green-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Manager Last Name *</label>
              <input
                type="text"
                placeholder="Ben Ahmed"
                value={formData.managerLastName}
                onChange={(e) => setFormData({ ...formData, managerLastName: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-md outline-none focus:border-green-500"
                required
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="+216 98 111 222"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-md"
                required
              />
              <span className="text-xs text-gray-400 mt-1">Include country code (e.g., +216)</span>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Email *</label>
              <input
                type="email"
                placeholder="youssef@legourmet.tn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {/* Tax ID */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Tax ID (Optional)</label>
            <input
              type="text"
              placeholder="1234567ABC"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              className="p-2.5 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          {/* Zones */}
          <div className="space-y-2 mt-4">
            <label className="text-sm font-semibold text-gray-700">Zone (Optionnel)</label>
            {zone.map((z) => (
              <div
                key={z.id}
                onClick={() => setFormData({ ...formData, selectedZone: z.id })}
                className={`p-3 border rounded-md cursor-pointer ${
                  formData.selectedZone === z.id ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
                }`}
              >
                <p className="font-semibold">{z.name}</p>
                <p className="text-gray-500 text-sm">{z.areas}</p>
              </div>
            ))}
          </div>

          {/* Address Details */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Type de l'adresse</label>
              <select
                className="p-2.5 border border-gray-300 rounded-md text-gray-500 bg-white"
                value={formData.addressType}
                onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
              >
                <option value="">Sélectionnez le type</option>
                <option value="Commercial">Commercial</option>
                <option value="Résidentiel">Résidentiel</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Adresse *</label>
              <input
                type="text"
                placeholder="Rue, avenue..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold mb-1">N° Bâtiment</label>
                <input
                  type="text"
                  placeholder="123"
                  value={formData.buildingNo}
                  onChange={(e) => setFormData({ ...formData, buildingNo: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold mb-1">Étage</label>
                <input
                  type="text"
                  placeholder="2"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold mb-1">Appartement</label>
                <input
                  type="text"
                  placeholder="5B"
                  value={formData.apartment}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold mb-1">Ville *</label>
                <input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold mb-1">Code postal</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Gouvernorat</label>
              <select
                className="p-2.5 border border-gray-300 rounded-md text-gray-500 bg-white"
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
              >
                <option value="">Selectionner...</option>
                {governorate.map((g) => (
                  <option key={g} value={g.toLowerCase()}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Point de repère</label>
              <input
                type="text"
                placeholder="En face de la mosquée, à côté du café..."
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Instructions de livraison</label>
              <textarea
                rows={3}
                placeholder="Sonner à l'interphone, appeler avant arrivée..."
                value={formData.deliveryInstructions}
                onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-md resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#10a342] text-white rounded-md font-semibold hover:bg-[#0d8a37] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Modification en cours...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
      {/* Toast */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}