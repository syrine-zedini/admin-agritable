import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/router';

interface AdminUser {
  id: string;
  email: string;
  username: string;
}

const NavbarAdmin = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const res = await fetch(`http://localhost:6002/api/auth/validate-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) { router.push('/login'); return; }

        const json = await res.json();
        setAdminUser(json?.data?.user ?? null);
      } catch (err) {
        console.error('Erreur récupération utilisateur:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-200">
      {/* Partie Gauche : Menu & Recherche */}
      <div className="flex items-center flex-1 gap-6">
        <button className="p-3 hover:bg-gray-100 rounded-md transition-colors">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        <div className="relative w-full max-w-lg">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full p-4 pl-12 text-base text-gray-900 border border-gray-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Rechercher commandes, clients, produits..."
          />
        </div>
      </div>

      {/* Partie Droite : Notifications & Profil */}
      <div className="flex items-center gap-8">
        {/* Cloche de notification */}
        <div className="relative cursor-pointer">
          <Bell className="w-7 h-7 text-gray-400" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-[12px] font-bold text-white bg-green-600 rounded-full border-2 border-white">
            3
          </span>
        </div>

        {/* Info Utilisateur */}
        <div className="relative flex items-center gap-4" ref={dropdownRef}>
          <div className="flex flex-col items-end">
            <span className="text-base font-medium text-gray-700">
              {adminUser?.email ?? '...'}
            </span>
            <span className="px-3 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded-md uppercase">
              SuperAdmin
            </span>
          </div>

          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-12 h-12 flex items-center justify-center bg-green-600 rounded-full text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            <User className="w-7 h-7" />
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="flex items-center w-full px-5 py-3 text-gray-700 hover:bg-gray-100 gap-3 text-base"
              >
                <Settings className="w-5 h-5" />
                Paramètres
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-5 py-3 text-red-600 hover:bg-gray-100 gap-3 text-base"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarAdmin;