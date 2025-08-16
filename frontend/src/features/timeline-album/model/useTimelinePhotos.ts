'use client'

import { useMemo } from 'react'
import { useTimelineAlbum } from './useTimelineAlbum'
import type { Photo } from '@/entities/photo'

/**
 * 사이드바용 단순한 타임라인 사진 조회 훅
 * 편집 로직 없이 읽기 전용으로 사용 가능한 사진만 반환
 * useState 기반 편집 시스템과 독립적으로 작동
 */
export function useTimelinePhotos(groupId: string, albumId: string, enabled: boolean = true) {
  // 기본 타임라인 앨범 데이터 조회 (TanStack Query 기반)
  const { timelineAlbum, loading: baseLoading } = useTimelineAlbum(groupId, albumId)
  
  // 사용 가능한 사진들만 추출 (메모화로 성능 최적화)
  const availablePhotos: Photo[] = useMemo(() => {
    if (!timelineAlbum?.unusedPhotos || !enabled) return []
    
    return timelineAlbum.unusedPhotos
      .filter(photo => photo && typeof photo === 'object')
      .map((photo: any) => ({
        id: photo.photoId || photo.id,
        thumbnailUrl: photo.thumbnailUrl || '',
        originalUrl: photo.originalUrl || '',
        name: photo.name || photo.title || `사진 #${photo.photoId || photo.id}`
      }))
      .filter(photo => photo.id && photo.id !== 0)
  }, [timelineAlbum?.unusedPhotos, enabled])
  
  return {
    availablePhotos,
    loading: baseLoading && enabled,
    albumName: timelineAlbum?.name || ''
  }
}