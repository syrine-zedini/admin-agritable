"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Users,
  Factory,
  Box,
  Wallet,
  Gift,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Sidebar = () => {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeItem, setActiveItem] = useState<string>("Tableau de bord");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = (label: string) => {
    if (isCollapsed && !isHovered) {
      setIsCollapsed(false);
      setTimeout(() => setOpenMenu(openMenu === label ? null : label), 50);
    } else {
      setOpenMenu(openMenu === label ? null : label);
    }
  };

  const handleItemClick = (label: string) => {
    setActiveItem(label);

    if (label === "Tableau de bord") {
      router.push("/dashboard/dashboard");
    } else if (label === "Produits") {
      router.push("/products");
    } else if (label === "Paramètres") {
      router.push("/dashboard/settings");
    }
  };

  const handleSubItemClick = (parentLabel: string, subItemLabel: string) => {
    setActiveItem(parentLabel);

    if (subItemLabel === "Approvisionnement") {
      router.push("/dashboard/PricingManagement");
    } else if (subItemLabel === "Produits") {
      router.push("/dashboard/products");
    } else if (subItemLabel === "Catégories") {
      router.push("/dashboard/Category");
    }
     else if (subItemLabel === "Clients B2C") {
    router.push("/dashboard/b2cClient"); 
  } else if (subItemLabel === "Clients B2B") {
    router.push("/dashboard/b2bClient");
  } else if (subItemLabel === "Livreurs") {
    router.push("/dashboard/livreurs");
  } else if (subItemLabel === "Préparateurs") {
    router.push("/dashboard/preparateurs");
  } else if (subItemLabel === "Administrateurs") {
    router.push("/dashboard/admins");
  }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setIsCollapsed(true);
    }, 200);
  };

  useEffect(() => {
    setIsCollapsed(true);
    setIsHovered(false);

    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const menuItems = [
    { icon: <LayoutDashboard size={24} />, label: "Tableau de bord", active: true },
    {
      icon: <ShoppingCart size={24} />,
      label: "Commandes & Opérations",
      children: [
        "Toutes les commandes",
        "Gestion des devis",
        "File de préparation",
        "Suivi des livraisons",
      ],
    },
    {
      icon: <Truck size={24} />,
      label: "Logistique",
      children: [
        "Zones & Horaires",
        "Planification des tournées",
        "Gestion des couffins",
      ],
    },
    {
      icon: <Users size={24} />,
      label: "Utilisateurs & Comptes",
      children: [
        "Clients B2C",
        "Clients B2B",
        "Livreurs",
        "Préparateurs",
        "Administrateurs",
      ],
    },
    {
      icon: <Factory size={24} />,
      label: "Opérations Fournisseurs",
      children: [
        "Approvisionnement",
        "Place de marché",
        "Bons de commande",
        "Gestion des fournisseurs",
      ],
    },
    {
      icon: <Box size={24} />,
      label: "Catalogue & Inventaire",
      children: [
        "Produits",
        "Catégories",
        "Couffins prêts",
        "Recettes",
        "Mouvements de stock",
      ],
    },
    {
      icon: <Wallet size={24} />,
      label: "Finances",
      children: [
        "Transactions",
        "Portefeuilles B2C",
        "Grands livres B2B",
        "Tarifs B2B personnalisés",
        "Validation des paiements",
        "Rapports financiers",
      ],
    },
    { icon: <Gift size={24} />, label: "Fidélité & Parrainages" },
    { icon: <MessageSquare size={24} />, label: "Communications" },
    { icon: <BarChart3 size={24} />, label: "Analytique" },
    { icon: <Settings size={24} />, label: "Paramètres" },
  ];

  return (
    <>
      {isHovered && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => {
            setIsHovered(false);
            setIsCollapsed(true);
          }}
        />
      )}

      <div
        ref={sidebarRef}
        className={`
          fixed lg:relative h-screen bg-[#0a120d] text-white 
          flex flex-col transition-all duration-300 ease-in-out z-50
          ${isCollapsed ? "w-28" : "w-96"}
          ${isHovered ? "lg:w-96" : ""}
          hover:lg:w-96
          hover:shadow-2xl hover:shadow-black/30
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`
            flex items-center gap-3 p-4 mb-6 transition-all duration-300
            ${isCollapsed && !isHovered ? "justify-center px-2" : "px-4"}
          `}
        >
          <div className="w-12 h-12 bg-[#1a2e22] rounded-xl flex items-center justify-center min-w-12 overflow-hidden">
            <Image
              src="/agritable-logo.png"
              alt="Agritable Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <h1
            className={`
              text-2xl font-bold tracking-tight transition-all duration-300 whitespace-nowrap
              ${isCollapsed && !isHovered ? "opacity-0 w-0" : "opacity-100"}
            `}
          >
            Agritable
          </h1>
        </div>

        <nav 
          className="
            flex-1 space-y-1 px-3 
            overflow-y-auto overflow-x-hidden
            scrollbar-hide
            [-ms-overflow-style:none]
            [scrollbar-width:none]
          "
        >
          {menuItems.map((item, index) => {
            const isOpen = openMenu === item.label;
            const isActive = activeItem === item.label;

            return (
              <div key={index} className="mb-1">
                <div
                  onClick={() => {
                    if (item.children) toggleMenu(item.label);
                    handleItemClick(item.label);
                  }}
                  className={`
                    flex items-center justify-between px-4 py-4 rounded-xl cursor-pointer 
                    transition-all duration-200
                    ${isActive
                      ? "bg-[#16a34a] text-white"
                      : "text-gray-300 hover:bg-[#1a2e22] hover:text-white"}
                    ${isCollapsed && !isHovered ? "px-3 justify-center" : ""}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`${isActive ? "text-white" : "text-gray-400"}`}>
                      {item.icon}
                    </span>
                    <span
                      className={`
                        text-lg font-semibold transition-all duration-300 whitespace-nowrap
                        ${isCollapsed && !isHovered ? "opacity-0 w-0" : "opacity-100"}
                      `}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.children && (isCollapsed && !isHovered ? null : (
                    <ChevronDown
                      size={18}
                      className={`transition-all duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  ))}
                </div>

                {item.children && isOpen && (isCollapsed && !isHovered ? null : (
                  <div className="ml-6 mt-2 space-y-2 pl-0">
                    {item.children.map((sub, i) => (
                      <div
                        key={i}
                        onClick={() => handleSubItemClick(item.label, sub)}
                        className="
                          text-base text-gray-400 hover:text-white cursor-pointer py-2.5 px-3 
                          rounded-lg transition-all duration-200 hover:bg-[#1a2e22]
                        "
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight size={14} />
                          <span>{sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        {isCollapsed && !isHovered && (
          <div className="p-4 text-center">
            <div className="w-6 h-6 mx-auto rounded-full bg-[#1a2e22] flex items-center justify-center">
              <ChevronRight size={14} className="text-green-500/60" />
            </div>
            <p className="text-xs text-green-500/40 mt-2">Survolez</p>
          </div>
        )}

        <div
          className={`
            mt-6 p-4 transition-all duration-300
            ${isCollapsed && !isHovered ? "px-2" : "px-4"}
          `}
        >
          <div
            className={`
              flex items-center gap-3 transition-all duration-300
              ${isCollapsed && !isHovered ? "justify-center" : ""}
            `}
          >
            
            <div>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;