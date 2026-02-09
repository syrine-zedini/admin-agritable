import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Package, PackageCheck, Filter, Plus, 
  Upload, Download, RefreshCw, Maximize, Search,
  ChevronLeft, ChevronRight, Save, X,
  CheckCircle, AlertCircle, Info, TrendingUp,
  BarChart3, DollarSign, Percent, Layers,
  Grid, Eye, EyeOff, Calendar, Hash,
  Edit2, Check, ShoppingBag, Users
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface SellingUnit {
  quantity: number;
  name: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Product {
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

// Props pour StatCard
interface StatCardProps {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
  trend?: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// Options pour les unités de mesure
const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'mg', label: 'mg' },
  { value: 'L', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'piece', label: 'Piece' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'bag', label: 'Bag' },
  { value: 'carton', label: 'Carton' },
  { value: 'unit', label: 'Unit' },
];

// --- Toast Component ---
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 min-w-[320px] p-4 rounded-xl shadow-lg border-l-4 animate-slideIn backdrop-blur-sm ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-emerald-500 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-rose-500 text-rose-800'
              : toast.type === 'warning'
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-amber-500 text-amber-800'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-l-blue-500 text-blue-800'
          }`}
        >
          {toast.type === 'success' && (
            <div className="p-1.5 rounded-full bg-emerald-100">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="p-1.5 rounded-full bg-rose-100">
              <AlertCircle size={18} className="text-rose-600" />
            </div>
          )}
          {toast.type === 'warning' && (
            <div className="p-1.5 rounded-full bg-amber-100">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="p-1.5 rounded-full bg-blue-100">
              <Info size={18} className="text-blue-600" />
            </div>
          )}
          
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

const PricingManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    withSuppliers: 0,
    withB2BPricing: 0,
    avgB2CMargin: '0%',
    avgB2BMargin: '0%'
  });
  const [editingCell, setEditingCell] = useState<{ productId: string; field: string; type?: string } | null>(null);
  const [tempValue, setTempValue] = useState<any>('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showB2BColumns, setShowB2BColumns] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toast functions
  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Charger les données
  useEffect(() => {
    fetchData();
  }, []);

  // Calculer les statistiques lorsque les produits changent
  useEffect(() => {
    if (products.length > 0) {
      calculateStats();
    }
  }, [products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      showToast('info', 'Chargement des données...');
      
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}products`),
        fetch(`${API_BASE_URL}categories`)
      ]);

      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();
      
      setProducts(Array.isArray(productsData.data) ? productsData.data : []);
      setCategories(Array.isArray(categoriesData.data) ? categoriesData.data : []);
      
      showToast('success', `${productsData.data?.length || 0} produits chargés avec succès`);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Échec du chargement des données. Veuillez réessayer.');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status).length;
    
    const withB2BPricing = products.filter(p => p.b2bMultiplier > 1).length;
    
    const b2cMargins = products.filter(p => p.b2cPurchasePrice > 0).map(p => 
      ((p.b2cSitePrice - p.b2cPurchasePrice) / p.b2cPurchasePrice) * 100
    );
    const avgB2CMargin = b2cMargins.length > 0 
      ? (b2cMargins.reduce((a, b) => a + b, 0) / b2cMargins.length).toFixed(1)
      : '0';
    
    const b2bMargins = products.filter(p => p.b2bSitePrice > 0 && p.b2cPurchasePrice > 0).map(p => 
      ((p.b2bSitePrice - p.b2cPurchasePrice) / p.b2cPurchasePrice) * 100
    );
    const avgB2BMargin = b2bMargins.length > 0 
      ? (b2bMargins.reduce((a, b) => a + b, 0) / b2bMargins.length).toFixed(1)
      : '0';

    setStats({
      totalProducts,
      activeProducts,
      withSuppliers: 3,
      withB2BPricing,
      avgB2CMargin: `${avgB2CMargin}%`,
      avgB2BMargin: `${avgB2BMargin}%`
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      product.categoryId === selectedCategory;
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && product.status) ||
      (selectedStatus === 'inactive' && !product.status);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  const startEditing = (productId: string, field: string, value: any, type?: string) => {
    setEditingCell({ productId, field, type });
    setTempValue(value);
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      setIsSaving(true);
      const product = products.find(p => p.id === editingCell.productId);
      if (!product) return;

      let updateData: any = {};

      // Gérer les différents types de champs
      if (editingCell.type === 'sellingUnit') {
        // Pour B2C Selling Unit ou B2B Selling Unit
        if (editingCell.field === 'b2cSellingUnit' || editingCell.field === 'b2bSellingUnit') {
          const [quantity, name] = (tempValue ?? '').split('|');

          updateData[editingCell.field] = {
            quantity: parseFloat(quantity),
            name: name
          };
        }
      } else if (editingCell.type === 'purchaseUnit') {
        // Pour Purchase Unit (simple string)
        updateData.purchaseUnit = tempValue;
      } else {
        // Pour les champs normaux
        updateData[editingCell.field] = editingCell.field.includes('Price') || editingCell.field.includes('Multiplier')
          ? parseFloat(tempValue)
          : tempValue;
      }

      // Recalculer les prix si nécessaire
      if (editingCell.field === 'b2cPurchasePrice' || editingCell.field === 'b2cMultiplier') {
        const b2cPurchasePrice = editingCell.field === 'b2cPurchasePrice' 
          ? parseFloat(tempValue) 
          : product.b2cPurchasePrice;
        const b2cMultiplier = editingCell.field === 'b2cMultiplier' 
          ? parseFloat(tempValue) 
          : product.b2cMultiplier;
        
        updateData.b2cSellingPrice = b2cPurchasePrice * b2cMultiplier;
        updateData.b2cSitePrice = b2cPurchasePrice * b2cMultiplier;
        updateData.isPriceOverB2c = true;
        
        if (product.b2bMultiplier) {
          updateData.b2bSitePrice = (b2cPurchasePrice * b2cMultiplier) * product.b2bMultiplier;
          updateData.isPriceOverB2b = true;
        }
      }

      if (editingCell.field === 'b2bMultiplier' || editingCell.field === 'b2bBasePrice') {
        const b2bMultiplier = editingCell.field === 'b2bMultiplier' 
          ? parseFloat(tempValue) 
          : product.b2bMultiplier;
        const b2bBasePrice = editingCell.field === 'b2bBasePrice'
          ? parseFloat(tempValue)
          : product.b2bBasePrice;
        
        updateData.b2bSitePrice = b2bBasePrice * b2bMultiplier;
        updateData.b2bBasePriceCalculated = b2bBasePrice;
        updateData.isPriceOverB2b = true;
      }

      const response = await fetch(`${API_BASE_URL}products/${editingCell.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du produit');
      }

      const result = await response.json();
      const updatedProduct = result.data || result;

      setProducts(prev => prev.map(p => 
        p.id === editingCell.productId ? updatedProduct : p
      ));

      showToast('success', `Produit "${product.nameFr}" mis à jour avec succès!`);
      setEditingCell(null);
      setTempValue('');
    } catch (error: any) {
      console.error('Error updating product:', error);
      showToast('error', error.message || 'Échec de la mise à jour du produit. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const updateCategory = async (productId: string, categoryId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const response = await fetch(`${API_BASE_URL}products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de la catégorie');
      }

      const result = await response.json();
      const updatedProduct = result.data || result;
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? updatedProduct : p
      ));
      
      showToast('success', `Catégorie du produit "${product.nameFr}" mise à jour avec succès!`);
    } catch (error: any) {
      console.error('Error updating category:', error);
      showToast('error', error.message || 'Échec de la mise à jour de la catégorie. Veuillez réessayer.');
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      showToast('info', 'Sauvegarde en cours...');
      
      await fetchData();
      showToast('success', 'Toutes les modifications ont été sauvegardées avec succès!');
    } catch (error: any) {
      console.error('Error saving all changes:', error);
      showToast('error', error.message || 'Échec de la sauvegarde des modifications. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = filteredProducts.map(product => ({
        SKU: product.sku,
        'Product Name': product.nameFr,
        Category: categories.find(c => c.id === product.categoryId)?.name || '',
        'B2C Purchase Price': product.b2cPurchasePrice,
        'B2C Multiplier': product.b2cMultiplier,
        'B2C Site Price': product.b2cSitePrice,
        'B2B Base Price': product.b2bBasePrice,
        'B2B Base Price Calculated': product.b2bBasePriceCalculated,
        'B2B Multiplier': product.b2bMultiplier,
        'B2B Site Price': product.b2bSitePrice,
        Status: product.status ? 'Active' : 'Inactive'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csv = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_pricing.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast('success', 'Export CSV terminé avec succès!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('error', 'Échec de l\'export CSV. Veuillez réessayer.');
    }
  };

  // Composant EditableCell amélioré
  const EditableCell = ({ 
    value, 
    field, 
    productId, 
    type = 'text',
    options,
    unitType = 'simple'
  }: {
    value: any;
    field: string;
    productId: string;
    type?: 'text' | 'number' | 'select' | 'readonly' | 'sellingUnit' | 'purchaseUnit';
    options?: Array<{ value: string; label: string }>;
    unitType?: 'simple' | 'quantityName';
  }) => {
    const isEditing = editingCell?.productId === productId && editingCell?.field === field;

    let displayTempValue = tempValue;

    if (isEditing && type === 'sellingUnit' && typeof tempValue === 'object') {
      displayTempValue = `${tempValue.quantity || ''}|${tempValue.name || ''}`;
    }

    if (isEditing) {
      if (type === 'sellingUnit') {
        return (
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-blue-200 shadow-sm">
            <input
              type="number"
              value={displayTempValue.split('|')[0] || ''}
              onChange={(e) => {
                const parts = displayTempValue.split('|');
                const newValue = `${e.target.value}|${parts[1] || ''}`;
                setTempValue(newValue);
              }}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={displayTempValue.split('|')[1] || ''}
              onChange={(e) => {
                const parts = displayTempValue.split('|');
                const newValue = `${parts[0] || ''}|${e.target.value}`;
                setTempValue(newValue);
              }}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {UNIT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={saveEdit}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <Check size={16} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      } else if (type === 'purchaseUnit') {
        return (
          <div className="flex items-center gap-1.5">
            <select
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            >
              {UNIT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={saveEdit}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <Check size={16} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      } else if (type === 'select' && options) {
        return (
          <div className="flex items-center gap-1.5">
            <select
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={saveEdit}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <Check size={16} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      } else if (type === 'readonly') {
        return <span className="px-2 py-1.5 text-gray-600">{value}</span>;
      } else {
        return (
          <div className="flex items-center gap-1.5">
            <input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={saveEdit}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <Check size={16} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      }
    }

    // Affichage en mode lecture seule
    let displayValue;
    
    if (type === 'sellingUnit' && value && typeof value === 'object') {
      displayValue = `${value.quantity} ${value.name}`;
    } else if (type === 'purchaseUnit') {
      displayValue = value || 'Non défini';
    } else if (type === 'number' && typeof value === 'number') {
      displayValue = value.toFixed(2);
    } else {
      displayValue = value;
    }

    const isEditable = type !== 'readonly';

    return (
      <div
        onClick={() => isEditable && startEditing(productId, field, value, type)}
        className={`px-2 py-1.5 rounded-lg transition-all duration-200 ${
          isEditable 
            ? 'cursor-pointer hover:bg-blue-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50' 
            : 'text-gray-700'
        }`}
        title={isEditable ? "Cliquer pour éditer" : ""}
      >
        <div className="flex items-center justify-between">
          <span className="truncate">{displayValue}</span>
          {isEditable && (
            <Edit2 size={12} className="text-gray-400 ml-1 flex-shrink-0" />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Chargement des données...</p>
          <p className="text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans text-gray-700">
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <DollarSign size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Prix</h1>
              <p className="text-gray-500 text-sm">Gérez les prix, les unités et les marges en temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'compact' : 'grid')}
              className="p-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              title={viewMode === 'grid' ? 'Mode compact' : 'Mode grille'}
            >
              {viewMode === 'grid' ? <Grid size={18} /> : <Layers size={18} />}
            </button>
            <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <StatCard 
          label="Total Produits" 
          value={stats.totalProducts.toString()} 
          icon={<Package size={18} />}
        />
        <StatCard 
          label="Actifs" 
          value={stats.activeProducts.toString()} 
          color="text-emerald-600"
          icon={<PackageCheck size={18} />}
          trend="+12%"
        />
        <StatCard 
          label="Fournisseurs" 
          value={stats.withSuppliers.toString()} 
          icon={<Users size={18} />}
        />
        <StatCard 
          label="Prix B2B" 
          value={stats.withB2BPricing.toString()} 
          color="text-blue-600"
          icon={<ShoppingBag size={18} />}
          trend="+8%"
        />
        <StatCard 
          label="Marge B2C Moy" 
          value={stats.avgB2CMargin} 
          color="text-violet-600"
          icon={<Percent size={18} />}
        />
        <StatCard 
          label="Marge B2B Moy" 
          value={stats.avgB2BMargin} 
          color="text-purple-600"
          icon={<BarChart3 size={18} />}
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setSelectedStatus('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                selectedStatus === 'all' 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <AlertTriangle size={16} /> 
              <span>Tous ({products.length})</span>
            </button>
            <button 
              onClick={() => setSelectedStatus('active')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                selectedStatus === 'active' 
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <PackageCheck size={16} /> 
              <span>Actifs ({stats.activeProducts})</span>
            </button>
            <button 
              onClick={() => setSelectedStatus('inactive')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                selectedStatus === 'inactive' 
                  ? 'bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 text-rose-700 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <Package size={16} /> 
              <span>Inactifs ({products.length - stats.activeProducts})</span>
            </button>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <button 
              onClick={() => setShowB2BColumns(!showB2BColumns)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                showB2BColumns 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-700 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              {showB2BColumns ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>Colonnes B2B</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Rechercher un produit..." 
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Hash size={18} className="text-blue-500" />
            Tous les Produits
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              {filteredProducts.length}
            </span>
          </h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              title="Exporter en CSV"
            >
              <Download size={16} />
              <span className="text-sm font-medium">Exporter</span>
            </button>
            <button 
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              title="Actualiser les données"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    container.requestFullscreen();
                  }
                }
              }}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              title="Plein écran"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>

        {/* Scroll Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            Naviguez horizontalement pour voir toutes les colonnes
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={scrollLeft}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={scrollRight}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin"
          >
            {/* Table 1: Product Info */}
            <div className="min-w-[720px] bg-white border border-gray-200 rounded-2xl shadow-sm flex-shrink-0 overflow-hidden">
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 py-4 px-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <Package size={18} className="text-sky-600" />
                  Informations Produit
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left">Produit</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left">SKU</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left">Catégorie</th>
                      <th className="p-4 border-b border-gray-200 font-semibold text-gray-700 text-left">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                        <td className="p-4 border-r border-gray-100">
                          <EditableCell
                            value={product.nameFr}
                            field="nameFr"
                            productId={product.id}
                            type="text"
                          />
                        </td>
                        <td className="p-4 border-r border-gray-100">
                          <EditableCell
                            value={product.sku}
                            field="sku"
                            productId={product.id}
                            type="readonly"
                          />
                        </td>
                        <td className="p-4 border-r border-gray-100">
                          <select 
                            value={product.categoryId}
                            onChange={(e) => updateCategory(product.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-50"
                          >
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            product.status 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {product.status ? (
                              <>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                Actif
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
                                Inactif
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Units */}
            <div className="min-w-[580px] bg-white border border-gray-200 rounded-2xl shadow-sm flex-shrink-0 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 py-4 px-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <Layers size={18} className="text-amber-600" />
                  Unités de Vente
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-amber-50/50">Unité d'Achat</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-amber-50/50">Ratio B2C</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-amber-50/50">Unité Vente B2C</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-amber-50/50">Ratio B2B</th>
                      <th className="p-4 border-b border-gray-200 font-semibold text-gray-700 text-left bg-amber-50/50">Unité Vente B2B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const purchaseUnitValue = 'kg';
                      
                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                          <td className="p-4 border-r border-gray-100 bg-amber-50/20">
                            <EditableCell
                              value={purchaseUnitValue}
                              field="purchaseUnit"
                              productId={product.id}
                              type="purchaseUnit"
                            />
                          </td>
                          <td className="p-4 border-r border-gray-100 bg-amber-50/20">
                            <EditableCell
                              value={product.b2cRatio}
                              field="b2cRatio"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                          <td className="p-4 border-r border-gray-100 bg-amber-50/20">
                            <EditableCell
                              value={product.b2cSellingUnit}
                              field="b2cSellingUnit"
                              productId={product.id}
                              type="sellingUnit"
                            />
                          </td>
                          <td className="p-4 border-r border-gray-100 bg-amber-50/20">
                            <EditableCell
                              value={product.b2bRatio}
                              field="b2bRatio"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                          <td className="p-4 bg-amber-50/20">
                            <EditableCell
                              value={product.b2bSellingUnit}
                              field="b2bSellingUnit"
                              productId={product.id}
                              type="sellingUnit"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 3: B2C Pricing */}
            <div className="min-w-[640px] bg-white border border-gray-200 rounded-2xl shadow-sm flex-shrink-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4 px-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <ShoppingBag size={18} className="text-blue-600" />
                  Tarification B2C
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-blue-50/50">Prix Achat</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-blue-50/50">Multiplicateur</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-blue-50/50">Prix Calculé</th>
                      <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-blue-50/50">Prix Site</th>
                      <th className="p-4 border-b border-gray-200 font-semibold text-gray-700 text-left bg-blue-50/50">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const margin = product.b2cPurchasePrice > 0 
                        ? ((product.b2cSitePrice - product.b2cPurchasePrice) / product.b2cPurchasePrice) * 100
                        : 0;
                      
                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                          <td className="p-4 border-r border-gray-100">
                            <EditableCell
                              value={product.b2cPurchasePrice}
                              field="b2cPurchasePrice"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                          <td className="p-4 border-r border-gray-100">
                            <EditableCell
                              value={product.b2cMultiplier}
                              field="b2cMultiplier"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                          <td className="p-4 border-r border-gray-100">
                            <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-700 font-medium text-center">
                              {(product.b2cPurchasePrice * product.b2cMultiplier).toFixed(2)}
                            </div>
                          </td>
                          <td className="p-4 border-r border-gray-100">
                            <EditableCell
                              value={product.b2cSitePrice}
                              field="b2cSitePrice"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                          <td className="p-4">
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                              margin >= 0 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              <TrendingUp size={14} className={`mr-1.5 ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                              {margin.toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 4: B2B Pricing */}
            {showB2BColumns && (
              <div className="min-w-[580px] bg-white border border-gray-200 rounded-2xl shadow-sm flex-shrink-0 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 py-4 px-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                    <Users size={18} className="text-emerald-600" />
                    Tarification B2B
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-emerald-50/50">Multiplicateur</th>
                        <th className="p-4 border-b border-r border-gray-200 font-semibold text-gray-700 text-left bg-emerald-50/50">Prix de Base</th>
                        <th className="p-4 border-b border-gray-200 font-semibold text-gray-700 text-left bg-emerald-50/50">Prix Base Calculé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                          <td className="p-4 border-r border-gray-100">
                            <EditableCell
                              value={product.b2bMultiplier}
                              field="b2bMultiplier"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                          <td className="p-4 border-r border-gray-100">
                            <EditableCell
                              value={product.b2bBasePrice}
                              field="b2bBasePrice"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                          <td className="p-4">
                            <EditableCell
                              value={product.b2bBasePriceCalculated || product.b2bBasePrice}
                              field="b2bBasePriceCalculated"
                              productId={product.id}
                              type="number"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Affichage de {filteredProducts.length} sur {products.length} produits
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 font-medium"
            >
              Réinitialiser
            </button>
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Sauvegarder Tout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sous-composant pour les cartes de stats
const StatCard = ({ label, value, color = "text-gray-800", icon, trend }: StatCardProps) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
        {icon}
      </div>
      {trend && (
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
          {trend}
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default PricingManagement;