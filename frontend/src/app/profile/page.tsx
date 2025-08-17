"use client"

import { AppLayout } from "@/widgets/layout"
import { useAuthGuard } from "@/features/auth/model/useAuthGuard"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProfileSection } from "@/features/profile/ui/ProfileSection"
import { FriendsSection } from "@/features/friends/ui/FriendsSection"

export default function ProfilePage() {
  // 인증 가드 - 로그인하지 않은 사용자는 메인페이지로 리다이렉트
  const { isAuthenticated } = useAuthGuard()

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!isAuthenticated) {
    return null
  }

  return (
    <AppLayout 
      backgroundColor="#111111"
      sidebarConfig={{ 
        showCreateGroupButton: false,
        showGroupsSection: true,
        showFriendsSection: true
      }}
    >
      {/* Main Content - 세로 분할 */}
      <main className="overflow-hidden h-screen flex justify-center">
        <div className="max-w-7xl w-full flex">
          {/* Profile 섹션 (왼쪽) */}
          <section className="w-1/2 px-6 py-8 overflow-y-auto border-r border-gray-800 max-w-2xl">
            <h2 className="font-keepick-heavy text-2xl text-white mb-8 tracking-wider sticky top-0 bg-[#111111] py-4 z-10">
              Profile
            </h2>
            <ProfileSection />
          </section>

          {/* Friends 섹션 (오른쪽) */}
          <section className="w-1/2 px-6 py-8 overflow-y-auto max-w-2xl">
            <h2 className="font-keepick-heavy text-2xl text-white mb-8 tracking-wider sticky top-0 bg-[#111111] py-4 z-10">
              Friends
            </h2>
            <FriendsSection />
          </section>
        </div>
      </main>
    </AppLayout>
  )
}