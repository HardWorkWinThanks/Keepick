"use client";

import { AppLayout } from "@/widgets/layout";
import { ProfileForm } from "@/features/profile";
import { useAuthGuard } from "@/features/auth/model/useAuthGuard";

export default function ProfilePage() {
  // 인증 가드 - 로그인하지 않은 사용자는 메인페이지로 리다이렉트
  const { isAuthenticated } = useAuthGuard();

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!isAuthenticated) {
    return null;
  }
  return (
    <AppLayout 
      backgroundColor="#f9fafb"
      sidebarConfig={{ 
        showCreateGroupButton: false,
        showGroupsSection: true,
        showFriendsSection: true
      }}
    >
      <main className="p-4 sm:p-6 lg:p-8">
        <ProfileForm />
      </main>
    </AppLayout>
  );
}
