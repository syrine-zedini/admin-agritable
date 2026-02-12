import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../service/category.service";
import { Category } from "@/types/category";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const fetchAll = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addCategory = async (name: string, parentId?: string | null) => {
    await createCategory(name, parentId);
    showToast(`✅ Catégorie "${name}" créée !`);
    fetchAll();
  };

  const editCategory = async (id: string, name: string) => {
    await updateCategory(id, name);
    showToast(`✅ Catégorie modifiée !`);
    fetchAll();
  };

  const removeCategory = async (id: string) => {
    await deleteCategory(id);
    showToast(`✅ Catégorie supprimée !`);
    fetchAll();
  };

  return { categories, toast, addCategory, editCategory, removeCategory };
};
