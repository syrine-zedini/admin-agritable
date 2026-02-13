export interface Product {
  id: string;
  nameFr: string;
  nameAr?: string;
  nameTn?: string;
  categoryId: string;
  stockQuantity: number;
  lowStockAlert: number;
  minOrderQty: number;
  maxOrderQty?: number;
  description?: string;
  isBio: boolean;
  isNew: boolean;
  status: boolean;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
