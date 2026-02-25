import { Product } from "./product";

export interface PricingSpreadsheetRow extends Product {
    
    b2cCalculatedSeelingPrice?: number
    b2bCalculatedSeelingPrice?: number

}