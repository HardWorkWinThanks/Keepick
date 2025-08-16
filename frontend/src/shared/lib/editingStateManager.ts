/**
 * 앨범 편집 상태를 sessionStorage에 임시 저장/복원하는 유틸리티
 * 갤러리에서 사진을 추가하러 나갔다가 돌아올 때 편집 중인 상태를 유지하기 위함
 */

import { Photo } from "@/entities/photo"

export type AlbumType = 'timeline' | 'tier'

/**
 * 타임라인 앨범 편집 상태
 */
export interface TimelineEditingState {
  albumInfo: {
    name: string
    description: string
    startDate?: string
    endDate?: string
    coverImage?: any
    thumbnailId?: number
  } | null
  sections: any[] // 섹션 데이터
  availablePhotos: Photo[] // 사이드바 사진들
}

/**
 * 티어 앨범 편집 상태
 */
export interface TierEditingState {
  albumInfo: {
    name: string
    description: string
  } | null
  tierPhotos: {
    S: Photo[]
    A: Photo[]
    B: Photo[]
    C: Photo[]
    D: Photo[]
  }
  availablePhotos: Photo[] // 사이드바 사진들
}

/**
 * 편집 상태를 sessionStorage에 저장
 */
export const saveEditingState = (albumType: AlbumType, state: TimelineEditingState | TierEditingState) => {
  try {
    const key = `editing_${albumType}_album`
    sessionStorage.setItem(key, JSON.stringify(state))
    console.log(`✅ ${albumType} 앨범 편집 상태 저장됨`)
  } catch (error) {
    console.error('편집 상태 저장 실패:', error)
  }
}

/**
 * sessionStorage에서 편집 상태 복원
 */
export const restoreEditingState = <T extends TimelineEditingState | TierEditingState>(
  albumType: AlbumType
): T | null => {
  try {
    const key = `editing_${albumType}_album`
    const saved = sessionStorage.getItem(key)
    
    if (saved) {
      const state = JSON.parse(saved) as T
      console.log(`✅ ${albumType} 앨범 편집 상태 복원됨`)
      return state
    }
    
    return null
  } catch (error) {
    console.error('편집 상태 복원 실패:', error)
    return null
  }
}

/**
 * 편집 상태 정리 (저장 완료 후 또는 컴포넌트 언마운트시)
 */
export const clearEditingState = (albumType: AlbumType) => {
  try {
    const key = `editing_${albumType}_album`
    sessionStorage.removeItem(key)
    console.log(`🗑️ ${albumType} 앨범 편집 상태 정리됨`)
  } catch (error) {
    console.error('편집 상태 정리 실패:', error)
  }
}

/**
 * 모든 편집 상태 확인 (디버깅용)
 */
export const getEditingStates = () => {
  const timeline = restoreEditingState<TimelineEditingState>('timeline')
  const tier = restoreEditingState<TierEditingState>('tier')
  
  return {
    timeline,
    tier
  }
}