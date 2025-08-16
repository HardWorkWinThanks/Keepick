"use client"

import { useParams } from "next/navigation"
import { GroupSpaceWidget } from "@/widgets/group-space"
import AppLayout from "@/widgets/layout/ui/AppLayout"
import { useGroupInfo } from "@/features/group-management"
import { useAuthGuard } from "@/features/auth/model/useAuthGuard"

interface GroupPageProps {
  params: Promise<{
    groupId: string
  }>
}

export default function GroupPage({ params }: GroupPageProps) {
  const { groupId: groupIdParam } = useParams() as { groupId: string }
  const groupId = parseInt(groupIdParam)
  
  // 인증 가드 - 로그인하지 않은 사용자는 메인페이지로 리다이렉트
  const { isAuthenticated } = useAuthGuard()
  
  // Tanstack Query로 그룹 정보 조회 (캐싱, 로딩/에러 상태 자동 관리)
  const { data: groupData, isLoading, error } = useGroupInfo(groupId)

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!isAuthenticated) {
    return null
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <AppLayout
        sidebarConfig={{
          showCreateGroupButton: false, // useDefaultContent가 있으므로 중복 방지
          showGroupsSection: false,
          showFriendsSection: false,
          showGroupChat: true,
          useDefaultContent: true,
          forceInitialPinned: true
        }}
      >
        <div className="min-h-screen bg-[#222222] flex items-center justify-center">
          <div className="text-white text-xl">그룹 정보를 불러오는 중...</div>
        </div>
      </AppLayout>
    )
  }

  // 에러 상태
  if (error || !groupData) {
    return (
      <AppLayout
        sidebarConfig={{
          showCreateGroupButton: false, // useDefaultContent가 있으므로 중복 방지
          showGroupsSection: false,
          showFriendsSection: false,
          showGroupChat: true,
          useDefaultContent: true,
          forceInitialPinned: true
        }}
      >
        <div className="min-h-screen bg-[#222222] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">
              {error ? '그룹을 불러오는 중 오류가 발생했습니다.' : '그룹을 찾을 수 없습니다.'}
            </div>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
            >
              돌아가기
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      sidebarConfig={{
        showCreateGroupButton: false, // useDefaultContent가 있으므로 중복 방지
        showGroupsSection: false,
        showFriendsSection: false,
        showGroupChat: true,
        useDefaultContent: true,
        currentGroup: {
          id: groupData.groupId.toString(),
          name: groupData.name,
          description: groupData.description,
          thumbnailUrl: groupData.thumbnailUrl || "/dummy/jeju-dummy1.webp"
        },
        forceInitialPinned: true
      }}
    >
      <GroupSpaceWidget 
        group={groupData} 
        showSidebar={true}
      />
    </AppLayout>
  )
}