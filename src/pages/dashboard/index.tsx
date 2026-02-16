"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/sidebar";

export default function dashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/dashboard");
  }, [router]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      

    </div>
  );
}
