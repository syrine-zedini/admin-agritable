import { api } from "./api";

export const createClientB2C = (data:any) =>
  api.post("/auth/signupb2c", data);
