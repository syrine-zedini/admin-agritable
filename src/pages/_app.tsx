import "@/styles/globals.css";
import type { AppProps } from "next/app";
import AdminDashboardLayout from "@/pages/AdminDashboard/layout"; // layout Admin

export default function App({ Component, pageProps, router }: AppProps & { router: any }) {
  // Vérifie si la route commence par /AdminDashboard
  const isAdmin = router.pathname.startsWith("/AdminDashboard");

  return isAdmin ? (
    <AdminDashboardLayout>
      <Component {...pageProps} />
    </AdminDashboardLayout>
  ) : (
    <Component {...pageProps} />
  );
}
