import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface InvoiceData {
  order_id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  // Client info
  client_name: string;
  client_company: string;
  client_tax_id?: string;
  client_address: string;
  client_phone: string;
  client_email?: string;
  // Order details
  items: InvoiceItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  // Payment info
  payment_method: string;
  payment_status: string;
  paid_at?: string;
  // Additional info
  po_number?: string;
  notes?: string;
}

export interface InvoiceItem {
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const useInvoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate invoice number
   */
  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    try {
      // Get the last invoice number
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('invoice_number')
        .not('invoice_number', 'is', null)
        .order('invoice_generated_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      let nextNumber = 1;
      if (data && data.length > 0 && data[0].invoice_number) {
        // Extract number from format INV-YYYY-NNNNNN
        const match = data[0].invoice_number.match(/INV-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const year = new Date().getFullYear();
      const paddedNumber = nextNumber.toString().padStart(6, '0');
      return `INV-${year}-${paddedNumber}`;
    } catch (err: any) {
      console.error('Error generating invoice number:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch invoice data for an order
   */
  const fetchInvoiceData = useCallback(async (orderId: string): Promise<InvoiceData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch order with all related data
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            first_name,
            last_name,
            company_name,
            tax_id,
            phone,
            email
          ),
          addresses!orders_delivery_address_id_fkey (
            street_address,
            city,
            postal_code
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Generate invoice number if not exists
      let invoiceNumber = order.invoice_number;
      if (!invoiceNumber) {
        invoiceNumber = await generateInvoiceNumber();

        // Update order with invoice number
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            invoice_number: invoiceNumber,
            invoice_generated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateError) throw updateError;
      }

      // Transform data
      const clientName = order.users?.company_name ||
        `${order.users?.first_name || ''} ${order.users?.last_name || ''}`.trim() ||
        'N/A';

      const clientAddress = order.addresses
        ? `${order.addresses.street_address}, ${order.addresses.city} ${order.addresses.postal_code || ''}`
        : 'N/A';

      const invoiceData: InvoiceData = {
        order_id: order.id,
        order_number: order.order_number,
        invoice_number: invoiceNumber,
        invoice_date: order.invoice_generated_at || new Date().toISOString(),
        client_name: clientName,
        client_company: order.users?.company_name || clientName,
        client_tax_id: order.users?.tax_id,
        client_address: clientAddress,
        client_phone: order.users?.phone || 'N/A',
        client_email: order.users?.email,
        items: (items || []).map((item: any) => ({
          product_name: item.product_name_fr,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee || 0,
        discount: order.discount || 0,
        tax_rate: order.tax_rate || 0,
        tax_amount: order.tax_amount || 0,
        total: order.total,
        payment_method: order.payment_method,
        payment_status: order.payment_status || 'pending',
        paid_at: order.paid_at,
        po_number: order.po_number,
        notes: order.notes,
      };

      return invoiceData;
    } catch (err: any) {
      console.error('Error fetching invoice data:', err);
      setError(err.message || 'Failed to fetch invoice data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [generateInvoiceNumber]);

  /**
   * Generate invoice HTML for printing/PDF
   */
  const generateInvoiceHTML = useCallback((invoiceData: InvoiceData): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceData.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #22c55e; padding-bottom: 20px; }
    .company-info h1 { color: #22c55e; font-size: 32px; margin-bottom: 5px; }
    .company-info p { color: #666; font-size: 14px; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { color: #333; font-size: 24px; margin-bottom: 10px; }
    .invoice-info p { font-size: 14px; color: #666; margin-bottom: 5px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { width: 48%; }
    .party h3 { font-size: 16px; color: #22c55e; margin-bottom: 10px; }
    .party p { font-size: 14px; line-height: 1.6; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead { background-color: #22c55e; color: white; }
    th { padding: 12px; text-align: left; font-size: 14px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; margin-top: 8px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .status-paid { background-color: #dcfce7; color: #166534; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>AGRITABLE</h1>
        <p>Fresh Produce Delivery</p>
        <p>Tunis, Tunisia</p>
        <p>contact@agritable.tn</p>
      </div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> ${invoiceData.invoice_number}</p>
        <p><strong>Order #:</strong> ${invoiceData.order_number}</p>
        <p><strong>Date:</strong> ${new Date(invoiceData.invoice_date).toLocaleDateString()}</p>
        ${invoiceData.po_number ? `<p><strong>PO #:</strong> ${invoiceData.po_number}</p>` : ''}
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <h3>Bill To:</h3>
        <p><strong>${invoiceData.client_company}</strong></p>
        ${invoiceData.client_tax_id ? `<p>Tax ID: ${invoiceData.client_tax_id}</p>` : ''}
        <p>${invoiceData.client_address}</p>
        <p>${invoiceData.client_phone}</p>
        ${invoiceData.client_email ? `<p>${invoiceData.client_email}</p>` : ''}
      </div>
      <div class="party">
        <h3>Payment Status:</h3>
        <p>
          <span class="status-badge ${invoiceData.payment_status === 'completed' ? 'status-paid' : 'status-pending'}">
            ${invoiceData.payment_status.toUpperCase()}
          </span>
        </p>
        <p><strong>Method:</strong> ${invoiceData.payment_method}</p>
        ${invoiceData.paid_at ? `<p><strong>Paid:</strong> ${new Date(invoiceData.paid_at).toLocaleDateString()}</p>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceData.items.map(item => `
          <tr>
            <td>${item.product_name}</td>
            <td>${item.product_sku}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${item.unit_price.toFixed(2)} TND</td>
            <td class="text-right">${item.subtotal.toFixed(2)} TND</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${invoiceData.subtotal.toFixed(2)} TND</span>
      </div>
      ${invoiceData.delivery_fee > 0 ? `
        <div class="totals-row">
          <span>Delivery Fee:</span>
          <span>${invoiceData.delivery_fee.toFixed(2)} TND</span>
        </div>
      ` : ''}
      ${invoiceData.discount > 0 ? `
        <div class="totals-row">
          <span>Discount:</span>
          <span>-${invoiceData.discount.toFixed(2)} TND</span>
        </div>
      ` : ''}
      ${invoiceData.tax_amount > 0 ? `
        <div class="totals-row">
          <span>Tax (${invoiceData.tax_rate}%):</span>
          <span>${invoiceData.tax_amount.toFixed(2)} TND</span>
        </div>
      ` : ''}
      <div class="totals-row total">
        <span>TOTAL:</span>
        <span>${invoiceData.total.toFixed(2)} TND</span>
      </div>
    </div>

    ${invoiceData.notes ? `
      <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #22c55e;">
        <strong>Notes:</strong><br>
        ${invoiceData.notes}
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>For inquiries, contact us at contact@agritable.tn</p>
    </div>
  </div>
</body>
</html>
    `;
  }, []);

  /**
   * Print invoice (opens print dialog)
   */
  const printInvoice = useCallback((invoiceData: InvoiceData) => {
    const htmlContent = generateInvoiceHTML(invoiceData);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, [generateInvoiceHTML]);

  /**
   * Download invoice as HTML (client can convert to PDF using browser)
   */
  const downloadInvoice = useCallback((invoiceData: InvoiceData) => {
    const htmlContent = generateInvoiceHTML(invoiceData);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceData.invoice_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generateInvoiceHTML]);

  return {
    isLoading,
    error,
    fetchInvoiceData,
    generateInvoiceHTML,
    printInvoice,
    downloadInvoice,
  };
};
