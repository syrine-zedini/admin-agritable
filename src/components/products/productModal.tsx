"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { Product } from "@/types/product";
import { productService } from "@/service/productP.service";

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

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (t: "success" | "error" | "info", m: string) => void;
}

export default function ProductModal({ product, onClose, onSuccess, showToast }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefaults = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    const highlight = () => { dropArea.classList.add('border-green-500', 'bg-green-50'); };
    const unhighlight = () => { dropArea.classList.remove('border-green-500', 'bg-green-50'); };

    const handleDrop = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (dt && dt.files) handleFileSelect(dt.files);
    };

    ['dragenter','dragover','dragleave','drop'].forEach(ev => dropArea.addEventListener(ev, preventDefaults));
    ['dragenter','dragover'].forEach(ev => dropArea.addEventListener(ev, highlight));
    ['dragleave','drop'].forEach(ev => dropArea.addEventListener(ev, unhighlight));
    dropArea.addEventListener('drop', handleDrop as EventListener);

    return () => {
      ['dragenter','dragover','dragleave','drop'].forEach(ev => dropArea.removeEventListener(ev, preventDefaults));
    };
  }, []);

  const handleFileSelect = (files: FileList) => {
    const newImages: File[] = [];
    const maxFiles = 5 - (imageUrls.length + images.length);
    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      if (file.type.startsWith("image/") && file.size <= 5*1024*1024) newImages.push(file);
    }
    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      showToast("info", `${newImages.length} image(s) ajoutée(s)`);
    } else {
      showToast("error", "Fichier(s) invalide(s) ou limite de 5 images atteinte");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFileSelect(e.target.files);
    e.target.value = '';
  };

  const removeImage = (index: number, isUrl: boolean) => {
    if (isUrl) setImageUrls(prev => prev.filter((_, i) => i !== index));
    else setImages(prev => prev.filter((_, i) => i !== index));
    showToast('info','Image supprimée');
  };

  const uploadImages = async (): Promise<string[]> => {
    // Ici tu peux intégrer un vrai upload vers ton serveur si nécessaire (RETOUR à ne pas oublier )
    const uploaded: string[] = [...imageUrls];
    images.forEach(img => uploaded.push(URL.createObjectURL(img)));
    return uploaded;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    else if (type === "number") setFormData(prev => ({ ...prev, [name]: parseFloat(value)||0 }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImages = imageUrls;
      if (images.length > 0) finalImages = await uploadImages();

      const apiData = { ...formData, images: finalImages };

      let result;
      if (product) {
        result = await productService.update(product.id, apiData);
      } else {
        result = await productService.create(apiData);
      }

      console.log("Produit enregistré:", result);
      showToast('success', product ? `"${formData.nameFr}" mis à jour` : `"${formData.nameFr}" créé`);
      onSuccess(); 
      onClose();
    } catch(err:any){
      showToast('error', err.message || 'Erreur inconnue');
    } finally { setLoading(false); }
  };

  const totalImages = imageUrls.length + images.length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden font-sans relative max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
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
            {/* Noms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["nameFr","nameAr","nameTn"].map((key) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {key==="nameFr"?"Product Name (French)":key==="nameAr"?"Product Name (Arabic)":"Product Name (Tunisian)"}
                  </label>
                  <input 
                    type="text" 
                    name={key} 
                    value={formData[key as keyof typeof formData] as string}
                    onChange={handleInputChange}
                    placeholder={key==="nameFr"?"e.g., Tomates Bio":key==="nameAr"?"طماطم عضوية":"e.g., Matisha bio"} 
                    dir={key==="nameAr"?"rtl":"ltr"}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition text-right" 
                  />
                </div>
              ))}
            </div>

            {/* Category & Status */}
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
                  {categories.map(c=>(
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <select 
                  name="status"
                  value={formData.status.toString()}
                  onChange={e=>setFormData(prev=>({...prev,status:e.target.value==='true'}))}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["stockQuantity","lowStockAlert","minOrderQty","maxOrderQty"].map((key)=>(
                <div key={key} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {key==="stockQuantity"?"Stock Quantity":key==="lowStockAlert"?"Low Stock Alert":key==="minOrderQty"?"Min Order Qty":"Max Order Qty"}
                  </label>
                  <input 
                    type="number" 
                    name={key} 
                    value={formData[key as keyof typeof formData] as unknown as string}
                    onChange={handleInputChange}
                    min="0"
                    placeholder={key==="maxOrderQty"?"Optional":undefined}
                    className="w-full p-2 border border-gray-300 rounded-md" 
                  />
                </div>
              ))}
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

            {/* Images */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Product Images (up to 5)</label>
              <div 
                ref={dropAreaRef}
                onClick={()=>fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors hover:border-green-400 cursor-pointer"
              >
                <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleFileInput}/>
                <ImageIcon className="mx-auto text-gray-400 mb-3" size={40}/>
                <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB ({totalImages}/5 uploaded)</p>
              </div>

              {/* Preview */}
              {totalImages>0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {imageUrls.map((url,i)=>(
                    <div key={`url-${i}`} className="relative group">
                      <img src={url} alt={`Product ${i}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200"/>
                      <button type="button" onClick={()=>removeImage(i,true)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                  {images.map((img,i)=>(
                    <div key={`file-${i}`} className="relative group">
                      <img src={URL.createObjectURL(img)} alt={`New ${i}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200"/>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-white font-medium">{Math.round(img.size/1024)} KB</span>
                      </div>
                      <button type="button" onClick={()=>removeImage(i,false)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
              {["isBio","isNew","status"].map((key)=>(
                <label key={key} className="flex items-center space-x-2 cursor-pointer group">
                  <input type="checkbox" name={key} checked={formData[key as keyof typeof formData] as boolean} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"/>
                  <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition">
                    {key==="isBio"?"Bio Product":key==="isNew"?"New In Stock":"Featured Product"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50/30">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md font-semibold text-gray-600 hover:bg-white transition" disabled={loading}>Cancel</button>
            <button type="submit" className="px-6 py-2 bg-[#22c55e] text-white rounded-md font-semibold hover:bg-[#16a34a] transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
              {loading?product?"Updating...":"Creating...":product?"Update Product":"Add Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
