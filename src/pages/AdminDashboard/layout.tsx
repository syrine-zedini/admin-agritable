
"use client";

import NavbarAdmin from "../../components/dashboard/navbar";
import Sidebar from "../../components/dashboard/sidebar";


export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar fixe à gauche */}
      <Sidebar />

      {/* Contenu principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Navbar seulement dans la zone des pages routes */}
        <NavbarAdmin />

        {/* Contenu des pages */}
        <main style={{ flex: 1, padding: "1rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
