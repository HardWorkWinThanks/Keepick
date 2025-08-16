'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { GalleryPhotosSection } from './GalleryPhotosSection'
import type { DragPhotoData, Photo } from '@/entities/photo'

// 앨범 타입 정의
export type AlbumType = 'timeline' | 'tier' | 'highlight'

interface AlbumEditSidebarProps {
  albumType: AlbumType
  groupId: string
  albumId: string
  // 각 앨범 페이지에서 전달받을 props
  availablePhotos: Photo[]
  draggingPhotoId: number | null
  onDragStart: (e: React.DragEvent<HTMLDivElement>, photo: Photo) => void
  onDragEnd: () => void
  onDrop: (dragData: DragPhotoData) => void
  onAddPhotos: () => void
  onDeletePhotos: (photoIds: number[]) => void
}

export function AlbumEditSidebar({ 
  albumType, 
  groupId, 
  albumId,
  availablePhotos,
  draggingPhotoId,
  onDragStart,
  onDragEnd,
  onDrop,
  onAddPhotos,
  onDeletePhotos
}: AlbumEditSidebarProps) {
  const searchParams = useSearchParams()
  
  // URL 기반으로 편집 모드 확인
  const isEditModeFromURL = searchParams.get('edit') === 'true'
  
  // 편집 모드가 아니면 렌더링하지 않음
  if (!isEditModeFromURL) {
    return null
  }
  
  return (
    <GalleryPhotosSection
      availablePhotos={availablePhotos}
      draggingPhotoId={draggingPhotoId}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onAddPhotos={onAddPhotos}
      onDeletePhotos={onDeletePhotos}
      title={`${albumType === 'timeline' ? '타임라인' : albumType === 'tier' ? '티어' : '하이라이트'} 편집용 사진`}
      showControls={true}
    />
  )
}