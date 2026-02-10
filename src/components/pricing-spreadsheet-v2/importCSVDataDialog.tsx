import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCSVImport } from '@/hooks/useCSVImport';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { CSVImportRow, CSVImportResult } from '@/types/pricing-spreadsheet';

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const ImportCSVDialog = ({
  open,
  onOpenChange,
  onImportComplete,
}: ImportCSVDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVImportResult | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: any[] } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');

  const { parseCSV, importData, isImporting } = useCSVImport();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('preview');

    // Parse the CSV
    const result = await parseCSV(selectedFile);
    setParseResult(result);
  };

  const handleImport = async () => {
    if (!parseResult || !parseResult.rows) return;

    setStep('importing');

    // Import the data
    const result = await importData(parseResult.rows);
    setImportResult(result);
    setStep('complete');

    // Refresh parent data
    if (result.success > 0) {
      onImportComplete();
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setStep('upload');
    onOpenChange(false);
  };

  const validRows = parseResult?.rows.filter((row) => !row.errors || row.errors.length === 0) || [];
  const invalidRows = parseResult?.rows.filter((row) => row.errors && row.errors.length > 0) || [];

  // Extract all validation errors from rows
  const allErrors = parseResult?.rows.flatMap(row => row.errors || []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Pricing Data from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk update product prices, stock, and supplier information
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground">
                Supported columns: SKU, Product Name, Purchase Price, B2C Price, B2B Base Price, Stock, Unit, Unit Size, Supplier Name
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>CSV Format:</strong> Your CSV must include either SKU or Product Name to identify products.
                All other columns are optional and will only update if provided.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && parseResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{file?.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{parseResult.rows.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Valid</p>
                <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{invalidRows.length}</p>
              </div>
            </div>

            {/* Errors */}
            {allErrors && allErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>{allErrors.length} validation errors found:</strong>
                  <ul className="mt-2 space-y-1">
                    {allErrors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="text-sm">
                        Row {error.row}: {error.message} ({error.column})
                      </li>
                    ))}
                    {allErrors.length > 5 && (
                      <li className="text-sm italic">
                        ... and {allErrors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Purchase</TableHead>
                      <TableHead>B2C</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.rows.slice(0, 20).map((row: CSVImportRow) => {
                      const hasErrors = row.errors && row.errors.length > 0;
                      return (
                        <TableRow key={row.row_number} className={hasErrors ? 'bg-red-50' : ''}>
                          <TableCell className="font-mono text-xs">{row.row_number}</TableCell>
                          <TableCell className="font-mono text-xs">{row.sku || '-'}</TableCell>
                          <TableCell className="text-sm">{row.product_name || '-'}</TableCell>
                          <TableCell className="text-sm">
                            {row.purchase_price !== undefined ? `${row.purchase_price.toFixed(2)} TND` : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.b2c_price !== undefined ? `${row.b2c_price.toFixed(2)} TND` : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{row.stock ?? '-'}</TableCell>
                          <TableCell className="text-sm">{row.supplier_name || '-'}</TableCell>
                          <TableCell>
                            {hasErrors ? (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {parseResult.rows.length > 20 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                          ... and {parseResult.rows.length - 20} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg font-medium">Importing data...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && importResult && (
          <div className="space-y-4">
            <div className="text-center py-6">
              {importResult.success > 0 ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Import Successful!</h3>
                  <p className="text-muted-foreground">
                    {importResult.success} products updated successfully
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Import Failed</h3>
                  <p className="text-muted-foreground">
                    No products were updated
                  </p>
                </>
              )}
            </div>

            {importResult?.errors && importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>{importResult.errors.length} errors occurred:</strong>
                  <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {importResult.errors.map((error, idx) => (
                      <li key={idx} className="text-sm">
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
              >
                Import {validRows.length} Products
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
