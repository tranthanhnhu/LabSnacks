"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { SearchProvider } from "@/context/search-context";
import { ThemeProvider } from "@/context/theme-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <SearchProvider>
          <ThemeProvider>
            {children}
            <Toaster
              position="top-center"
              richColors
              toastOptions={{
                classNames: {
                  toast: "rounded-2xl font-body",
                },
              }}
            />
          </ThemeProvider>
        </SearchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
