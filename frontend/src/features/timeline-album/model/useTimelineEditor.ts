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
    isUpdating,
    refetchTimeline 
  } = useTimelineAlbum(groupId, albumId)
  
  // 편집 상태 (로컬)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingState, setEditingState] = useState<TimelineEditingState | null>(null)

  // 서버 데이터를 편집 상태로 변환하는 함수
  const convertToEditingState = useCallback((album: TimelineAlbum): TimelineEditingState => {
    // 사진 데이터 정규화
    const normalizePhotos = (photos: any[]): Photo[] => {
      return photos.map((photo: any) => ({
        id: photo.id || photo.photoId,
        src: photo.src || photo.thumbnailUrl || photo.originalUrl || '/placeholder/photo-placeholder.svg',
        thumbnailUrl: photo.thumbnailUrl,
        originalUrl: photo.originalUrl,
        name: photo.name || photo.title || `사진 #${photo.id || photo.photoId}`
      })).filter(photo => photo.id)
    }

    // 섹션 변환 (최대 3개 사진, 인덱스 보존)
    const editingSections: EditingSection[] = album.sections.length > 0 
      ? album.sections.map(section => {
          const normalizedPhotos: (Photo | null)[] = Array(3).fill(null)
          
          if (section.photos && Array.isArray(section.photos)) {
            section.photos.forEach((photo: any, idx: number) => {
              if (photo && idx < 3) {
                normalizedPhotos[idx] = {
                  id: photo.id || photo.photoId,
                  src: photo.src || photo.thumbnailUrl || photo.originalUrl || '/placeholder/photo-placeholder.svg',
                  thumbnailUrl: photo.thumbnailUrl,
                  originalUrl: photo.originalUrl,
                  name: photo.name || photo.title || `사진 #${photo.id || photo.photoId}`
                }
              }
            })
          }
          
          return {
            ...section,
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

    return {
      albumInfo: {
        name: album.name,
        description: album.description,
        startDate: album.startDate,
        endDate: album.endDate,
        thumbnailId: 0,
        coverImage: null
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

  // 편집 모드 종료
  const cancelEditing = useCallback(() => {
    setIsEditMode(false)
    setEditingState(null)
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
    
    // 대표이미지로 사용 중인 사진도 제외
    if (editingState.albumInfo.coverImage) {
      usedPhotoIds.add(editingState.albumInfo.coverImage.id)
    }
    
    // 사용되지 않은 사진들만 반환
    return editingState.unusedPhotos.filter(photo => !usedPhotoIds.has(photo.id))
  }, [editingState])

  // 갤러리에서 섹션으로 사진 이동
  const moveSidebarToSection = useCallback((photoId: number, sectionIndex: number, imageIndex: number) => {
    if (!editingState) return

    setEditingState(prev => {
      if (!prev) return prev

      const photo = prev.unusedPhotos.find(p => p.id === photoId)
      if (!photo || !prev.sections[sectionIndex]) return prev

      const newSections = [...prev.sections]
      const newSection = { ...newSections[sectionIndex] }
      newSection.photos = [...newSection.photos]
      
      // 해당 위치에 사진 배치
      newSection.photos[imageIndex] = photo
      
      // photoIds 배열 업데이트 (null이 아닌 사진들의 ID만)
      newSection.photoIds = newSection.photos
        .filter((p): p is Photo => p !== null)
        .map(p => p.id)
      
      newSections[sectionIndex] = newSection

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [editingState])

  // 섹션에서 갤러리로 사진 이동
  const moveSectionToSidebar = useCallback((sectionIndex: number, imageIndex: number) => {
    if (!editingState) return

    setEditingState(prev => {
      if (!prev) return prev

      const section = prev.sections[sectionIndex]
      if (!section || !section.photos[imageIndex]) return prev

      const newSections = [...prev.sections]
      const newSection = { ...newSections[sectionIndex] }
      newSection.photos = [...newSection.photos]
      
      // 해당 위치의 사진 제거 (null로 설정)
      newSection.photos[imageIndex] = null
      
      // photoIds 배열 업데이트
      newSection.photoIds = newSection.photos
        .filter((p): p is Photo => p !== null)
        .map(p => p.id)
      
      newSections[sectionIndex] = newSection

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [editingState])

  // 대표이미지 설정
  const setCoverImage = useCallback((photoId: number, photo: Photo) => {
    if (!editingState) return

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
  }, [editingState])

  // 섹션 업데이트
  const updateSection = useCallback((sectionIndex: number, field: string, value: string) => {
    if (!editingState) return

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
  }, [editingState])

  // 섹션 추가
  const addSection = useCallback(() => {
    if (!editingState) return

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
  }, [editingState])

  // 섹션 삭제
  const deleteSection = useCallback((sectionIndex: number) => {
    if (!editingState || editingState.sections.length <= 1) return

    setEditingState(prev => {
      if (!prev) return prev

      const newSections = prev.sections.filter((_, index) => index !== sectionIndex)

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [editingState])

  // 앨범 정보 업데이트
  const updateAlbumInfo = useCallback((updates: Partial<EditingAlbumInfo>) => {
    if (!editingState) return

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
  }, [editingState])

  // 저장
  const save = useCallback(async () => {
    if (!editingState || !timelineAlbum) return

    try {
      // 업데이트할 데이터
      const updateData = {
        name: editingState.albumInfo.name,
        description: editingState.albumInfo.description,
        thumbnailId: editingState.albumInfo.thumbnailId || editingState.albumInfo.coverImage?.id || 0,
        startDate: editingState.albumInfo.startDate,
        endDate: editingState.albumInfo.endDate,
        sections: editingState.sections.map(section => {
          const isExistingSection = timelineAlbum?.sections.some(originalSection => originalSection.id === section.id)
          
          return {
            ...(isExistingSection && { id: section.id }),
            name: section.name,
            description: section.description,
            startDate: section.startDate,
            endDate: section.endDate,
            photoIds: section.photoIds
          }
        })
      }

      // Optimistic update: 먼저 캐시를 업데이트하여 즉시 UI 반영
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const queryKey = query.queryKey as string[]
            return queryKey[0] === 'timelineAlbums' && queryKey[1] === groupId
          }
        },
        (oldData: any) => {
          if (!oldData?.list) return oldData
          
          // 해당 앨범의 정보를 업데이트
          const updatedList = oldData.list.map((album: any) => {
            if (album.albumId === parseInt(albumId)) {
              return {
                ...album,
                name: updateData.name,
                description: updateData.description,
                startDate: updateData.startDate,
                endDate: updateData.endDate,
                updatedAt: new Date().toISOString()
              }
            }
            return album
          })
          
          return {
            ...oldData,
            list: updatedList
          }
        }
      )

      // 서버 업데이트 실행
      await new Promise((resolve, reject) => {
        updateTimelineAlbum(updateData)
        setTimeout(resolve, 100)
      })

      // 최신 데이터 리페치 (서버와 동기화)
      await refetchTimeline()
      
      // 백그라운드에서 그룹스페이스 데이터도 다시 가져오기
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[]
          return queryKey[0] === 'timelineAlbums' && queryKey[1] === groupId
        }
      })
      
      // 편집 모드 종료
      setIsEditMode(false)
      setEditingState(null)
      
    } catch (error) {
      console.error('앨범 저장 실패:', error)
      
      // 에러 발생시 캐시 원상복구
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[]
          return queryKey[0] === 'timelineAlbums' && queryKey[1] === groupId
        }
      })
      
      throw error
    }
  }, [editingState, timelineAlbum, updateTimelineAlbum, refetchTimeline, queryClient, groupId, albumId])

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