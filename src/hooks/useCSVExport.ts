import { useCallback } from 'react';
import Papa from 'papaparse';
import { PricingSpreadsheetRow } from '@/types/pricingSpreadsheetRow';
import { B2BClient } from '@/types/pricingSpreadsheet';

interface UseCSVExportReturn {
  exportToCSV: (
    data: PricingSpreadsheetRow[],
    selectedB2BClients: string[],
    b2bClients: B2BClient[],
    filename?: string
  ) => void;
}

export const useCSVExport = (): UseCSVExportReturn => {
  const exportToCSV = useCallback(
    (
      data: PricingSpreadsheetRow[],
      selectedB2BClients: string[],
      b2bClients: B2BClient[],
      filename: string = 'pricing-data.csv'
    ) => {
      // Build CSV rows
      const csvRows = data.map((row) => {
        // Base columns
        const baseData: Record<string, any> = {
          SKU: row.sku || '',
          'Product Name': row.nameFr || '',
          Category: row.category_name || '',

          // Unit System
          'Purchase Unit': row.purchaseUnit || '',
          'B2C Ratio': row.b2cRatio!== null && row.b2cRatio !== undefined ? row.b2cRatio.toFixed(2) : '1.00',
          'B2C Selling Unit': row.b2cSellingUnit || '',
          'B2B Ratio': row.b2bRatio !== null && row.b2bRatio !== undefined ? row.b2bRatio.toFixed(2) : '1.00',
          'B2B Selling Unit': row.b2bSellingUnit || '',

          // B2C Pricing
          'Prix Achat': row.purchasePrice !== null && row.purchasePrice !== undefined ? row.purchasePrice.toFixed(2) : '',
          'B2C Multiplier': row.b2cMultiplier !== null && row.b2cMultiplier !== undefined ? row.b2cMultiplier.toFixed(2) : '2.00',
          'Prix de Vente (Calculated)': row.b2cSellingPriceCalculated !== null && row.b2cSellingPriceCalculated !== undefined ? row.b2cSellingPriceCalculated.toFixed(2) : '',
          'Prix sur Site': row.b2cSellingPrice !== null && row.b2cSellingPrice !== undefined ? row.b2cSellingPrice.toFixed(2) : '',
          'Price Override': row.isB2cPriceOverride ? 'Yes' : 'No',

          // B2B Pricing
          'B2B Multiplier': row.b2bMultiplier !== null && row.b2bMultiplier !== undefined ? row.b2bMultiplier.toFixed(2) : '1.50',
          'B2B Price (Calculated)': row.b2bSellingPriceCalculated!== null && row.b2bSellingPriceCalculated !== undefined ? row.b2bSellingPriceCalculated.toFixed(2) : '',
          'B2B Base Price': row.b2bSellingPrice !== null && row.b2bSellingPrice !== undefined ? row.b2bSellingPrice.toFixed(2) : '',

          // Logistics & Operations
          /*'Supplier Name': row.supplier_name || '',
          'Deliverer': row.deliverer_name || '',
          'Pickup Date': row.pickup_date ? new Date(row.pickup_date).toLocaleDateString('fr-FR') : '',
          Stock: row.stock !== null && row.stock !== undefined ? row.stock : '',
          Besoin: row.besoin !== null && row.besoin !== undefined ? row.besoin : '',
          Commande: row.commande !== null && row.commande !== undefined ? row.commande : '',*/

          // Legacy fields (kept for compatibility)
          Unit: row.purchaseUnit || '',
          'Unit Size': row.unit_size || '',
          'B2C Price': row.b2cSellingPrice !== null && row.b2cSellingPrice !== undefined ? row.b2cSellingPrice.toFixed(2) : '',
        };

        // Calculate margins
        if (row.b2cSellingPrice && row.purchasePrice) {
          const margin = ((row.b2cSellingPrice - row.purchasePrice) / row.purchasePrice) * 100;
          baseData['B2C Margin %'] = margin.toFixed(2);
        } else {
          baseData['B2C Margin %'] = '';
        }

        if (row.b2bSellingPrice  && row.purchasePrice) {
          const margin = ((row.b2bSellingPrice  - row.purchasePrice) / row.purchasePrice) * 100;
          baseData['B2B Margin %'] = margin.toFixed(2);
        } else {
          baseData['B2B Margin %'] = '';
        }

        // Add B2B client columns
        selectedB2BClients.forEach((clientId) => {
          const client = b2bClients.find((c) => c.id === clientId);
          const clientName = client?.display_name || `Client ${clientId}`;
          const pricing = row.b2b_pricing?.[clientId];

          if (pricing && !pricing.is_expired) {
            baseData[`Prix B2B ${clientName}`] = pricing.custom_price.toFixed(2);

            // Calculate margin for B2B client
            if (row.purchasePrice) {
              const margin = ((pricing.custom_price - row.purchasePrice) / row.purchasePrice) * 100;
              baseData[`${clientName} Margin %`] = margin.toFixed(2);
            }
          } else {
            baseData[`Prix B2B ${clientName}`] = '';
            baseData[`${clientName} Margin %`] = '';
          }
        });

        return baseData;
      });

      // Convert to CSV string
      const csv = Papa.unparse(csvRows, {
        quotes: true,
        delimiter: ';',
        header: true,
      });

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    },
    []
  );

  return {
    exportToCSV,
  };
};
