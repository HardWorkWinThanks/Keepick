"use client"

import { use } from "react"
import { TimelineAlbumPage } from "@/features/timeline-album"
import { useAuthGuard } from "@/features/auth/model/useAuthGuard"

interface TimelineAlbumRouteProps {
  params: Promise<{
    groupId: string
    albumId: string
  }>
}

export default function TimelineAlbumRoute({ params }: TimelineAlbumRouteProps) {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const resolvedParams = use(params)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">로딩 중...</div>
          <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // useAuthGuard가 자동으로 리다이렉트 처리
  }

  // albumId는 디코딩이 필요없음 (ID는 보통 순수 숫자/문자)
  return <TimelineAlbumPage groupId={resolvedParams.groupId} albumId={resolvedParams.albumId} />
}