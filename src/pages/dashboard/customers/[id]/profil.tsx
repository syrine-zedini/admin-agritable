import React, { useEffect, useState, FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { governorate, zone } from "@/constants/zones";
import { deleteClient, getClientById, updateClient } from '@/service/clientsB2C.service';
import SendNotificationModal from "@/components/clientB2C/notification";
import OrdersTab from "@/components/clientB2C/OrdersTab";
import WalletTab from "@/components/clientB2C/WalletTab";
import LoyaltyTab from "@/components/clientB2C/LoyaltyTab"
import SendEmail from '@/components/communCommunication/email';
import ActivityTab from '@/components/clientB2C/ActivityTab';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/products/ToastContainer';

interface Address {
  id?: string | null;
  addressType?: string;
  address?: string;
  buildingNo?: string;
  floor?: string;
  apartment?: string;
  ville?:string;
  zipCode?: string;
  governorate?: string;
  landmark?: string;
  deliveryInstructions?: string;
  selectedZone?: string | null;
}

interface B2CData {
  addresses?: Address[];
  [key: string]: any;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  email?: string;
  status?: string;
  b2c_data?: B2CData;
  [key: string]: any;
}

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  addressType: string;
  address: string;
  buildingNo: string;
  floor: string;
  apartment: string;
  ville:string,
  zipCode: string;
  governorate: string;
  landmark: string;
  deliveryInstructions: string;
  selectedZone: string | null;
  addressId: string | null;
}

