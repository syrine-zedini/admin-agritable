// src/pages/dashboard/customers/[id]/wallet.tsx
import React from 'react';
import { useRouter } from 'next/router';
import WalletPageMinimal from '@/components/clientB2C/WalletTab';

const CustomerWalletPage = () => {
  const router = useRouter();
  const { id } = router.query;
  if (!id || typeof id !== "string") return null;
  const userId = id;
  return (
    <div>
      {/* Vous pouvez ajouter un en-tête avec les infos du client ici */}
      <div className="mb-4 px-4">
        <button 
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour
        </button>
      </div>
      <WalletPageMinimal userId={userId} />
    </div>
  );
};

export default CustomerWalletPage;