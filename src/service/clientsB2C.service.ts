import { api } from "./api";

export const createClientB2C = (data: any) =>
  api.post("/auth/signupb2c", data);

export const getClientsB2C = async () => {
  try {
    const response = await api.get("/auth/clients-b2c");
    return response.data?.data || [];
  } catch (error) {
    console.error("Erreur getClientsB2C:", error);
    return [];
  }
};

export const getClientById = async (id: string) => {
  try {
    const response = await api.get(`/auth/${id}`);
    return response.data?.data || null;
  } catch (error) {
    console.error(`Erreur getClientById pour ${id}:`, error);
    throw error;
  }
};

export const updateClient = async (id: string, data: any) => {
  try {
    const response = await api.put(`/auth/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erreur updateClient pour ${id}:`, error);
    throw error;
  }
};

export const deleteClient = async (id: string) => {
  try {
    const response = await api.delete(`/auth/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur deleteClient pour ${id}:`, error);
    throw error;
  }
};