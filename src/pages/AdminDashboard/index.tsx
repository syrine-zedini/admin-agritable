"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/AdminDashboard/sidebar";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirige automatiquement vers la page "dashboard" par défaut
    router.replace("/AdminDashboard/dashboard");
  }, [router]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      

    </div>
  );
}
