
export interface Address {
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
  selectedZone: number;
}

export interface B2BData {
  businessName: string;
  institutionType: string;
  taxId: string | null;
  selectedZone: number;
  accountStatus: string;
  rejectionReason: string | null;
  addresses: Address[];
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  b2b_data?: B2BData; 
  status?: string;
  orders?: number;
  balance?: string;
  businessName?: string;
  institutionType?: string;
  address?: string;
  taxId?: string ;
  ville?:string;
  
  
}

// Type pour les zones

export interface Zone {
  id: number;
  name: string;
  areas: string; // liste des localités séparées par une virgule
}

// Props pour la carte de statistiques

export interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  color?: string;
}

// Props pour le badge de statut

export interface StatusBadgeProps {
  status: string;
}

// Props pour le formulaire d'ajout B2B

export interface AddB2BClientFormProps {
  onClose: () => void;
  onClientAdded: () => void;
}

// Type pour les données du formulaire B2B

export interface B2BClientFormData {
  roleName: string;
  businessName: string;
  institutionType: string;
  managerFirstName: string;
  managerLastName: string;
  password: string;
  phone: string;
  email: string;
  taxId: string;
  selectedZone: number | null;
  addressType: string;
  address: string;
  buildingNo: string;
  floor: string;
  apartment: string;
  city: string;
  zipCode: string;
  governorate: string;
  landmark: string;
  deliveryInstructions: string;
}
