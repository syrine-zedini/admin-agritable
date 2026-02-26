import { Client } from "@/types/clientB2B.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


//create

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


//get all clients 

export const getClientsB2B = async (): Promise<Client[]> => {
  const res = await fetch(`${API_URL}auth/clients-b2b`);
  const data = await res.json();
  if (!data.success) throw new Error("Impossible de charger les clients");
  return data.data.rows.map((c: any) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phoneNumber: c.phoneNumber,
    createdAt: new Date(c.createdAt).toLocaleDateString("fr-FR"),
    businessName: c.b2b_data?.businessName || `${c.firstName} ${c.lastName}`,
    institutionType: c.b2b_data?.institutionType || "Non spécifié",
    address: c.b2b_data?.addresses?.[0]
      ? [c.b2b_data.addresses[0].address, c.b2b_data.addresses[0].ville].filter(Boolean).join(", ")
      : "Adresse non renseignée",
    status: c.b2b_data?.accountStatus || "Active",
    orders: 0,
    balance: "0,00 TND"
  }));
};


export const getClientB2BById = async (id: string): Promise<Client> => {
  const res = await fetch(`${API_URL}auth/clients-b2b/${id}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error("Impossible de charger le client");
  }

  const c = data.data;

  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phoneNumber: c.phoneNumber,
    createdAt: new Date(c.createdAt).toLocaleDateString("fr-FR"),

    // 🔹 garder b2b_data complet
    b2b_data: c.b2b_data || undefined,

    // Les champs "aplatissants" si tu veux quand même les afficher ailleurs
    businessName: c.b2b_data?.businessName || `${c.firstName} ${c.lastName}`,
    institutionType: c.b2b_data?.institutionType || "Non spécifié",
    address: c.b2b_data?.addresses?.[0]
      ? [c.b2b_data.addresses[0].address, c.b2b_data.addresses[0].ville]
          .filter(Boolean)
          .join(", ")
      : "Adresse non renseignée",
    status: c.b2b_data?.accountStatus || "Active",
    orders: 0,
    balance: "0,00 TND",
    taxId: c.b2b_data?.taxId || "Non renseigné"

  };
};

//update 

export const updateB2BClient = async (id: string, payload: any) => {
  const res = await fetch(`${API_URL}auth/updateB2B/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Impossible de mettre à jour le client B2B");
  return result;
};
