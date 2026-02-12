import { Category } from "@/types/category";

const API = process.env.NEXT_PUBLIC_API_URL;

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${API}categories`);
  const json = await res.json();
  return json.data || [];
};

export const createCategory = async (name: string, parentId?: string | null) => {
  const res = await fetch(`${API}categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parentId: parentId || null }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
};

export const updateCategory = async (id: string, name: string) => {
  const res = await fetch(`${API}categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
};

export const deleteCategory = async (id: string) => {
  const res = await fetch(`${API}categories/${id}?deleteAllProduct=true`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
};
