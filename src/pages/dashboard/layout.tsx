"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarAdmin from "../../components/dashboard/navbar";
import Sidebar from "../../components/dashboard/sidebar";

function Page404() {
  return (
    <div style={{ textAlign: "center", marginTop: "10rem" }}>
      <h1>404</h1>
      <p>Page non trouvée ou accès interdit</p>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true); // pour spinner ou attente

  useEffect(() => {
    const verifyToken = async () => {
      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        console.log("pas de token → page 404");
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth/validate-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.log("token invalide → page 404");
          sessionStorage.removeItem("adminToken");
          setNotFound(true);
        } else {
          setVerified(true); // token valide
        }
      } catch (err) {
        console.error("erreur backend → page 404", err);
        sessionStorage.removeItem("adminToken");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Affichage pendant la vérification
  if (loading) return <p style={{ textAlign: "center", marginTop: "10rem" }}>Chargement...</p>;

  // Page 404 si token absent ou invalide
  if (notFound) return <Page404 />;

  // Dashboard si token valide
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
