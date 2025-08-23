"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GiftProvider } from "@/contexts/gift-context";
import { AppProvider } from "@/contexts/app-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <GiftProvider>
        <AppProvider>{children}</AppProvider>
      </GiftProvider>
    </QueryClientProvider>
  );
}