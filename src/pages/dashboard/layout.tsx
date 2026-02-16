"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarAdmin from "../../components/dashboard/navbar";
import Sidebar from "../../components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}auth/validate-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          sessionStorage.removeItem("adminToken");
          router.replace("/admin/login");
        } else {
          setVerified(true);
        }
      } catch (err) {
        console.error("Erreur validation token", err);
        sessionStorage.removeItem("adminToken");
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [router]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "10rem" }}>
        Chargement dashboard...
      </div>
    );
  }

  if (!verified) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <NavbarAdmin />
        <main style={{ flex: 1, padding: "1rem" }}>{children}</main>
      </div>
    </div>
  );
}
