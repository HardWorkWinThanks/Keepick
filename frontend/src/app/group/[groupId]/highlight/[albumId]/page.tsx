"use client"

import { use } from "react"
import { HighlightAlbumPage } from "@/features/highlight-album"
import { useAuthGuard } from "@/features/auth/model/useAuthGuard"

interface HighlightAlbumRouteProps {
  params: Promise<{
    groupId: string
    albumId: string
  }>
}

export default function HighlightAlbumRoute({ params }: HighlightAlbumRouteProps) {
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

  return <HighlightAlbumPage groupId={resolvedParams.groupId} albumId={resolvedParams.albumId} />
}