export default function CustomerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    addressType: '',
    address: '',
    buildingNo: '',
    floor: '',
    apartment: '',
    ville:'',
    zipCode: '',
    governorate: '',
    landmark: '',
    deliveryInstructions: '',
    selectedZone: null,
    addressId: null 
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Overview');

  const zones = zone;
  const governorates = governorate;

  useEffect(() => {
    if (!id) return;
    const userId = Array.isArray(id) ? id[0] : id as string;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await getClientById(userId);
        console.log('API Response:', response);
        
        const userData: User = response;
        
        if (userData) {
          setUser(userData);
          // Calcul du statut directement depuis b2c_data
         const b2cData = userData.b2c_data || {};
         const walletBalance = Number(b2cData.walletBalance ?? b2cData.negativeBalance ?? 0);
         const isActive = b2cData.isActive ?? false;
         const isSuspended = b2cData.isSuspended ?? false;

         const status = walletBalance < 0
         ? "Negative Balance"
         : isActive
         ? "Active"
         : isSuspended
         ? "Suspended"
         : "Inactive";
          
          const addresses = b2cData.addresses || [];
          const primaryAddress = addresses.length > 0 ? addresses[0] : {};
          
          const nameParts = userData.username ? userData.username.split(' ') : [];
          
          const newFormData: FormData = {
            firstName: userData.firstName || nameParts[0] || '',
            lastName: userData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '') || '',
            phoneNumber: userData.phoneNumber || '',
            email: userData.email || '',
            
            addressId: primaryAddress.id || null,
            addressType: primaryAddress.addressType || '',
            address: primaryAddress.address || '',
            buildingNo: primaryAddress.buildingNo || '',  
            floor: primaryAddress.floor || '',
            apartment: primaryAddress.apartment || '',
            ville: primaryAddress.ville || '',
            zipCode: primaryAddress.zipCode || '',        
            governorate: primaryAddress.governorate || '',
            landmark: primaryAddress.landmark || '',
            deliveryInstructions: primaryAddress.deliveryInstructions || '',
            selectedZone: primaryAddress.selectedZone || null
          };
          
          setFormData(newFormData);
          setOriginalData(newFormData);
        }
      } catch (err) {
        console.error('Erreur fetch user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fonction pour sélectionner une zone
  const handleZoneSelect = (zoneNumber: string) => {
    setFormData(prev => ({ ...prev, selectedZone: zoneNumber }));
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    
    setUpdating(true);
    const userId = Array.isArray(id) ? id[0] : id as string;

    try {
      const changedFields: Partial<FormData> = {};
      const addressFields: Partial<Omit<FormData, 'firstName' | 'lastName' | 'phoneNumber' | 'email'>> = {};
      
      (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
        const formValue = formData[key];
        const originalValue = originalData ? originalData[key] : '';
  
        if (formValue !== originalValue) {
          if (['firstName', 'lastName', 'phoneNumber', 'email'].includes(key)) {
            changedFields[key as keyof typeof changedFields] = formValue as never;
          } else if (key === 'selectedZone') {
            addressFields.selectedZone = formValue;
          } else {
            addressFields[key as keyof typeof addressFields] = formValue as never;
          }
        }
      });

      const updateData: any = {
        ...changedFields,
        ...(Object.keys(addressFields).length > 0 && { 
          b2c_data: {
            addresses: [{
              id: formData.addressId, 
              ...addressFields
            }]
          }
        })
      };

      if (Object.keys(updateData).length === 0 || 
          (Object.keys(updateData).length === 1 && updateData.b2c_data && Object.keys(updateData.b2c_data.addresses[0]).length <= 1)) {
        showToast("error", 'No changes detected');
        setUpdating(false);
        return;
      }
      const res = await updateClient(userId, updateData);
      
      const updatedUser: User = res.data;
      setUser(updatedUser);
      
      setOriginalData(formData);
      
      showToast("success", 'User updated successfully');
    } catch (err: any) {
      console.error('Erreur update:', err);
      showToast("error", err.response?.data?.message || 'Error updating user');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivate = async () => {
  if (!id || !user) return;
  const userId = Array.isArray(id) ? id[0] : id as string;

  try {
    const res = await updateClient(userId, {
      b2c_data: {
        ...user.b2c_data,
        isActive: false,
        isSuspended: true
      }
    });

    // Mettre à jour le user localement
    setUser(prev => prev ? {
      ...prev,
      b2c_data: {
        ...prev.b2c_data,
        isActive: false,
        isSuspended: true
      }
    } : prev);

    showToast("success", "User désactivé");
  } catch (err: any) {
    console.error(err);
    showToast("error", "Impossible de mettre à jour le client");
  } finally {
    setIsConfirmModalOpen(false);
  }
};


  const isFieldModified = (fieldName: keyof FormData): boolean => {
    if (!originalData) return false;
    return formData[fieldName] !== originalData[fieldName];
  };

  const getFieldClassName = (fieldName: keyof FormData): string => {
    return `w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none ${
      isFieldModified(fieldName) 
        ? 'border-yellow-500 bg-yellow-50' 
        : 'border-gray-300'
    }`;
  };

  const getModifiedFieldsCount = (): number => {
    if (!originalData) return 0;
    let count = 0;
    (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
      if (formData[key] !== originalData[key]) {
        count++;
      }
    });
    return count;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">User not found</div>;

  const tabs = ['Overview', 'Orders', 'Wallet & Transactions', 'Loyalty Points', 'Activity Log'];
  const modifiedCount = getModifiedFieldsCount();

  const userId = user.id || 'N/A';
  const displayId = userId.length > 10 ? `${userId.substring(0, 10)}...` : userId;

  const displayFirstName = user.firstName || (user.username ? user.username.split(' ')[0] : '');
  const displayLastName = user.lastName || (user.username && user.username.split(' ').length > 1 ? user.username.split(' ').slice(1).join(' ') : '');

 
  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-6 text-[#1a1a1a] font-sans">
      <Head>
        <title>{displayFirstName} {displayLastName} | Dashboard</title>
      </Head>

      {/* MODAL DE CONFIRMATION POUR DÉSACTIVATION */}
      {isConfirmModalOpen && user && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Deactivate Customer</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to deactivate {displayFirstName} {displayLastName}? 
              They will no longer be able to place orders.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
              onClick={handleDeactivate}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
               Deactivate
             </button>

            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="mt-1 text-gray-500 hover:text-black text-xl">←</button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold lowercase">
                {displayFirstName} {displayLastName}
              </h1>
              <span className={`
               ${user.status === 'Active' ? 'bg-[#22c55e]' : 
               user.status === 'Negative Balance' ? 'bg-red-500' : 
               user.status === 'Suspended' ? 'bg-orange-500' :  'bg-gray-400'} 
               text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase`}>
               {user.status || 'Inactive'}
            </span>
            </div>
            <p className="text-gray-400 text-xs">Customer ID: {displayId}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-1 border border-gray-300 bg-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50">
            <span className="text-xs">📞</span> Call
          </button>
          <SendEmail email={user.email||''} />

          <>
        <button
          onClick={() => setIsNotificationModalOpen(true)}
          className="border border-gray-300 bg-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50"
        >
         Send Notification
       </button>

       {isNotificationModalOpen && user && (
        <SendNotificationModal
         isOpen={isNotificationModalOpen}
         onClose={() => setIsNotificationModalOpen(false)}
         user={user}
        />
        )}
        </>

          <button 
            onClick={() => setIsConfirmModalOpen(true)}
            className="bg-[#ef4444] text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 hover:bg-red-600"
          >
            <span className="text-lg leading-none">×</span> Deactivate
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-[#f0f2f5] p-1 rounded-lg flex items-center w-fit mb-8 shadow-sm border border-gray-100">
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

      {/* AFFICHAGE CONDITIONNEL DES ONGLETS */}
      {activeTab === 'Overview' && (
        <form onSubmit={handleUpdate} className="space-y-6">
          {/* CONTENEUR PRINCIPAL EN LIGNE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

     {/* SECTION: PERSONAL INFORMATION */}
     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
     <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold">Personal Information</h2>
      <button className="text-gray-400 hover:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
    
    <div className="space-y-4">
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">Name</div>
        <div className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</div>
      </div>
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">Phone</div>
        <div className="font-medium text-gray-900">{formData.phoneNumber}</div>
      </div>
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">Email</div>
        <div className="font-medium text-gray-900 lowercase">{formData.email}</div>
      </div>
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">Registration Date</div>
        <div className="font-medium text-gray-900 text-sm">19/02/2026</div>
      </div>
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">Last Login</div>
        <div className="font-medium text-gray-900 text-sm">N/A</div>
      </div>
    </div>
  </div>

  {/* SECTION: ACCOUNT STATUS */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
    <h2 className="text-xl font-bold mb-6">Account Status</h2>
    
    <div className="space-y-6">
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Status</div>
        <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full">ACTIVE</span>
      </div>
      
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Wallet Balance</div>
        <div className="flex items-center gap-2 font-bold text-green-600 text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          0.00 TND
        </div>
        <button className="mt-3 px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700">Adjust Wallet</button>
      </div>

      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Loyalty Points</div>
        <div className="flex items-center gap-2 font-bold text-yellow-500 text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2z" />
          </svg>
          0
        </div>
        <button className="mt-3 px-4 py-1.5 border border-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-50 uppercase">Adjust Points</button>
      </div>
    </div>
  </div>

  {/* SECTION: QUICK STATS */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
    <h2 className="text-xl font-bold mb-6">Quick Stats</h2>
    
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Total Orders</div>
        <div className="font-bold text-gray-900 text-xl leading-none">0</div>
      </div>
      
      <div className="flex justify-between items-end border-t border-gray-50 pt-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Total Spent</div>
        <div className="font-bold text-gray-900 text-xl leading-none">0.00 TND</div>
      </div>

      <div className="flex justify-between items-end border-t border-gray-50 pt-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Avg. Order Value</div>
        <div className="font-medium text-gray-900">0.00 TND</div>
      </div>

      <div className="flex justify-between items-end border-t border-gray-50 pt-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Last Order</div>
        <div className="font-medium text-gray-700">N/A</div>
        </div>
      </div>
    </div>
  </div>
          {/* SECTION: ADD ADDRESS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Add Address</h2>
            
            <div className="space-y-4">
              {/* Zones cliquables avec bordure grise initiale */}
              {zones.map((z) => (
            <div 
            key={z.id}
            onClick={() => handleZoneSelect(z.id.toString())}
            className={`cursor-pointer p-3 rounded-lg border-2 transition-colors ${
            formData.selectedZone === z.id.toString()
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
            }`}
          >
           <div className="font-medium mb-1">{z.name}</div>
             <div className="text-sm text-gray-600">{z.areas}</div>
            </div>
               ))}
              {/* Disposition des champs selon l'image */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de l'adresse</label>
                  <select
                    name="addressType"
                    value={formData.addressType}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Sélectionnez le type</option>
                    <option value="Siége social">Siége social</option>
                    <option value="Entrepôt">Entrepôt</option>
                    <option value="Maison">Maison</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Rue, avenue..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° Bâtiment</label>
                  <input
                    type="text"
                    name="buildingNo"
                    value={formData.buildingNo}
                    onChange={handleInputChange}
                    placeholder="123"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
                  <input
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="2"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appartement</label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="58"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange}
                    placeholder="ville"
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="1000"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gouvernorat</label>
                <select
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Sélectionner...</option>
                  {governorates.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point de repère</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  placeholder="En face de la mosquée, à côté du café..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions de livraison</label>
                <textarea
                  name="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={handleInputChange}
                  placeholder="Sonner à l'interphone, appeler avant arrivée..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              
            </div>
          </div>

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
              disabled={updating || modifiedCount === 0}
              className={`px-8 py-2 rounded-md font-bold ${
                modifiedCount === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#10a352] hover:bg-green-700'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {updating ? 'Updating...' : 'Update Customer'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'Orders' && (
        <OrdersTab />
      )}

      {activeTab === 'Wallet & Transactions' && (
        <WalletTab userId={userId} />
      )}

      {activeTab === 'Loyalty Points' && (
        <LoyaltyTab userId={userId} />
      )}

      {activeTab === 'Activity Log' && (
        <ActivityTab userId={userId} />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}