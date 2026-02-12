import { AdminUser } from "@/types/admin.types";

export const getAdmins = (): AdminUser[] => {
  return [
    { email: 'genzadmin@agritable.tn', name: 'genz genz', role: 'SuperAdmin', permissions: 39, lastLogin: 'Never', status: 'Active' },
    { email: 'admin3@gmail.com', name: 'admin3 admin', role: 'Operational', permissions: 18, lastLogin: 'Never', status: 'Suspended' },
    { email: 'admin2@agritable.tn', name: 'Wajdi Ayadi', role: 'Operational', permissions: 18, lastLogin: 'Never', status: 'Active' },
    { email: 'admin@agritable.tn', name: '', role: 'SuperAdmin', permissions: 40, lastLogin: 'Never', status: 'Active' },
  ];
};
