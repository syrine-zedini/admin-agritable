import { Category } from "./category";
import { SellingUnit } from "./unit";

export interface Product {
    id: string;
    nameFr: string;
    nameAr: string;
    nameTn: string;
    sku: string;
    categoryId: string;
    category?: Category;
    stockQuantity: number;
    lowStockAlert: number;
    minOrderQty: number;
    maxOrderQty: number;
    description?: string;
    isBio: boolean;
    isNew: boolean;
    images: string[];
    status: boolean;

    // B2C
    b2cRatio: number;
    b2cPurchasePrice: number;
    b2cMultiplier: number;
    b2cSellingPrice: number;
    b2cSitePrice: number;
    isPriceOverB2c: boolean;
    b2cSellingUnit: SellingUnit;

    // B2B
    b2bRatio: number;
    b2bMultiplier: number;
    b2bBasePrice: number;
    b2bBasePriceCalculated: number;
    b2bSitePrice: number;
    isPriceOverB2b: boolean;
    b2bSellingUnit: SellingUnit;

    createdAt?: string;
    updatedAt?: string;
}
