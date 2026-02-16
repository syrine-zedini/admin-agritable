import { Client } from "@/types/clientB2B.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getClientsB2B = async (): Promise<Client[]> => {
  const res = await fetch(`${API_URL}auth/clients-b2b`);
  const data = await res.json();
  if (!data.success) throw new Error("Impossible de charger les clients");
  return data.data.map((c: any) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phoneNumber: c.phoneNumber,
    createdAt: new Date(c.createdAt).toLocaleDateString("fr-FR"),
    businessName: c.businessName || `${c.firstName} ${c.lastName}`,
    institutionType: c.institutionType || "Non spécifié",
    address: c.address || "Adresse non renseignée",
    status: "Active",
    orders: 0,
    balance: "0,00 TND"
  }));
};

export const createB2BClient = async (payload: any) => {
  const res = await fetch(`${API_URL}auth/signupb2b`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Impossible de créer le client");
  return result;
};
