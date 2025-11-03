"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/contexts/app-context";
import { CouponCartProvider } from "@/contexts/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <CouponCartProvider>
        {children}
      </CouponCartProvider>
    </QueryClientProvider>
  );
}