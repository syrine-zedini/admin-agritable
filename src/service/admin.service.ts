import { AdminUser, CreateAdminInput } from "@/types/admin.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6002/api/";

const getToken = (): string => {
  return sessionStorage.getItem("adminToken") || "";
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// -------------------- GET ALL ADMINS --------------------
export const getAdmins = async (): Promise<AdminUser[]> => {
  const res = await fetch(`${API_URL}admins`, {
    headers: authHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Erreur lors du chargement des admins");

  return data.data;
};

// -------------------- CREATE ADMIN --------------------
export const createAdmin = async (input: CreateAdminInput): Promise<AdminUser> => {
  const res = await fetch(`${API_URL}admins`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Erreur lors de la création");

  return data.data;
};

// -------------------- SUSPEND / REACTIVATE ADMIN --------------------
export const toggleAdminStatus = async (
  id: string,
  status: "Active" | "Suspended"
): Promise<void> => {
  const res = await fetch(`${API_URL}admins/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Erreur lors de la mise à jour du statut");
};

// -------------------- DELETE ADMIN --------------------
export const deleteAdmin = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}admins/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Erreur lors de la suppression");
};