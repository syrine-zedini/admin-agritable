import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function CustomerProfile() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Zones exactement comme dans AddCustomerModal
  const zones = [
    { id: 1, name: 'zone 1', areas: 'Gammarth, La Marsa, Sidi Bou Said, Carthage, Le Kram, La Goulette, Jardins de Carthage, Ain Zaghouane' },
    { id: 2, name: 'zone 2', areas: "El Manar, Emnaz, Jardins d'El Menzah, Manzah" },
    { id: 3, name: 'zone 3', areas: 'Lac 1, Lac 2' },
    { id: 4, name: 'zone 4', areas: 'Sokra, El Aouina, Borj Louizir' },
    { id: 5, name: 'zone 5', areas: 'Riadh Andalous, Ghazela, Petit Ariana' },
    { id: 6, name: 'zone 6', areas: 'Centre Urbain Nord, Borj Baccouche, Ariana Ville' },
    { id: 7, name: 'zone 7', areas: 'Manouba, Bardo, Denden' },
    { id: 8, name: 'zone 8', areas: 'Tunis Centre Ville, Belvédère, El Omrane' },
    { id: 9, name: 'zone 9', areas: 'Monfleury, Bab Saadoun, Bellevue, Wardia' },
    { id: 10, name: 'zone 10', areas: 'Mourouj' },
    { id: 11, name: 'zone 11', areas: 'Rades, Mégrine, Hammam Lif, Bou Mhel el-Bassatine, Medina Jedida, Ben Arous' }
  ];

  // Gouvernorats comme dans AddCustomerModal
  const governorates = ["Tunis", "Ariana", "Ben Arous", "Manouba"];

  useEffect(() => {
    if (!id) return;
    const userId = Array.isArray(id) ? id[0] : id;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}auth/${userId}`);
        if (res.data?.data) {
          const mergedData = { ...res.data.data, ...res.data.data.user };
          setUser(mergedData);
          setFormData(mergedData);
        }
      } catch (err) {
        console.error('Erreur fetch user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // UPDATE - Consomme l'endpoint PUT /:id
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!id) return;
    
    setUpdating(true);
    const userId = Array.isArray(id) ? id[0] : id;

    try {
      // Envoie seulement les champs du formulaire dans req.body
      const res = await axios.put(`${API_URL}auth/${userId}`, formData);
      setUser(res.data.data);
      alert('User updated successfully');
    } catch (err) {
      console.error('Erreur update:', err);
      alert(err.response?.data?.message || 'Error updating user');
    } finally {
      setUpdating(false);
    }
  };

  // DELETE - Consomme l'endpoint DELETE /:id
const handleDelete = async () => {
  if (!id) return;
  const confirmDelete = confirm('Are you sure you want to delete this user?');
  if (!confirmDelete) return;

  const userId = Array.isArray(id) ? id[0] : id;

  try {
    await axios.delete(`${API_URL}auth/${userId}`);
    alert('User deleted successfully');
    router.back(); // ← Redirection vers la page précédente
  } catch (err) {
    console.error('Erreur delete:', err);
    alert(err.response?.data?.message || 'Error deleting user');
  }
};

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">User not found</div>;

  const tabs = ['Overview', 'Orders', 'Wallet & Transactions', 'Loyalty Points', 'Activity Log'];

  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-6 text-[#1a1a1a] font-sans">
      <Head>
        <title>{user.firstName} {user.lastName} | Dashboard</title>
      </Head>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="mt-1 text-gray-500 hover:text-black text-xl">←</button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold lowercase">{user.firstName} {user.lastName}</h1>
              <span className={`${user.status === 'Active' ? 'bg-[#22c55e]' : 'bg-gray-400'} text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase`}>
                {user.status || 'Inactive'}
              </span>
            </div>
            <p className="text-gray-400 text-xs">Customer ID: {user.id ? `${user.id.substring(0, 10)}...` : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-1 border border-gray-300 bg-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50">
            <span className="text-xs">📞</span> Call
          </button>
          <button className="flex items-center gap-1 border border-gray-300 bg-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50">
            <span className="text-xs">✉️</span> Email
          </button>
          <button className="border border-gray-300 bg-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50">
            Send Notification
          </button>
          <button 
            onClick={handleDelete}
            className="bg-[#ef4444] text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 hover:bg-red-600"
          >
            <span className="text-lg leading-none">×</span> Deactivate
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'text-gray-900 border-b-2 border-gray-900 bg-white px-3 rounded-t-md'
                : 'text-gray-500 hover:text-gray-700 px-3'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FORMULAIRE DE MISE À JOUR */}
      <form onSubmit={handleUpdate} className="space-y-6">
        {/* SECTION: INFORMATIONS PERSONNELLES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleInputChange}
                placeholder="Yasminie"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            {/* Nom */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleInputChange}
                placeholder="Ben Abda"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                placeholder="username@example.com"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber || ''}
                onChange={handleInputChange}
                placeholder="+216 98 123 456"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION: ADRESSE COMPLÈTE (comme dans AddCustomerModal) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Address</h2>
          
          <div className="space-y-4">
            {/* Type d'adresse */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Address Type</label>
              <select
                name="addressType"
                value={formData.addressType || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select address type</option>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Adresse */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Bâtiment, Étage, Appartement */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Building Number</label>
                <input
                  type="text"
                  name="buildingNumber"
                  value={formData.buildingNumber || ''}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Floor</label>
                <input
                  type="text"
                  name="floor"
                  value={formData.floor || ''}
                  onChange={handleInputChange}
                  placeholder="2"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Apartment</label>
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment || ''}
                  onChange={handleInputChange}
                  placeholder="5B"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            {/* Ville et Code Postal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder="Tunis"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode || ''}
                  onChange={handleInputChange}
                  placeholder="1000"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            {/* Gouvernorat */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Governorate</label>
              <select
                name="governorate"
                value={formData.governorate || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select governorate</option>
                {governorates.map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            {/* Zone */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Zone</label>
              <select
                name="zone"
                value={formData.zone || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.name}>{zone.name}</option>
                ))}
              </select>
            </div>

            {/* Point de repère */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Landmark</label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark || ''}
                onChange={handleInputChange}
                placeholder="Near the mosque, next to the cafe..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Instructions de livraison */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Delivery Instructions</label>
              <textarea
                name="deliveryInstructions"
                value={formData.deliveryInstructions || ''}
                onChange={handleInputChange}
                placeholder="Ring the intercom, call before arrival..."
                rows={3}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* BOUTONS D'ACTION */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updating}
            className="px-8 py-2 bg-[#10a352] text-white rounded-md hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}