import React from "react";
import { Users } from "lucide-react";
import { AdminUser } from "@/types/admin.types";

interface Props {
  admins: AdminUser[];
}

const AdminTable: React.FC<Props> = ({ admins }) => {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-slate-400 font-medium border-b border-gray-50">
            <th className="px-8 py-5 font-semibold">Email</th>
            <th className="px-8 py-5 font-semibold">Full Name</th>
            <th className="px-8 py-5 font-semibold">Role</th>
            <th className="px-8 py-5 font-semibold">Permissions</th>
            <th className="px-8 py-5 font-semibold">Last Login</th>
            <th className="px-8 py-5 font-semibold">Status</th>
            <th className="px-8 py-5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {admins.map((admin, idx) => (
            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-8 py-5 text-slate-600">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-slate-400" />
                  <span className="font-medium tracking-tight">{admin.email}</span>
                </div>
              </td>
              <td className="px-8 py-5 text-slate-500">{admin.name}</td>
              <td className="px-8 py-5">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                  admin.role === 'SuperAdmin'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {admin.role}
                </span>
              </td>
              <td className="px-8 py-5 text-slate-500">{admin.permissions} permissions</td>
              <td className="px-8 py-5 text-slate-500">{admin.lastLogin}</td>
              <td className="px-8 py-5">
                <span className={`px-4 py-1.5 rounded-full text-[11px] font-black text-white ${
                  admin.status === 'Active'
                    ? 'bg-[#10a345]'
                    : 'bg-[#e54d4d]'
                }`}>
                  {admin.status.toUpperCase()}
                </span>
              </td>
              <td className="px-8 py-5 text-right font-bold text-slate-700">
                <button className="hover:text-black">Actions</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
