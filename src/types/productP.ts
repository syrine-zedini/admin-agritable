import { SellingUnit } from "./unit";

export interface Product {
  id: string;
  nameFr: string;
  nameAr: string;
  nameTn: string;
  sku: string;
  categoryId: string;

  purchasePrice: number;
  purchaseUnit: string;

  stockQuantity: number;
  lowStockAlert: number;
  minOrderQty: number;
  maxOrderQty: number;

  description?: string;
  isBio: boolean;
  isNew: boolean;
  images: string[];
  status: boolean;

  b2cSellingPrice?: number;
  b2cRatio: number;
  b2cMultiplier: number;
  discount: number;
  isB2cPriceOverride?: boolean;
  b2cSellingUnit: SellingUnit;
  b2cSellingPriceCalculated?: number;

  b2bRatio: number;
  b2bMultiplier: number;
  isB2bPriceOverride?: boolean;
  b2bSellingUnit: SellingUnit;
  b2bSellingPrice?: number;
  b2bSellingPriceCalculated?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
