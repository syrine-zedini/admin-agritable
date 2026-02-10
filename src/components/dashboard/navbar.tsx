import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';

const NavbarAdmin = () => {
  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      
      {/* Partie Gauche : Menu & Recherche */}
      <div className="flex items-center flex-1 gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Rechercher commandes, clients, produits..."
          />
        </div>
      </div>

      {/* Partie Droite : Notifications & Profil */}
      <div className="flex items-center gap-6">
        
        {/* Cloche de notification */}
        <div className="relative cursor-pointer">
          <Bell className="w-6 h-6 text-gray-400" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-green-600 rounded-full border-2 border-white">
            3
          </span>
        </div>

        {/* Info Utilisateur */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-700">admin@agritable.tn</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold text-purple-600 bg-purple-100 rounded-md uppercase">
              SuperAdmin
            </span>
          </div>
          
          <div className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-full text-white cursor-pointer hover:opacity-90 transition-opacity">
            <User className="w-6 h-6" />
          </div>
        </div>

      </div>
    </nav>
  );
};

export default NavbarAdmin;