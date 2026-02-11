"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Download, Upload, Plus, Search, ChevronDown, X, Edit2, Trash2, CheckCircle, AlertCircle, Info, Image as ImageIcon } from "lucide-react";

// --- Types ---
interface Product {
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

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// --- Toast Component ---
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 min-w-[300px] p-4 rounded-lg shadow-lg border animate-slideIn ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={20} className="text-green-600 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={20} className="text-red-600 flex-shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-blue-600 flex-shrink-0" />}
          
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Listes pour dropdowns ---
const categories = [
  { id: "1", name: "Acceuil" },
  { id: "0020de19-5607-4ff5-b7a9-6e46088cfb97", name: "Popin" },
  { id: "8d9cf69a-4765-48de-acf3-0ab153460f61", name: "Fruit Bio /Non traité" },
  { id: "9ec4a7a0-3d21-4e53-a943-a0f85ab1e482", name: "Epicerie by Agritable" },
  { id: "1fa0710b-2293-4ef0-8166-82347375e64e", name: "Fruits" },
  { id: "76695e38-8092-4f6a-a60e-4cdd057d0066", name: "Légumes Bio/Non traité" },
  { id: "07fb6e79-2142-45ff-b27b-f34d7eaaeb98", name: "Herbes Bio/Non traité" },
  { id: "a794a910-5bd1-4b2b-92bd-3653f935de7b", name: "Fruits Raisonnés" },
  { id: "d837659f-8df6-4090-a950-96f1c87536fa", name: "Légumes Raisonnés" },
  { id: "3da7ec4d-e0ca-40d3-8a21-b60b95a3e5c0", name: "Légumes" },
  { id: "28a30a3a-20da-442e-a495-33e84c6eb3f6", name: "Herbe Raisonnés" },
  { id: "25566059-1d61-4f5f-a71d-7176f38d611e", name: "Herbes" },
  { id: "69f037ed-2a61-46bf-9d74-f9638c537d1a", name: "Epicerie" }
];

const statuses = ["Active", "Inactive"];

// --- Modal Composant (Add/Edit) ---
function ProductModal({ 
  product, 
  onClose, 
  onSuccess,
  showToast
}: { 
  product?: Product; 
  onClose: () => void; 
  onSuccess: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nameFr: product?.nameFr || "",
    nameAr: product?.nameAr || "",
    nameTn: product?.nameTn || "",
    categoryId: product?.categoryId || "",
    stockQuantity: product?.stockQuantity || 0,
    lowStockAlert: product?.lowStockAlert || 10,
    minOrderQty: product?.minOrderQty || 1,
    maxOrderQty: product?.maxOrderQty || 0,
    description: product?.description || "",
    isBio: product?.isBio || false,
    isNew: product?.isNew || false,
    status: product?.status ?? true,
  });

  // Gestion du drag & drop
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const highlight = () => {
      dropArea.classList.add('border-green-500', 'bg-green-50');
    };

    const unhighlight = () => {
      dropArea.classList.remove('border-green-500', 'bg-green-50');
    };

