"use client";
import StoreProvider from "./StoreProvider";
import QueryProvider from "./QueryProvider";
import { AuthInitializer } from "./AuthInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <QueryProvider>
        <AuthInitializer>
          {children}
        </AuthInitializer>
      </QueryProvider>
    </StoreProvider>
  );
}
