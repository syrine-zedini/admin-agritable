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
    purchaseQuantity: number;

    stockQuantity: number;
    lowStockAlert: number;
    minOrderQty: number;
    maxOrderQty: number;

    description?: string;

    isBio: boolean;
    isNew: boolean;

    images: string[];
    status: boolean;

    b2cSeelingPrice?: number; // ancien prixSurSite

    // ---------- B2C ----------
    b2cRatio: number;
    b2cMultiplier: number;
    remise: number;
    isB2cPriceOverride?: boolean;
    b2cSellingUnit: SellingUnit;

    // ---------- B2B ----------
    b2bRatio: number;
    b2bMultiplier: number;
    isB2bPriceOverride?: boolean;
    b2bSellingUnit: SellingUnit;

    b2bBasePriceValue?: number;

    // ---------- Virtual ----------
    sellingPrice?: number; // ancien b2cSeelingPrice
    b2bBasePriceCalculated?: number;

    createdAt?: string;
    updatedAt?: string;
    category_name?: string;
}
