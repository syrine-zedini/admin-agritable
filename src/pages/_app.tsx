import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import AdminDashboardLayout from "@/pages/AdminDashboard/layout";

export default function App({ Component, pageProps, router }: AppProps & { router: any }) {
  const [queryClient] = useState(() => new QueryClient());

  const isAdmin = router.pathname.startsWith("/AdminDashboard");

  const content = isAdmin ? (
    <AdminDashboardLayout>
      <Component {...pageProps} />
    </AdminDashboardLayout>
  ) : (
    <Component {...pageProps} />
  );

  return (
    <QueryClientProvider client={queryClient}>
      {content}
    </QueryClientProvider>
  );
}