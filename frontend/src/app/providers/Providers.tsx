"use client";
import StoreProvider from "./StoreProvider";
import QueryProvider from "./QueryProvider";
import { AuthInitializer } from "@/features/auth/model/AuthInitializer";
import { AppInitializer } from "./AppInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <QueryProvider>
        <AuthInitializer>
          <AppInitializer>{children}</AppInitializer>
        </AuthInitializer>
      </QueryProvider>
    </StoreProvider>
  );
}
