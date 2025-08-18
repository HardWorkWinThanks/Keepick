/**
 * 티어 앨범 API 데이터와 편집 데이터 간 변환 유틸리티
 * API 응답(photoId) ↔ 편집 상태(id) 변환을 안전하게 처리
 */

import type { Photo } from "@/entities/photo"
import type { TierData } from "@/features/tier-battle"
import type { TierAlbum } from "../api/tierAlbumApi"

/**
 * API 응답 데이터를 편집용 형식으로 변환
 */
export const convertApiToEditor = (apiData: TierAlbum) => {
  if (!apiData?.photos) {
    return {
      tierPhotos: {
        S: [],
        A: [],
        B: [],
        C: [],
        D: [],
      } as TierData,
      availablePhotos: []
    }
  }

  // 티어별 사진 변환 (photoId → id)
  const tierPhotos: TierData = {
    S: apiData.photos.S?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
      id: photo.photoId,
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: `사진 #${photo.photoId}`
    })) || [],
    A: apiData.photos.A?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
      id: photo.photoId,
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: `사진 #${photo.photoId}`
    })) || [],
    B: apiData.photos.B?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
      id: photo.photoId,
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: `사진 #${photo.photoId}`
    })) || [],
    C: apiData.photos.C?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
      id: photo.photoId,
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: `사진 #${photo.photoId}`
    })) || [],
    D: apiData.photos.D?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
      id: photo.photoId,
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: `사진 #${photo.photoId}`
    })) || [],
  }

  // UNASSIGNED 사진들을 사용 가능한 사진으로 변환
  const availablePhotos: Photo[] = apiData.photos.UNASSIGNED?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
    id: photo.photoId,
    originalUrl: photo.originalUrl,
    thumbnailUrl: photo.thumbnailUrl,
    name: `사진 #${photo.photoId}`
  })) || []

  return {
    tierPhotos,
    availablePhotos
  }
}

/**
 * 편집 데이터를 API 요청 형식으로 변환
 */
export const convertEditorToApi = (tierPhotos: TierData) => {
  return {
    S: tierPhotos.S?.map(photo => photo.id) || [],
    A: tierPhotos.A?.map(photo => photo.id) || [],
    B: tierPhotos.B?.map(photo => photo.id) || [],
    C: tierPhotos.C?.map(photo => photo.id) || [],
    D: tierPhotos.D?.map(photo => photo.id) || [],
  }
}

/**
 * 대표이미지 ID 자동 선택 (S티어 첫번째 → A티어 첫번째 → ... 순서)
 */
export const selectThumbnailId = (tierPhotos: TierData): number | null => {
  for (const tier of ['S', 'A', 'B', 'C', 'D']) {
    const firstPhoto = tierPhotos[tier]?.[0]
    if (firstPhoto) {
      return firstPhoto.id
    }
  }
  return null
}

/**
 * 갤러리 선택 사진들을 편집용 형식으로 변환
 */
export const convertGalleryPhotosToEditor = (selectedPhotos: any[]): Photo[] => {
  return selectedPhotos.map(photo => ({
    id: photo.id,
    originalUrl: photo.originalUrl,
    thumbnailUrl: photo.thumbnailUrl,
    name: photo.title || `사진 #${photo.id}`
  }))
}