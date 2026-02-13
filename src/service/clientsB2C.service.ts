import { api } from "./api";

export const createClientB2C = (data:any) =>
  api.post("/auth/signupb2c", data);

export const getClientsB2C = async () => {
  try {
    const response = await api.get("/auth/clients-b2c");
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error("Erreur getClientsB2C:", error);
    return [];
  }
};
