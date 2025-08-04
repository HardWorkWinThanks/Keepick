"use client";

import { useAuthStatus } from "@/features/auth/social-login/api/useAuthStatus";

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>앱을 초기화하는 중...</div>
      </div>
    );
  }

  return <>{children}</>;
}
