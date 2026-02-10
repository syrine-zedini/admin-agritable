import { useCallback } from 'react';
import Papa from 'papaparse';
import type { PricingSpreadsheetRow, B2BClient } from '@/types/pricing-spreadsheet';

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
          'Product Name': row.product_name || '',
          Category: row.category_name || '',

          // Unit System
          'Purchase Unit': row.purchase_unit || '',
          'B2C Ratio': row.b2c_ratio !== null && row.b2c_ratio !== undefined ? row.b2c_ratio.toFixed(2) : '1.00',
          'B2C Selling Unit': row.b2c_selling_unit || '',
          'B2B Ratio': row.b2b_ratio !== null && row.b2b_ratio !== undefined ? row.b2b_ratio.toFixed(2) : '1.00',
          'B2B Selling Unit': row.b2b_selling_unit || '',

          // B2C Pricing
          'Prix Achat': row.purchase_price !== null && row.purchase_price !== undefined ? row.purchase_price.toFixed(2) : '',
          'B2C Multiplier': row.b2c_multiplier !== null && row.b2c_multiplier !== undefined ? row.b2c_multiplier.toFixed(2) : '2.00',
          'Prix de Vente (Calculated)': row.b2c_prix_de_vente_calculated !== null && row.b2c_prix_de_vente_calculated !== undefined ? row.b2c_prix_de_vente_calculated.toFixed(2) : '',
          'Prix sur Site': row.prix_sur_site !== null && row.prix_sur_site !== undefined ? row.prix_sur_site.toFixed(2) : '',
          'Price Override': row.has_price_override ? 'Yes' : 'No',

          // B2B Pricing
          'B2B Multiplier': row.b2b_multiplier !== null && row.b2b_multiplier !== undefined ? row.b2b_multiplier.toFixed(2) : '1.50',
          'B2B Price (Calculated)': row.b2b_price_calculated !== null && row.b2b_price_calculated !== undefined ? row.b2b_price_calculated.toFixed(2) : '',
          'B2B Base Price': row.b2b_base_price !== null && row.b2b_base_price !== undefined ? row.b2b_base_price.toFixed(2) : '',

          // Logistics & Operations
          'Supplier Name': row.supplier_name || '',
          'Deliverer': row.deliverer_name || '',
          'Pickup Date': row.pickup_date ? new Date(row.pickup_date).toLocaleDateString('fr-FR') : '',
          Stock: row.stock !== null && row.stock !== undefined ? row.stock : '',
          Besoin: row.besoin !== null && row.besoin !== undefined ? row.besoin : '',
          Commande: row.commande !== null && row.commande !== undefined ? row.commande : '',

          // Legacy fields (kept for compatibility)
          Unit: row.unit || '',
          'Unit Size': row.unit_size || '',
          'B2C Price': row.b2c_price !== null && row.b2c_price !== undefined ? row.b2c_price.toFixed(2) : '',
        };

        // Calculate margins
        if (row.b2c_price && row.purchase_price) {
          const margin = ((row.b2c_price - row.purchase_price) / row.purchase_price) * 100;
          baseData['B2C Margin %'] = margin.toFixed(2);
        } else {
          baseData['B2C Margin %'] = '';
        }

        if (row.b2b_base_price && row.purchase_price) {
          const margin = ((row.b2b_base_price - row.purchase_price) / row.purchase_price) * 100;
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
            if (row.purchase_price) {
              const margin = ((pricing.custom_price - row.purchase_price) / row.purchase_price) * 100;
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