    const handleDrop = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (dt && dt.files) {
        handleFileSelect(dt.files);
      }
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight);
    });

    dropArea.addEventListener('drop', handleDrop as EventListener);

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.removeEventListener(eventName, preventDefaults);
      });
    };
  }, []);

  const handleFileSelect = (files: FileList) => {
    const newImages: File[] = [];
    const maxFiles = 5 - (imageUrls.length + images.length);
    
    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB max
        newImages.push(file);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      showToast('info', `${newImages.length} image(s) ajoutée(s)`);
    } else {
      showToast('error', 'Fichier(s) invalide(s) ou limite de 5 images atteinte');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const removeImage = (index: number, isUrl: boolean) => {
    if (isUrl) {
      setImageUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
    showToast('info', 'Image supprimée');
  };

  const uploadImages = async (): Promise<string[]> => {
  console.log('Pas d’API upload, on retourne juste les URLs existantes');
  
  // On simule juste l'upload en utilisant les images locales déjà sélectionnées
  const uploadedUrls: string[] = [...imageUrls];

  images.forEach((image) => {
    // On utilise URL.createObjectURL pour avoir un aperçu immédiat
    uploadedUrls.push(URL.createObjectURL(image));
  });

  return uploadedUrls;
};


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images first
      let finalImageUrls = imageUrls;
      if (images.length > 0) {
        finalImageUrls = await uploadImages();
      }

      const apiData = {
        ...formData,
        stockQuantity: Number(formData.stockQuantity),
        lowStockAlert: Number(formData.lowStockAlert),
        minOrderQty: Number(formData.minOrderQty),
        maxOrderQty: Number(formData.maxOrderQty) || null,
        images: finalImageUrls
      };

      const url = product 
        ? `${process.env.NEXT_PUBLIC_API_URL}products/${product.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}products`;
      
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de ${product ? 'la modification' : 'la création'} du produit`);
      }

      const result = await response.json();
      showToast('success', product 
        ? `Produit "${formData.nameFr}" modifié avec succès!` 
        : `Produit "${formData.nameFr}" créé avec succès!`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast('error', error.message || 'Une erreur est survenue');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalImages = imageUrls.length + images.length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden font-sans relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-sm text-gray-500">
            {product ? 'Modify product details' : 'Add a new product to your inventory'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Ligne 1: Noms du produit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Product Name (French) *</label>
                <input 
                  type="text" 
                  name="nameFr"
                  value={formData.nameFr}
                  onChange={handleInputChange}
                  placeholder="e.g., Tomates Bio" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Product Name (Arabic)</label>
                <input 
                  type="text" 
                  name="nameAr"
                  value={formData.nameAr}
                  onChange={handleInputChange}
                  dir="rtl" 
                  placeholder="طماطم عضوية" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition text-right" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Product Name (Tunisian)</label>
                <input 
                  type="text" 
                  name="nameTn"
                  value={formData.nameTn}
                  onChange={handleInputChange}
                  placeholder="e.g., Matisha bio" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition" 
                />
              </div>
            </div>

            {/* Ligne 2: SKU, Category & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Category *</label>
                <select 
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <select 
                  name="status"
                  value={formData.status.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value === 'true' }))}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Ligne 3: Stock Management */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Stock Quantity *</label>
                <input 
                  type="number" 
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Low Stock Alert</label>
                <input 
                  type="number" 
                  name="lowStockAlert"
                  value={formData.lowStockAlert}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Min Order Qty</label>
                <input 
                  type="number" 
                  name="minOrderQty"
                  value={formData.minOrderQty}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Max Order Qty</label>
                <input 
                  type="number" 
                  name="maxOrderQty"
                  value={formData.maxOrderQty}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Optional" 
                  className="w-full p-2 border border-gray-300 rounded-md" 
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Description (French)</label>
              <textarea 
                rows={3} 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Product description..." 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition resize-none" 
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Product Images (up to 5)</label>
              
              {/* Drop Area */}
              <div
                ref={dropAreaRef}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors hover:border-green-400 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept="image/png, image/jpeg, image/jpg"
                  multiple
                  className="hidden"
                />
                <ImageIcon className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-600 font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG up to 5MB ({totalImages}/5 uploaded)
                </p>
              </div>

              {/* Image Previews */}
              {totalImages > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Images to upload:</p>
                  <div className="flex flex-wrap gap-3">
                    {/* Existing image URLs */}
                    {imageUrls.map((url, index) => (
                      <div key={`url-${index}`} className="relative group">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, true)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    
                    {/* New images */}
                    {images.map((image, index) => (
                      <div key={`file-${index}`} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`New image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-white font-medium">
                            {Math.round(image.size / 1024)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index, false)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="isBio"
                  checked={formData.isBio}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" 
                />
                <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition">Bio Product</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="isNew"
                  checked={formData.isNew}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" 
                />
                <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition">New In Stock</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="featured"
                  checked={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" 
                />
                <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition">Featured Product</span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50/30">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 border border-gray-300 rounded-md font-semibold text-gray-600 hover:bg-white transition hover:border-gray-400"
              disabled={loading || uploadingImages}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-[#22c55e] text-white rounded-md font-semibold hover:bg-[#16a34a] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || uploadingImages}
            >
              {uploadingImages && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? (product ? 'Updating...' : 'Creating...') : (product ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Composants réutilisables ---
function StatCard({ title, value, sub, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function FilterDropdown({ label, options, onSelect }: { label: string; options?: string[]; onSelect: (option: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex items-center justify-between gap-8 border rounded-md px-3 py-2 text-sm text-gray-600 bg-white cursor-pointer min-w-[140px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label} <ChevronDown size={14} />
      </div>
      
      {isOpen && options && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div 
              key={option}
              className="p-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ 
  product, 
  onEdit, 
  onDelete 
}: { 
  product: Product; 
  onEdit: (product: Product) => void; 
  onDelete: (id: string) => void;
}) {
  const categoryName = categories.find(cat => cat.id === product.categoryId)?.name || 'Unknown';
  const stockStatus = product.stockQuantity === 0 
    ? { label: 'Out of Stock', color: 'bg-red-500' }
    : product.stockQuantity <= product.lowStockAlert
    ? { label: 'Low Stock', color: 'bg-orange-500' }
    : { label: 'In Stock', color: 'bg-green-500' };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-4 text-gray-500">{product.id.substring(0, 8)}...</td>
      <td className="p-4 font-medium flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.nameFr}
              className="w-full h-full object-cover"
            />
          ) : (
            "IMG"
          )}
        </div>
        {product.nameFr}
      </td>
      <td className="p-4">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">{categoryName}</span>
      </td>
      <td className="p-4">-</td>
      <td className="p-4">-</td>
      <td className="p-4 font-medium">{product.stockQuantity}</td>
      <td className="p-4 text-gray-400">N/A</td>
      <td className="p-4">
        <span className={`px-2 py-1 ${stockStatus.color} text-white text-[10px] rounded-md font-bold uppercase`}>
          {stockStatus.label}
        </span>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(product)}
            className="text-blue-600 hover:text-blue-800 transition"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="text-red-600 hover:text-red-800 transition"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- Page principale ---
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedStatus, setSelectedStatus] = useState<string>("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast functions
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
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

  // Fetch tous les produits
  const fetchProducts = async () => {
    setLoading(true);
    try {
      showToast('info', 'Chargement des produits...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.data || []);
      setFilteredProducts(data.data || []);
      showToast('success', `${data.data?.length || 0} produits chargés avec succès`);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('error', 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits au montage
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtrer les produits
  useEffect(() => {
    let filtered = [...products];

    // Filtre par catégorie
    if (selectedCategory !== "All Categories") {
      const categoryId = categories.find(cat => cat.name === selectedCategory)?.id;
      if (categoryId) {
        filtered = filtered.filter(p => p.categoryId === categoryId);
      }
    }

    // Filtre par statut
    if (selectedStatus !== "All Status") {
      const isActive = selectedStatus === "Active";
      filtered = filtered.filter(p => p.status === isActive);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.nameFr.toLowerCase().includes(query) ||
        p.nameAr?.toLowerCase().includes(query) ||
        p.nameTn?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedStatus, searchQuery]);

  // Supprimer un produit
  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${product?.nameFr}" ?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      showToast('success', `Produit "${product?.nameFr}" supprimé avec succès`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('error', 'Erreur lors de la suppression du produit');
    }
  };

  // Ouvrir modal pour édition
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  // Ouvrir modal pour création
  const handleAdd = () => {
    setEditingProduct(undefined);
    setModalOpen(true);
  };

  // Fermer modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(undefined);
  };

  // Calcul des stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status).length;
  const outOfStock = products.filter(p => p.stockQuantity === 0).length;
  const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert).length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-sm text-gray-500">Gérer votre catalogue de produits</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md bg-white hover:bg-gray-50">
            <Upload size={18} /> Importer
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Configuration Box */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4 font-semibold">
          <Settings size={20} className="text-gray-600" />
          <span>Configuration "Nouveau en Stock"</span>
        </div>
        
        <div className="flex justify-between items-start">
          <div className="space-y-4 w-2/3">
            <div>
              <p className="font-medium text-sm">Activer la fonctionnalité</p>
              <p className="text-xs text-gray-500">Affiche le badge "Nouveau" sur les produits récemment ajoutés/mis à jour</p>
            </div>
            <div>
              <p className="font-medium text-sm">Heures avant expiration</p>
              <p className="text-xs text-gray-500 mb-2">Nombre d'heures après la mise à jour avant que le badge "Nouveau" disparaisse</p>
              <div className="flex gap-2">
                <input type="number" defaultValue={100} className="border rounded-md px-3 py-1 w-24 outline-none focus:ring-1 ring-green-500" />
                <button className="bg-green-600 text-white px-4 py-1 rounded-md text-sm">Enregistrer</button>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">Mise à jour manuelle</p>
              <button className="border border-gray-300 px-4 py-1 rounded-md text-sm hover:bg-gray-50">Mettre à jour maintenant</button>
            </div>
          </div>
          <div className="relative inline-block w-12 h-6 bg-green-500 rounded-full cursor-pointer">
             <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Products" value={totalProducts} sub="All products in catalog" color="text-black" />
        <StatCard 
          title="Active Products" 
          value={activeProducts} 
          sub={`${totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0}% of total`} 
          color="text-blue-600" 
        />
        <StatCard title="Out of Stock" value={outOfStock} sub="Needs restocking" color="text-red-600" />
        <StatCard title="Low Stock Alerts" value={lowStock} sub="Below threshold" color="text-orange-500" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 flex justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              placeholder="Search products..." 
              className="pl-10 pr-4 py-2 border rounded-md w-full text-sm outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
             <FilterDropdown 
               label={selectedCategory} 
               options={["All Categories", ...categories.map(cat => cat.name)]} 
               onSelect={setSelectedCategory}
             />
             <FilterDropdown 
               label={selectedStatus} 
               options={["All Status", ...statuses]} 
               onSelect={setSelectedStatus}
             />
             <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm">
                <Download size={16} /> Export
             </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-4 font-medium">Product ID</th>
              <th className="p-4 font-medium">Product</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">B2C Price</th>
              <th className="p-4 font-medium">B2B Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium">Origin</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  Chargement des produits...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  Aucun produit trouvé
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <ProductRow 
                  key={product.id} 
                  product={product} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={handleCloseModal} 
          onSuccess={fetchProducts}
          showToast={showToast}
        />
      )}

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
      `}</style>
    </div>
  );
}