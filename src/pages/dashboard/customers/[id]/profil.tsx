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


interface Address {
  id?: string | null;
  addressType?: string;
  address?: string;
  buildingNo?: string;
  floor?: string;
  apartment?: string;
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
          
          const b2cData = userData.b2c_data || {};
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
        alert('No changes detected');
        setUpdating(false);
        return;
      }
      
      const res = await updateClient(userId, updateData);
      
      const updatedUser: User = res.data;
      setUser(updatedUser);
      
      setOriginalData(formData);
      
      alert('User updated successfully');
    } catch (err: any) {
      console.error('Erreur update:', err);
      alert(err.response?.data?.message || 'Error updating user');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    const userId = Array.isArray(id) ? id[0] : id as string;

    try {
      await deleteClient(userId);
      alert('User deleted successfully');
      const deletedUserId = userId;
      const stored = localStorage.getItem('b2cUserDeletedIds') || '[]';
      const deletedIds: string[] = JSON.parse(stored);
      deletedIds.push(deletedUserId);
      localStorage.setItem('b2cUserDeletedIds', JSON.stringify(deletedIds));
      router.push('/dashboard/b2cClient');
    } catch (err: any) {
      console.error('Erreur delete:', err);
      alert(err.response?.data?.message || 'Error deleting user');
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="mt-1 text-gray-500 hover:text-black text-xl">←</button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold lowercase">
                {displayFirstName} {displayLastName}
              </h1>
              <span className={`${user.status === 'Active' ? 'bg-[#22c55e]' : 'bg-gray-400'} text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase`}>
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
            onClick={handleDelete}
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
          {/* SECTION: INFORMATIONS PERSONNELLES */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">
              Personal Information
              {modifiedCount > 0 && (
                <span className="ml-2 text-sm font-normal text-yellow-600">
                  ({modifiedCount} field(s) modified)
                </span>
              )}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Yasminie"
                  className={getFieldClassName('firstName')}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Ben Abda"
                  className={getFieldClassName('lastName')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+216 98 123 456"
                  className={getFieldClassName('phoneNumber')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="username@example.com"
                  className={getFieldClassName('email')}
                />
              </div>
            </div>
          </div>

          {/* SECTION: ADRESSE COMPLÈTE */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Address</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Address Type</label>
                <select
                  name="addressType"
                  value={formData.addressType}
                  onChange={handleInputChange}
                  className={getFieldClassName('addressType')}
                >
                  <option value="">Select address type</option>
                  <option value="Siége social">Siége social</option>
                  <option value="Entrepôt">Entrepôt</option>
                  <option value="Maison">Maison</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Zone</label>
                <select
                  name="selectedZone"
                  value={formData.selectedZone || ''}
                  onChange={handleInputChange}
                  className={getFieldClassName('selectedZone')}
                >
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="01 rue .."
                  className={getFieldClassName('address')}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Building No.</label>
                  <input
                    type="text"
                    name="buildingNo"
                    value={formData.buildingNo}
                    onChange={handleInputChange}
                    placeholder="123"
                    className={getFieldClassName('buildingNo')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Floor</label>
                  <input
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="2"
                    className={getFieldClassName('floor')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Apartment</label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="5B"
                    className={getFieldClassName('apartment')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="20240"
                    className={getFieldClassName('zipCode')}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Governorate</label>
                <select
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleInputChange}
                  className={getFieldClassName('governorate')}
                >
                  <option value="">Select governorate</option>
                  {governorates.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  placeholder="Near the mosque, next to the cafe..."
                  className={getFieldClassName('landmark')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Delivery Instructions</label>
                <textarea
                  name="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={handleInputChange}
                  placeholder="Ring the intercom, call before arrival..."
                  rows={3}
                  className={getFieldClassName('deliveryInstructions')}
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
    </div>
  );
}