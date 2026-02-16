import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import DashboardLayout from "@/pages/dashboard/layout"; // ✅ majuscule

export default function App({ Component, pageProps, router }: AppProps & { router: any }) {
  const [queryClient] = useState(() => new QueryClient());

  const isAdmin = router.pathname.startsWith("/dashboard");

  const content = isAdmin ? (
    <DashboardLayout>
      <Component {...pageProps} />
    </DashboardLayout>
  ) : (
    <Component {...pageProps} />
  );

  return (
    <QueryClientProvider client={queryClient}>
      {content}
    </QueryClientProvider>
  );
}
