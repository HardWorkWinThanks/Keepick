"use client"

import { use } from "react"
import { TimelineAlbumPage } from "@/features/timeline-album"
import { useAuthGuard } from "@/features/auth/model/useAuthGuard"

interface TimelineAlbumRouteProps {
  params: Promise<{
    groupId: string
    albumTitle: string
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

  // URL 디코딩 처리
  const decodedAlbumTitle = decodeURIComponent(resolvedParams.albumTitle)

  return <TimelineAlbumPage groupId={resolvedParams.groupId} albumTitle={decodedAlbumTitle} />
}