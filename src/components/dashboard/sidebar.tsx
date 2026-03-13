"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ShoppingCart, Truck, Users, Factory,
  Box, Wallet, Gift, MessageSquare, BarChart3, Settings,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth, Role } from "@/context/authContext";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  children?: string[];
  allowedRoles: Role[];
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { icon: <LayoutDashboard size={24} />, label: "Tableau de bord", allowedRoles: ["SuperAdmin", "AdminCommercial", "AdminLogistique"] },
  { icon: <ShoppingCart size={24} />, label: "Commandes & Opérations", allowedRoles: ["SuperAdmin", "AdminCommercial"], children: ["Toutes les commandes", "Gestion des devis", "File de préparation", "Suivi des livraisons"] },
  { icon: <Truck size={24} />, label: "Logistique", allowedRoles: ["SuperAdmin", "AdminLogistique"], children: ["Zones & Horaires", "Planification des tournées", "Gestion des couffins"] },
  { icon: <Users size={24} />, label: "Utilisateurs & Comptes", allowedRoles: ["SuperAdmin", "AdminCommercial"], children: ["Clients B2C", "Clients B2B", "Livreurs", "Préparateurs", "Administrateurs"] },
  { icon: <Factory size={24} />, label: "Opérations Fournisseurs", allowedRoles: ["SuperAdmin", "AdminCommercial"], children: ["Approvisionnement", "Place de marché", "Bons de commande", "Gestion des fournisseurs"] },
  { icon: <Box size={24} />, label: "Catalogue & Inventaire", allowedRoles: ["SuperAdmin", "AdminCommercial", "AdminLogistique"], children: ["Produits", "Catégories", "Couffins prêts", "Recettes", "Mouvements de stock"] },
  { icon: <Wallet size={24} />, label: "Finances", allowedRoles: ["SuperAdmin", "AdminCommercial"], children: ["Transactions", "Portefeuilles B2C", "Grands livres B2B", "Tarifs B2B personnalisés", "Validation des paiements", "Rapports financiers"] },
  { icon: <Gift size={24} />, label: "Fidélité & Parrainages", allowedRoles: ["SuperAdmin"] },
  { icon: <MessageSquare size={24} />, label: "Communications", allowedRoles: ["SuperAdmin"] },
  { icon: <BarChart3 size={24} />, label: "Analytique", allowedRoles: ["SuperAdmin"] },
  { icon: <Settings size={24} />, label: "Paramètres", allowedRoles: ["SuperAdmin"] },
];

const ROLE_BADGE: Record<Role, { label: string; bg: string; text: string }> = {
  SuperAdmin:      { label: "Super Admin",       bg: "bg-emerald-500/20", text: "text-emerald-400" },
  AdminCommercial: { label: "Admin Commercial",  bg: "bg-amber-500/20",   text: "text-amber-400"   },
  AdminLogistique: { label: "Admin Logistique",  bg: "bg-indigo-500/20",  text: "text-indigo-400"  },
};

const Sidebar = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [openMenu, setOpenMenu]       = useState<string | null>(null);
  const [isHovered, setIsHovered]     = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeItem, setActiveItem]   = useState<string>("Tableau de bord");
  const hoverTimeoutRef               = useRef<NodeJS.Timeout | null>(null);

  const userRole  = user?.role ?? "SuperAdmin";
  const menuItems = ALL_MENU_ITEMS.filter(i => i.allowedRoles.includes(userRole));
  const badge     = ROLE_BADGE[userRole];
  const expanded  = !isCollapsed || isHovered;

  const getInitials = (name?: string) =>
    name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "A";

  const toggleMenu = (label: string) => {
    if (!expanded) { setIsCollapsed(false); setTimeout(() => setOpenMenu(p => p === label ? null : label), 50); }
    else setOpenMenu(p => p === label ? null : label);
  };

  const handleItemClick = (label: string) => {
    setActiveItem(label);
    if (label === "Tableau de bord") router.push("/dashboard/dashboard");
    else if (label === "Paramètres")  router.push("/dashboard/settings");
  };

  const handleSubItemClick = (_: string, sub: string) => {
    const routes: Record<string, string> = {
      Approvisionnement: "/dashboard/PricingManagement",
      Produits: "/dashboard/products",
      Catégories: "/dashboard/Category",
      "Clients B2C": "/dashboard/b2cClient",
      "Clients B2B": "/dashboard/b2bClient",
      Livreurs: "/dashboard/livreurs",
      Préparateurs: "/dashboard/preparateurs",
      Administrateurs: "/dashboard/admins",
    };
    if (routes[sub]) router.push(routes[sub]);
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true); setIsCollapsed(false);
  };
  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => { setIsHovered(false); setIsCollapsed(true); }, 200);
  };

  useEffect(() => {
    setIsCollapsed(true);
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
  }, []);

  return (
    <>
      {isHovered && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => { setIsHovered(false); setIsCollapsed(true); }} />
      )}

      <div
        className={`relative flex flex-col h-screen bg-[#0a120d] text-white transition-all duration-300 ease-in-out z-50
          ${expanded ? "w-96" : "w-24"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >

        {/* ── Logo ── */}
        <div className="flex flex-col items-center justify-center py-7 border-b border-white/5">
          <div className="w-24 h-24 rounded-xl overflow-hidden mb-3">
             <Image src="/agritable-logo.png" alt="Logo" width={96} height={96} className="object-contain" />
          </div>
          {expanded && (
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Agritable
            </span>
          )}
        </div>

        {/* ── User card ── */}
        {expanded ? (
          <div className="mx-4 mt-5 mb-3 px-4 py-4 rounded-2xl bg-white/5 border border-white/8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-base font-bold flex-shrink-0">
              {getInitials(user?.username)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold text-white truncate leading-tight">
                {user?.username ?? "Admin"}
              </p>
              <span className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-5 mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-base font-bold">
              {getInitials(user?.username)}
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-1">

          {menuItems.map((item, index) => {
            const isOpen   = openMenu === item.label;
            const isActive = activeItem === item.label;

            return (
              <div key={index}>
                <div
                  onClick={() => { if (item.children) toggleMenu(item.label); handleItemClick(item.label); }}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150 group
                    ${isActive
                      ? "bg-[#16a34a] text-white"
                      : "text-gray-400 hover:bg-white/6 hover:text-white"}
                    ${!expanded ? "justify-center" : ""}`}
                >
                  <div className={`flex items-center gap-4 min-w-0 ${!expanded ? "justify-center w-full" : ""}`}>
                    <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                      {item.icon}
                    </span>
                    {expanded && (
                      <span className="text-[16px] font-bold whitespace-nowrap truncate">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {item.children && expanded && (
                    <ChevronDown size={17} className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isActive ? "text-white/70" : "text-gray-600"}`} />
                  )}
                </div>

                {/* Sub-items */}
                {item.children && isOpen && expanded && (
                  <div className="mt-1 ml-5 pl-4 border-l border-white/8 space-y-0.5 mb-1">
                    {item.children.map((sub, i) => (
                      <div
                        key={i}
                        onClick={() => handleSubItemClick(item.label, sub)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-[14px] font-semibold text-gray-400 hover:text-white hover:bg-white/6 transition-all duration-150"
                      >
                        <ChevronRight size={14} className="flex-shrink-0 text-gray-600" />
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── bottom padding ── */}
        <div className="pb-4" />
      </div>
    </>
  );
};

export default Sidebar;