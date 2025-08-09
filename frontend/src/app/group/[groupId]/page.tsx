"use client"

import { useParams } from "next/navigation"
import { GroupSpaceWidget } from "@/widgets/group-space"
import AppLayout from "@/widgets/layout/ui/AppLayout"
import type { Group } from "@/entities/group"

interface GroupPageProps {
  params: Promise<{
    id: string
  }>
}

export default function GroupPage({ params }: GroupPageProps) {
  const { id } = useParams() as { id: string }
  
  // TODO: API에서 실제 그룹 데이터를 가져오는 로직 구현
  // 현재는 샘플 데이터 사용
  const groupData: Group = {
    id: id,
    name: "우리 가족",
    description: "가족 사진을 공유하는 그룹입니다",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: 4,
  }

  return (
    <AppLayout
      sidebarConfig={{
        showCreateGroupButton: true,
        showGroupsSection: false,
        showFriendsSection: true,
        currentGroup: {
          id: groupData.id,
          name: groupData.name,
          description: groupData.description,
          thumbnailImage: "/dummy/jeju-dummy1.webp"
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