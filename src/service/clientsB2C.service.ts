import { api } from "./api";


// create client 

export const createClientB2C = (data: any) =>
  api.post("/auth/signupb2c", data);

// get all clients 

export const getClientsB2C = async (page: number = 1, limit: number = 50) => { 
  try {
    const response = await api.get("/auth/clients-b2c", {
      params: { page, limit }
    });

    const clients = response.data?.data?.clients || [];
    const total = response.data?.data?.total || 0;

    return { clients, total }; 
  } catch (error) {
    console.error("Erreur getClientsB2C:", error);
    return { clients: [], total: 0 };
  }
};

// get one client b2c

export const getClientById = async (id: string) => {
  try {
    const response = await api.get(`/auth/clients-b2c/${id}`);
    return response.data?.data || null;
  } catch (error) {
    console.error(`Erreur getClientById pour ${id}:`, error);
    throw error;
  }
};
//update client

export const updateClient = async (id: string, data: any) => {
  try {
    const response = await api.put(`/auth/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erreur updateClient pour ${id}:`, error);
    throw error;
  }
};
// delete client 

export const deleteClient = async (id: string) => {
  try {
    const response = await api.delete(`/auth/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur deleteClient pour ${id}:`, error);
    throw error;
  }
};