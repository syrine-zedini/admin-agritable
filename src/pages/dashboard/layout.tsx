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
        router.replace("/login");
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
          router.replace("/login");
        } else {
          setVerified(true);
        }
      } catch (err) {
        console.error("Erreur validation token", err);
        sessionStorage.removeItem("adminToken");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Chargement dashboard...
      </div>
    );
  }

  if (!verified) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <NavbarAdmin />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
