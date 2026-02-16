export interface AdminUser {
  email: string;
  name: string;
  role: 'SuperAdmin' | 'Operational';
  permissions: number;
  lastLogin: string;
  status: 'Active' | 'Suspended';
}

export interface StatCardProps {
  title: string;
  value: string | number;
  label: string;
  valueColor?: string;
}
