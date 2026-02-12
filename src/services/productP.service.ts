// services/productService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const productService = {
  async getAll() {
    const res = await fetch(`${API_URL}products`);
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  },

  async create(data: any) {
    const res = await fetch(`${API_URL}products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Create failed");
    return res.json();
  },

  async update(id: string, data: any) {
    const res = await fetch(`${API_URL}products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(`${API_URL}products/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  },
};
