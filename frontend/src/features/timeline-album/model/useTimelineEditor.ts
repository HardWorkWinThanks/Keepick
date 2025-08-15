"use client"

import { useState, useCallback, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { TimelineAlbum, TimelineSection } from "@/entities/album"
import { Photo } from "@/entities/photo"
import { useTimelineAlbum } from "./useTimelineAlbum"

// 편집 중인 앨범 정보 타입
export interface EditingAlbumInfo {
  name: string
  description: string
  startDate: string
  endDate: string
  thumbnailId: number
  coverImage: Photo | null
}

// 편집 중인 섹션 타입 (인덱스 보존을 위해 null 허용)
export interface EditingSection extends Omit<TimelineSection, 'photos'> {
  photos: (Photo | null)[]
}

// 편집 상태 타입
export interface TimelineEditingState {
  albumInfo: EditingAlbumInfo
  sections: EditingSection[]
  unusedPhotos: Photo[]
}

export function useTimelineEditor(groupId: string, albumId: string) {
  const queryClient = useQueryClient()
  
  // 서버 데이터 조회 (읽기 전용)
  const { 
    timelineAlbum, 
    loading, 
    updateTimelineAlbum, 
    updateTimelineAlbumAsync,
    isUpdating,
    refetchTimeline 
  } = useTimelineAlbum(groupId, albumId)
  
  // 편집 상태 (로컬)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingState, setEditingState] = useState<TimelineEditingState | null>(null)

  // 서버 데이터를 편집 상태로 변환하는 함수
  const convertToEditingState = useCallback((album: TimelineAlbum): TimelineEditingState => {
    // 사진 데이터 정규화 (서버 스키마에 맞게 수정)
    const normalizePhotos = (photos: any[]): Photo[] => {
      return photos.map((photo: any) => {
        const photoId = photo.photoId || photo.id // 서버는 photoId 사용
        return {
          id: photoId,
          src: photo.thumbnailUrl || photo.originalUrl || '/placeholder/photo-placeholder.svg',
          thumbnailUrl: photo.thumbnailUrl,
          originalUrl: photo.originalUrl,
          name: photo.name || photo.title || `사진 #${photoId}`
        }
      }).filter(photo => photo.id && photo.id !== 0)
    }

    // 섹션 변환 (서버 스키마에 맞게 수정)
    const editingSections: EditingSection[] = album.sections.length > 0 
      ? album.sections.map(section => {
          const normalizedPhotos: (Photo | null)[] = Array(3).fill(null)
          
          if (section.photos && Array.isArray(section.photos)) {
            section.photos.forEach((photo: any, idx: number) => {
              if (photo && idx < 3) {
                const photoId = photo.photoId || photo.id // 서버는 photoId 사용
                normalizedPhotos[idx] = {
                  id: photoId,
                  src: photo.thumbnailUrl || photo.originalUrl || '/placeholder/photo-placeholder.svg',
                  thumbnailUrl: photo.thumbnailUrl,
                  originalUrl: photo.originalUrl,
                  name: photo.name || photo.title || `사진 #${photoId}`
                }
              }
            })
          }
          
          // photoIds 배열 생성 (서버 응답에 없으므로 photos에서 추출)
          const photoIds = normalizedPhotos
            .filter((photo): photo is Photo => photo !== null)
            .map(photo => photo.id)
          
          return {
            id: section.sectionId || section.id, // 서버는 sectionId 사용
            name: section.name,
            description: section.description,
            startDate: section.startDate,
            endDate: section.endDate,
            photoIds: photoIds, // 계산된 photoIds
            photos: normalizedPhotos
          }
        })
      : [{
          id: Date.now(),
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          photoIds: [],
          photos: Array(3).fill(null)
        }]

    // 대표이미지 정보 추출 (서버에서 설정된 대표이미지가 있으면 복원)
    const hasCoverImage = album.thumbnailUrl && 
      album.thumbnailUrl !== "/placeholder.svg" && 
      album.thumbnailUrl !== "/placeholder/photo-placeholder.svg"
    
    const coverImage: Photo | null = hasCoverImage ? {
      id: album.thumbnailId || 0, // 실제 thumbnailId 사용
      src: album.thumbnailUrl,
      thumbnailUrl: album.thumbnailUrl,
      originalUrl: album.originalUrl || album.thumbnailUrl,
      name: `${album.name} 대표이미지`
    } : null

    return {
      albumInfo: {
        name: album.name,
        description: album.description,
        startDate: album.startDate,
        endDate: album.endDate,
        thumbnailId: hasCoverImage ? (album.thumbnailId || 0) : 0, // 서버에 설정된 thumbnailId 복원
        coverImage: coverImage
      },
      sections: editingSections,
      unusedPhotos: normalizePhotos(album.unusedPhotos || [])
    }
  }, [])

  // 편집 모드 시작
  const startEditing = useCallback(() => {
    if (timelineAlbum) {
      setEditingState(convertToEditingState(timelineAlbum))
      setIsEditMode(true)
    }
  }, [timelineAlbum, convertToEditingState])

  // 편집 모드 종료 (모든 변경사항 취소하고 원래 상태로 복원)
  const cancelEditing = useCallback(() => {
    setIsEditMode(false)
    setEditingState(null)
    // 원본 데이터로 복원하려면 캐시를 다시 불러오거나 자동으로 displayData가 원본으로 돌아감
  }, [])

  // 사용 가능한 사진들 계산 (실시간)
  const availablePhotos = useCallback((): Photo[] => {
    if (!editingState) return []
    
    // 섹션에서 사용 중인 사진 ID들 수집
    const usedPhotoIds = new Set<number>()
    editingState.sections.forEach(section => {
      section.photos.forEach(photo => {
        if (photo) usedPhotoIds.add(photo.id)
      })
    })
    
    // 대표이미지로 사용 중인 사진도 제외 (ID가 0이 아닌 경우만)
    if (editingState.albumInfo.coverImage && editingState.albumInfo.coverImage.id !== 0) {
      usedPhotoIds.add(editingState.albumInfo.coverImage.id)
    }
    
    // 사용되지 않은 사진들만 반환
    return editingState.unusedPhotos.filter(photo => !usedPhotoIds.has(photo.id))
  }, [editingState])

  // photoIds를 photos 배열에서 실시간 계산하는 헬퍼 함수
  const syncPhotoIds = useCallback((photos: (Photo | null)[]): number[] => {
    return photos
      .filter((photo): photo is Photo => {
        if (photo === null) return false
        if (typeof photo.id !== 'number' || photo.id <= 0) return false
        if (!photo.src && !photo.thumbnailUrl && !photo.originalUrl) return false
        return true
      })
      .map(photo => photo.id)
  }, [])

  // 갤러리에서 섹션으로 사진 이동
  const moveSidebarToSection = useCallback((photoId: number, sectionIndex: number, imageIndex: number) => {
    setEditingState(prev => {
      if (!prev) return prev

      const photo = prev.unusedPhotos.find(p => p.id === photoId)
      if (!photo || !prev.sections[sectionIndex]) return prev

      const newSections = [...prev.sections]
      const newSection = { ...newSections[sectionIndex] }
      newSection.photos = [...newSection.photos]
      
      // 해당 위치에 사진 배치
      newSection.photos[imageIndex] = photo
      
      // photoIds 배열 실시간 동기화
      newSection.photoIds = syncPhotoIds(newSection.photos)
      
      newSections[sectionIndex] = newSection

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [syncPhotoIds])

  // 섹션에서 갤러리로 사진 이동
  const moveSectionToSidebar = useCallback((sectionIndex: number, imageIndex: number) => {
    setEditingState(prev => {
      if (!prev) return prev

      const section = prev.sections[sectionIndex]
      if (!section || !section.photos[imageIndex]) return prev

      const photoToRemove = section.photos[imageIndex]
      const newSections = [...prev.sections]
      const newSection = { ...newSections[sectionIndex] }
      newSection.photos = [...newSection.photos]
      
      // 해당 위치의 사진 제거 (null로 설정)
      newSection.photos[imageIndex] = null
      
      // photoIds 배열 실시간 동기화
      newSection.photoIds = syncPhotoIds(newSection.photos)
      
      newSections[sectionIndex] = newSection

      // 제거된 사진을 unusedPhotos에 다시 추가
      const newUnusedPhotos = [...prev.unusedPhotos]
      if (photoToRemove && !newUnusedPhotos.some(p => p.id === photoToRemove.id)) {
        newUnusedPhotos.push(photoToRemove)
      }

      return {
        ...prev,
        sections: newSections,
        unusedPhotos: newUnusedPhotos
      }
    })
  }, [syncPhotoIds])

  // 대표이미지 설정
  const setCoverImage = useCallback((photoId: number, photo: Photo) => {
    setEditingState(prev => {
      if (!prev) return prev

      return {
        ...prev,
        albumInfo: {
          ...prev.albumInfo,
          thumbnailId: photoId,
          coverImage: photo
        }
      }
    })
  }, [])

  // 섹션 업데이트
  const updateSection = useCallback((sectionIndex: number, field: string, value: string) => {
    setEditingState(prev => {
      if (!prev) return prev

      const newSections = [...prev.sections]
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        [field]: value
      }

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // 섹션 추가
  const addSection = useCallback(() => {
    setEditingState(prev => {
      if (!prev) return prev

      const newSection: EditingSection = {
        id: Date.now(),
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        photoIds: [],
        photos: Array(3).fill(null)
      }

      return {
        ...prev,
        sections: [...prev.sections, newSection]
      }
    })
  }, [])

  // 섹션 삭제
  const deleteSection = useCallback((sectionIndex: number) => {
    setEditingState(prev => {
      if (!prev || prev.sections.length <= 1) return prev

      const newSections = prev.sections.filter((_, index) => index !== sectionIndex)

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // 앨범 정보 업데이트
  const updateAlbumInfo = useCallback((updates: Partial<EditingAlbumInfo>) => {
    setEditingState(prev => {
      if (!prev) return prev

      return {
        ...prev,
        albumInfo: {
          ...prev.albumInfo,
          ...updates
        }
      }
    })
  }, [])

  // 저장
  const save = useCallback(async () => {
    if (!editingState || !timelineAlbum) {
      console.warn('❌ 저장 실패: 편집 상태 또는 앨범 데이터가 없습니다.')
      return
    }

    try {
      // 대표이미지 ID 처리 (변경하지 않으면 null로 전송)
      let thumbnailId = null
      if (editingState.albumInfo.coverImage && editingState.albumInfo.coverImage.id > 0) {
        thumbnailId = editingState.albumInfo.coverImage.id
      } else if (editingState.albumInfo.thumbnailId > 0) {
        thumbnailId = editingState.albumInfo.thumbnailId
      }
      
      // 섹션 데이터 준비
      const validSections = editingState.sections.map((section) => {
        const isExistingSection = timelineAlbum?.sections.some(originalSection => originalSection.id === section.id)
        const photoIds = syncPhotoIds(section.photos)
        
        return {
          ...(isExistingSection && { id: section.id }),
          name: section.name || '',
          description: section.description || '',
          startDate: section.startDate || '',
          endDate: section.endDate || '',
          photoIds
        }
      })

      // 업데이트할 데이터
      const updateData = {
        name: editingState.albumInfo.name || '',
        description: editingState.albumInfo.description || '',
        thumbnailId,
        startDate: editingState.albumInfo.startDate || '',
        endDate: editingState.albumInfo.endDate || '',
        sections: validSections
      }
      
      // 필수 필드 검증
      if (!updateData.name.trim()) {
        throw new Error('앨범 제목을 입력해주세요')
      }

      // 서버 업데이트 실행
      await updateTimelineAlbumAsync(updateData)
      
      // 편집 모드 종료
      setIsEditMode(false)
      setEditingState(null)
      
    } catch (error) {
      console.error('앨범 저장 실패:', error)
      throw error
    }
  }, [editingState, timelineAlbum, updateTimelineAlbumAsync, groupId, albumId])

  // 표시용 데이터 (편집 중이면 편집 상태, 아니면 서버 데이터)
  const displayData = isEditMode && editingState ? editingState : 
    timelineAlbum ? convertToEditingState(timelineAlbum) : null

  return {
    // 상태
    isEditMode,
    editingState,
    displayData,
    loading,
    isUpdating,
    
    // 표시용 데이터
    albumInfo: displayData?.albumInfo || null,
    sections: displayData?.sections || [],
    availablePhotos: isEditMode ? availablePhotos() : [],
    
    // 액션
    startEditing,
    cancelEditing,
    save,
    
    // 편집 액션들
    moveSidebarToSection,
    moveSectionToSidebar,
    setCoverImage,
    updateSection,
    addSection,
    deleteSection,
    updateAlbumInfo
  }
}