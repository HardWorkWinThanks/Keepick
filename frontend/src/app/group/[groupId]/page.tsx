"use client"

import { useParams } from "next/navigation"
import { GroupSpaceWidget } from "@/widgets/group-space"
import { useGroupInfo } from "@/features/group-management"

interface GroupPageProps {
  params: Promise<{
    groupId: string
  }>
}

export default function GroupPage({ params }: GroupPageProps) {
  const { groupId: groupIdParam } = useParams() as { groupId: string }
  const groupId = parseInt(groupIdParam)
  
  // 그룹 정보 조회 (로딩/에러 상태는 레이아웃에서 처리)
  const { data: groupData } = useGroupInfo(groupId)

  // 그룹 데이터가 없으면 레이아웃에서 처리됨
  if (!groupData) {
    return null
  }

  return (
    <GroupSpaceWidget 
      group={groupData} 
      showSidebar={true}
    />
  )
}