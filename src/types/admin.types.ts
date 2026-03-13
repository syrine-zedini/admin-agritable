export type AdminRole = "SuperAdmin" | "AdminCommercial" | "AdminLogistique";
export type AdminStatus = "Active" | "Suspended";

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: AdminRole;
  lastLogin: string | null;
  status: AdminStatus;
}

export interface CreateAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AdminRole;
}